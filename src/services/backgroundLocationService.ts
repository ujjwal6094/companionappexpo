import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { LocationPayload } from '../types/location';
import { queueLocation, syncQueue, clearQueue } from './locationQueueService';
import { postLocation } from '../api/locationApi';
import { getDeviceId } from './deviceService';
import { getUserConfig, getTrackingStartTime, setTrackingStartTime, clearTrackingStartTime } from '../storage/storage';

const LOCATION_TASK_NAME = 'background-location-task';
let _onStateChange: ((state: { enabled: boolean }) => void) | null = null;
let _onLog: ((msg: string) => void) | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

// Define the background task
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
      for (const location of locations) {
        _onLog && _onLog(`[Location] received: ${location.coords.latitude}, ${location.coords.longitude}`);

        try {
          const config = await getUserConfig();
          if (!config) {
            _onLog && _onLog('[Location] Error: User config not found');
            continue;
          }

          const deviceId = await getDeviceId();

          if (!config.tripId) {
            _onLog && _onLog('[Location] WARNING: config.tripId is empty or undefined!');
          }

          const payload: LocationPayload = {
            tripnum: config.tripId,
            deviceid: deviceId,
            personid: config.employeeId,
            latitudey: location.coords.latitude,
            longitudex: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            createdate: new Date(location.timestamp).toISOString(),
          };
          console.log(`[LocationService] Prepared payload: ${JSON.stringify(payload)}`);

          // Try sending immediately, fall back to queue on failure
          try {
            await postLocation(payload);
            console.log('[Location] Successfully uploaded to API');
            _onLog && _onLog('[Location] Successfully uploaded to API');
          } catch (err: any) {
            console.error(`[Location] Upload failed, adding to queue. Error: ${err.message}`);
            _onLog && _onLog(`[Location] Upload failed, adding to queue. Error: ${err.message}`);
            await queueLocation(payload);
          }
        } catch (e: any) {
          console.error(`[Location] Processing error: ${e.message}`);
          _onLog && _onLog(`[Location] Processing error: ${e.message}`);
        }
      }
    }
  }
});

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

  // Heartbeat: sync offline queue every 10 seconds while the app is alive (foreground)
  heartbeatInterval = setInterval(async () => {
    onLog(`[Heartbeat] Syncing pending locations...`);
    await syncQueue(onLog);
  }, 10000);
};

export const startTracking = async (): Promise<void> => {
  const config = await getUserConfig();
  // Assume interval is passed in seconds, default to 5 seconds
  const intervalSeconds = config?.interval ? parseInt(config.interval, 10) : 5;
  const intervalMs = (isNaN(intervalSeconds) || intervalSeconds < 1 ? 5 : intervalSeconds) * 1000;

  console.log(`[LocationService] Extracted raw interval from config: ${config?.interval}`);
  console.log(`[LocationService] Calculated intervalMs: ${intervalMs} (Seconds: ${intervalMs / 1000})`);

  // Always call startLocationUpdatesAsync to ensure the Foreground Service is forcefully restarted
  // even if the task was left registered in the database from an incomplete exit.
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: intervalMs,
    deferredUpdatesInterval: intervalMs,
    showsBackgroundLocationIndicator: true, // iOS: shows blue bar
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

  // Sync any remaining offline locations BEFORE clearing the queue
  // so we don't lose data that was queued but not yet sent.
  try {
    await syncQueue(_onLog ?? console.log);
  } catch (e) {
    console.warn('[stopTracking] Final sync failed, clearing queue anyway:', e);
  }
  await clearQueue();

  if (_onStateChange) _onStateChange({ enabled: false });
};

export const getCurrentTrackingState = async (): Promise<{ enabled: boolean }> => {
  const isTracking = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  return { enabled: isTracking };
};
