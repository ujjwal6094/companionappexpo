import { LocationPayload } from '../types/location';
import { addToLocationQueue, getLocationQueue, saveLocationQueue } from '../storage/storage';
import { postLocation } from '../api/locationApi';

export const queueLocation = async (location: LocationPayload): Promise<void> => {
  await addToLocationQueue(location);
};

export const syncQueue = async (
  onLog: (msg: string) => void = () => {}
): Promise<void> => {
  const queue = await getLocationQueue();
  if (queue.length === 0) {
    return; // Nothing to sync
  }

  onLog(`Syncing ${queue.length} pending locations...`);

  const remainingQueue: LocationPayload[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const loc of queue) {
    try {
      await postLocation(loc);
      successCount++;
    } catch (e: any) {
      failCount++;
      remainingQueue.push(loc);
      onLog(`Failed to upload location at ${loc.createdate}: ${e.message}`);
    }
  }

  await saveLocationQueue(remainingQueue);
  
  if (successCount > 0) {
    onLog(`Successfully synced ${successCount} locations.`);
  }
  if (failCount > 0) {
    onLog(`Failed to sync ${failCount} locations. They remain in the queue.`);
  }
};

export const getPendingLocationsCount = async (): Promise<number> => {
  const queue = await getLocationQueue();
  return queue.length;
};

export const clearQueue = async (): Promise<void> => {
  await saveLocationQueue([]);
};
