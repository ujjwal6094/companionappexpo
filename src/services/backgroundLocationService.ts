import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { LocationPayload } from '../types/location';
import { queueLocation, syncQueue, getPendingLocationsCount } from './locationQueueService';
import { postLocation } from '../api/locationApi';
import { getDeviceId } from './deviceService';
import { getUserConfig, getTrackingStartTime, setTrackingStartTime, clearTrackingStartTime, clearUserConfig } from '../storage/storage';

const LOCATION_TASK_NAME = 'background-location-task';

// ─── GPS Filtering Constants ────────────────────────────────────
// Reject readings whose horizontal accuracy exceeds this (meters).
// When GPS loses satellite lock the OS keeps delivering cached coords with
// accuracy degrading from ~8 m to 20-40+ m.  30 m is a safe cut-off that
// still allows city-driving with moderate signal.
const MAX_ACCURACY_METERS = 30;

// If the device has moved less than this distance since the last accepted
// reading we treat it as GPS jitter / stale cached coordinate and skip it.
const STALE_DISTANCE_METERS = 3;

// Maximum plausible ground speed (m/s).  55 m/s ≈ 198 km/h.
// Any jump exceeding this speed is treated as a teleportation spike
// (e.g. the OS dumping a stale cached location from a different area).
const MAX_SPEED_MPS = 55;

// Minimum distance (meters) the device must travel before the OS delivers
// a new location callback.  Works together with timeInterval — the callback
// fires when BOTH the time interval has elapsed AND the device has moved
// at least this far.  Prevents the OS from firing on pure timer ticks when
// the device is stationary or GPS is cached.
const MIN_DISTANCE_INTERVAL = 5;

// ─── Module-level State ─────────────────────────────────────────
let _onStateChange: ((state: { enabled: boolean }) => void) | null = null;
let _onLog: ((msg: string) => void) | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

// GPS filtering state — persists as long as the foreground-service JS
// context is alive (i.e. for the entire tracking session).  Resets when
// tracking is started or stopped.
let _lastAcceptedLat: number | null = null;
let _lastAcceptedLng: number | null = null;
let _lastAcceptedTimestamp: number | null = null;

// ─── Utility: Haversine Distance (meters) ───────────────────────
const _haversineMeters = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── GPS Location Filter ────────────────────────────────────────
/**
 * Returns a human-readable rejection reason if the location should be
 * discarded, or `null` if the location passes every gate and should be
 * recorded.
 *
 * Filter gates (evaluated in order):
 *   1. Accuracy gate   — reject if horizontal accuracy > MAX_ACCURACY_METERS
 *   2. Stale/duplicate — reject if device moved < STALE_DISTANCE_METERS
 *   3. Teleportation   — reject if implied speed > MAX_SPEED_MPS
 */
const _shouldRejectLocation = (
  lat: number,
  lng: number,
  accuracy: number | null,
  timestamp: number
): string | null => {

  // Gate 1 — Accuracy
  if (accuracy !== null && accuracy > MAX_ACCURACY_METERS) {
    return `accuracy too poor (${accuracy.toFixed(1)}m > ${MAX_ACCURACY_METERS}m limit)`;
  }

  // First point after session start — always accept
  if (_lastAcceptedLat === null || _lastAcceptedLng === null) {
    return null;
  }

  const distance = _haversineMeters(_lastAcceptedLat, _lastAcceptedLng, lat, lng);

  // Gate 2 — Stale / duplicate
  if (distance < STALE_DISTANCE_METERS) {
    return `stale/duplicate (moved ${distance.toFixed(1)}m < ${STALE_DISTANCE_METERS}m threshold)`;
  }

  // Gate 3 — Teleportation spike
  if (_lastAcceptedTimestamp !== null) {
    const timeDeltaSec = (timestamp - _lastAcceptedTimestamp) / 1000;
    if (timeDeltaSec > 0) {
      const speedMps = distance / timeDeltaSec;
      if (speedMps > MAX_SPEED_MPS) {
        return (
          `teleportation spike (${distance.toFixed(0)}m in ` +
          `${timeDeltaSec.toFixed(0)}s = ${(speedMps * 3.6).toFixed(0)} km/h)`
        );
      }
    }
  }

  return null; // All gates passed
};

// ─── Background Task Definition ─────────────────────────────────
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    _onLog && _onLog(`[Location Error] ${error.message}`);
    return;
  }
  if (data) {
    const startTime = await getTrackingStartTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    // Auto-stop tracking if 24 hours have elapsed since it started
    if (startTime && (Date.now() - startTime) > TWENTY_FOUR_HOURS) {
      _onLog && _onLog(`[Location] 24-hour limit reached. Auto-stopping tracking.`);
      await stopTracking();
      return;
    }

    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      const config = await getUserConfig();
      if (!config) {
        _onLog && _onLog('[Location] Error: User config not found');
        return;
      }
      const deviceId = await getDeviceId();

      if (!config.tripId) {
        _onLog && _onLog('[Location] WARNING: config.tripId is empty or undefined!');
      }

      for (const location of locations) {
        const lat = location.coords.latitude;
        const lng = location.coords.longitude;
        const accuracy = location.coords.accuracy;
        const timestamp = location.timestamp;

        // ── Apply GPS quality filters ──────────────────────────
        const rejectReason = _shouldRejectLocation(lat, lng, accuracy, timestamp);
        if (rejectReason) {
          _onLog && _onLog(`[Location] Filtered: ${rejectReason}`);
          continue;
        }

        // ── Point accepted — update tracking state BEFORE the
        //    send attempt so that subsequent stale readings from
        //    the same position are still caught even if the API
        //    call or queue write fails.
        _lastAcceptedLat = lat;
        _lastAcceptedLng = lng;
        _lastAcceptedTimestamp = timestamp;

        _onLog && _onLog(
          `[Location] Accepted: ${lat.toFixed(6)}, ${lng.toFixed(6)} ` +
          `(accuracy: ${accuracy?.toFixed(1) ?? '?'}m)`
        );

        try {
          const payload: LocationPayload = {
            tripnum: config.tripId,
            deviceid: deviceId,
            personid: config.employeeId,
            latitudey: lat,
            longitudex: lng,
            accuracy: accuracy || 0,
            createdate: new Date(timestamp).toISOString(),
          };
          console.log(`[LocationService] Prepared payload: ${JSON.stringify(payload)}`);

          // Ensure strict FIFO queue: if earlier points are pending, queue this point too
          const pending = await getPendingLocationsCount();
          if (pending > 0) {
            await queueLocation(payload);
            await syncQueue(_onLog ?? console.log);
          } else {
            // Try sending immediately, fall back to queue on failure
            try {
              await postLocation(payload);
              console.log('[Location] Successfully uploaded to API');
              _onLog && _onLog('[Location] Successfully uploaded to API');
            } catch (err: any) {
              console.error(`[Location] Upload failed, adding to queue. Error: ${err.message}`);
              _onLog && _onLog(`[Location] Upload failed, queued. Error: ${err.message}`);
              await queueLocation(payload);
            }
          }
        } catch (e: any) {
          console.error(`[Location] Processing error: ${e.message}`);
          _onLog && _onLog(`[Location] Processing error: ${e.message}`);
        }
      }
    }
  }
});

// ─── Public API ─────────────────────────────────────────────────

export const initializeBackgroundGeolocation = async (
  onStateChange: (state: { enabled: boolean }) => void,
  onLog: (msg: string) => void
): Promise<void> => {
  _onStateChange = onStateChange;
  _onLog = onLog;

  const isTracking = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  onStateChange({ enabled: isTracking });
  onLog(`[BackgroundGeolocation] initialized. Currently tracking: ${isTracking}`);

  // Clear any existing interval before starting a new one (prevents leaks on re-init / HMR)
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  // Heartbeat: sync offline queue periodically only when pending locations exist
  heartbeatInterval = setInterval(async () => {
    const pending = await getPendingLocationsCount();
    if (pending > 0) {
      onLog(`[Heartbeat] Syncing ${pending} pending locations...`);
      await syncQueue(onLog);
    }
  }, 10000);
};

export const startTracking = async (): Promise<void> => {
  const config = await getUserConfig();
  // Assume interval is passed in seconds, default to 5 seconds
  const intervalSeconds = config?.interval ? parseInt(config.interval, 10) : 5;
  const intervalMs = (isNaN(intervalSeconds) || intervalSeconds < 1 ? 5 : intervalSeconds) * 1000;

  console.log(`[LocationService] Extracted raw interval from config: ${config?.interval}`);
  console.log(`[LocationService] Calculated intervalMs: ${intervalMs} (Seconds: ${intervalMs / 1000})`);

  // Reset GPS filtering state for the new tracking session.
  // This ensures the very first reading of a new trip is always accepted
  // (no stale comparison from the previous trip).
  _lastAcceptedLat = null;
  _lastAcceptedLng = null;
  _lastAcceptedTimestamp = null;

  // Always call startLocationUpdatesAsync to ensure the Foreground Service is forcefully restarted
  // even if the task was left registered in the database from an incomplete exit.
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: intervalMs,
    deferredUpdatesInterval: intervalMs,
    distanceInterval: MIN_DISTANCE_INTERVAL,   // OS-level gate: only fire if moved ≥ N meters
    showsBackgroundLocationIndicator: true,     // iOS: shows blue bar
    foregroundService: {
      notificationTitle: 'Location tracking active',
      notificationBody: 'Your location is being shared with Maximo',
      notificationColor: '#1a73e8',
    },
    pausesUpdatesAutomatically: false, // iOS: prevent OS pausing updates
  });

  await setTrackingStartTime(Date.now());

  if (_onStateChange) _onStateChange({ enabled: true });
};

export const stopTracking = async (): Promise<void> => {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
  await clearTrackingStartTime();

  // Reset GPS filtering state
  _lastAcceptedLat = null;
  _lastAcceptedLng = null;
  _lastAcceptedTimestamp = null;

  // ── Final sync attempt ─────────────────────────────────────
  // Try to upload any locations still sitting in the offline queue.
  //
  // IMPORTANT: We intentionally do NOT call clearQueue() here.
  // syncQueue() already removes each item from the queue as it is
  // successfully uploaded.  Items that fail (e.g. device is offline)
  // remain in the queue and will be retried on the next app launch
  // when the heartbeat interval resumes in initializeBackgroundGeolocation.
  //
  // Previously, clearQueue() was called unconditionally after syncQueue(),
  // which silently WIPED all pending locations that could not be sent
  // while offline — causing permanent data loss.
  try {
    await syncQueue(_onLog ?? console.log);
  } catch (e) {
    console.warn('[stopTracking] Final sync attempt failed. Queued locations preserved for later.', e);
  }

  const remaining = await getPendingLocationsCount();
  if (remaining > 0) {
    const msg = `[stopTracking] ${remaining} location(s) still pending in offline queue. Session preserved to sync once online.`;
    (_onLog ?? console.log)(msg);
  } else {
    (_onLog ?? console.log)('[stopTracking] All locations synced successfully. Clearing session data.');
    await clearUserConfig();
  }

  if (_onStateChange) _onStateChange({ enabled: false });
};

export const getCurrentTrackingState = async (): Promise<{ enabled: boolean }> => {
  const isTracking = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  return { enabled: isTracking };
};
