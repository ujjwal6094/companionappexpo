import { getDeviceId as fetchDeviceId, saveDeviceId } from '../storage/storage';
// In a real app, you might use react-native-device-info, but we will generate a UUID here for simplicity
// if one doesn't exist, to avoid adding another dependency unless needed.

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getDeviceId = async (): Promise<string> => {
  let deviceId = await fetchDeviceId();
  
  if (!deviceId) {
    deviceId = generateUUID();
    await saveDeviceId(deviceId);
  }
  
  return deviceId;
};
