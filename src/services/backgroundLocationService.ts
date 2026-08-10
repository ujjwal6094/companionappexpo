import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { LocationPayload } from '../types/location';
import { queueLocation, syncQueue } from './locationQueueService';
import { postLocation } from '../api/locationApi';
import { getDeviceId } from './deviceService';
import { getUserConfig, getTrackingStartTime, setTrackingStartTime, clearTrackingStartTime } from '../storage/storage';

const LOCATION_TASK_NAME = 'background-location-task';
let _onStateChange: ((state: { enabled: boolean }) => void) | null = null;
let _onLog: ((msg: string) => void) | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

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
          const payload: LocationPayload = {
            'spi:refobject': 'LABOR',
            'spi:key1': 'TQCERT',
            'spi:key2': config.employeeId,
            'spi:latitude': location.coords.latitude,
            'spi:longitude': location.coords.longitude,
            'spi:altitude': location.coords.altitude || null,
            'spi:locationaccuracy': location.coords.accuracy || 0,
            'spi:lastupdate': new Date(location.timestamp).toISOString(),
            'spi:speed': location.coords.speed || null,
            'spi:heading': location.coords.heading || null,
          };

          // Removed wonum/key3 as per user request to only send location

          // Try sending immediately
          try {
            await postLocation(payload);
            _onLog && _onLog('[Location] Successfully uploaded to API');
          } catch (err: any) {
            _onLog && _onLog(`[Location] Upload failed, adding to queue. Error: ${err.message}`);
            await queueLocation(payload);
          }
        } catch (e: any) {
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

  // Setup Heartbeat to sync offline queue every 5 minutes while the app is alive
  if (!heartbeatInterval) {
    heartbeatInterval = setInterval(async () => {
      onLog(`[Heartbeat] Syncing pending locations...`);
      await syncQueue(onLog);
    }, 5 * 60 * 1000); // 5 minutes
  }
};

export const startTracking = async (): Promise<void> => {
  // Always call startLocationUpdatesAsync to ensure the Foreground Service is forcefully restarted
  // even if the task was left registered in the database from an incomplete exit.
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 300000, // 5 minutes (Android only)
    deferredUpdatesInterval: 300000, // Process updates every 5 minutes (iOS)
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Location tracking active",
      notificationBody: "Your location is being shared with Maximo",
      notificationColor: "#fff",
    },
    pausesUpdatesAutomatically: false
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
  
  if (_onStateChange) _onStateChange({ enabled: false });
};

export const getCurrentTrackingState = async (): Promise<{ enabled: boolean }> => {
  const isTracking = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  return { enabled: isTracking };
};
