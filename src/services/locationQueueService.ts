import { LocationPayload } from '../types/location';
import { addToLocationQueue, getLocationQueue, saveLocationQueue, clearUserConfig } from '../storage/storage';
import { postLocation } from '../api/locationApi';
import * as TaskManager from 'expo-task-manager';

export const queueLocation = async (location: LocationPayload): Promise<void> => {
  await addToLocationQueue(location);
};

let isSyncing = false;

export const syncQueue = async (
  onLog: (msg: string) => void = () => {}
): Promise<void> => {
  if (isSyncing) {
    return;
  }

  isSyncing = true;
  try {
    const queue = await getLocationQueue();
    if (queue.length === 0) {
      return; // Nothing to sync
    }

    onLog(`Syncing ${queue.length} pending locations...`);

    const syncedTimestamps = new Set<string>();
    let successCount = 0;
    let failCount = 0;

    for (const loc of queue) {
      try {
        await postLocation(loc);
        successCount++;
        if (loc.createdate) {
          syncedTimestamps.add(loc.createdate);
        }
      } catch (e: any) {
        failCount++;
        onLog(`Failed to upload location at ${loc.createdate}: ${e.message}`);
        // If network request failed, do not hammer the server with the rest of the queue
        break;
      }
    }

    if (syncedTimestamps.size > 0) {
      // Re-fetch current queue to safely keep items that arrived while sync was in flight
      const currentQueue = await getLocationQueue();
      const updatedQueue = currentQueue.filter(item => !item.createdate || !syncedTimestamps.has(item.createdate));
      await saveLocationQueue(updatedQueue);

      // If the queue is now completely empty and tracking is inactive, clear the session data
      if (updatedQueue.length === 0) {
        const isRegistered = await TaskManager.isTaskRegisteredAsync('background-location-task');
        if (!isRegistered) {
          await clearUserConfig();
          onLog('[Sync] All pending locations flushed. Session data cleared.');
        }
      }
    }
    
    if (successCount > 0) {
      onLog(`Successfully synced ${successCount} locations.`);
    }
    if (failCount > 0) {
      onLog(`Sync paused. Remaining locations kept in offline queue.`);
    }
  } finally {
    isSyncing = false;
  }
};

export const getPendingLocationsCount = async (): Promise<number> => {
  const queue = await getLocationQueue();
  return queue.length;
};

export const clearQueue = async (): Promise<void> => {
  await saveLocationQueue([]);
};
