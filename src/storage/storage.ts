import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { UserConfig, LocationPayload } from '../types/location';

const CONFIG_KEY = '@app_user_config';
const LOCATION_QUEUE_KEY = '@app_location_queue';
const DEVICE_ID_KEY = '@app_device_id';
const TRACKING_START_KEY = '@app_tracking_start';
const SECURE_AUTH_TOKEN_KEY = 'secure_maximo_auth_token';
const LOCATION_DISCLOSURE_KEY = '@app_location_disclosure_accepted';
const MAX_QUEUE_SIZE = 5000;

export const hasAcceptedLocationDisclosure = async (): Promise<boolean> => {
  const data = await AsyncStorage.getItem(LOCATION_DISCLOSURE_KEY);
  return data === 'true';
};

export const setLocationDisclosureAccepted = async (accepted: boolean = true): Promise<void> => {
  await AsyncStorage.setItem(LOCATION_DISCLOSURE_KEY, accepted ? 'true' : 'false');
};

export const saveUserConfig = async (config: UserConfig): Promise<void> => {
  try {
    if (config.authToken && (await SecureStore.isAvailableAsync())) {
      await SecureStore.setItemAsync(SECURE_AUTH_TOKEN_KEY, config.authToken);
      // Store config in AsyncStorage with a placeholder so sensitive token is not stored unencrypted
      const sanitizedConfig = { ...config, authToken: '[SECURE_KEYCHAIN]' };
      await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(sanitizedConfig));
      return;
    }
  } catch (err) {
    console.warn('[Storage] SecureStore write failed, falling back to AsyncStorage:', err);
  }
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const getUserConfig = async (): Promise<UserConfig | null> => {
  const data = await AsyncStorage.getItem(CONFIG_KEY);
  if (!data) return null;

  try {
    const config: UserConfig = JSON.parse(data);
    if (await SecureStore.isAvailableAsync()) {
      const secureToken = await SecureStore.getItemAsync(SECURE_AUTH_TOKEN_KEY);
      if (secureToken) {
        config.authToken = secureToken;
      }
    }
    return config;
  } catch (err) {
    console.warn('[Storage] Error reading config or SecureStore token:', err);
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
};

export const clearUserConfig = async (): Promise<void> => {
  try {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync(SECURE_AUTH_TOKEN_KEY);
    }
  } catch (err) {
    console.warn('[Storage] Error clearing SecureStore token:', err);
  }
  await AsyncStorage.removeItem(CONFIG_KEY);
};

export const setTrackingStartTime = async (timeMs: number): Promise<void> => {
  await AsyncStorage.setItem(TRACKING_START_KEY, timeMs.toString());
};

export const getTrackingStartTime = async (): Promise<number | null> => {
  const data = await AsyncStorage.getItem(TRACKING_START_KEY);
  return data ? parseInt(data, 10) : null;
};

export const clearTrackingStartTime = async (): Promise<void> => {
  await AsyncStorage.removeItem(TRACKING_START_KEY);
};

export const saveDeviceId = async (deviceId: string): Promise<void> => {
  await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
};

export const getDeviceId = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(DEVICE_ID_KEY);
};

// Queue operations
export const getLocationQueue = async (): Promise<LocationPayload[]> => {
  const data = await AsyncStorage.getItem(LOCATION_QUEUE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveLocationQueue = async (queue: LocationPayload[]): Promise<void> => {
  // Ensure we don't exceed max queue size (keep newest)
  if (queue.length > MAX_QUEUE_SIZE) {
    queue = queue.slice(queue.length - MAX_QUEUE_SIZE);
  }
  await AsyncStorage.setItem(LOCATION_QUEUE_KEY, JSON.stringify(queue));
};

export const addToLocationQueue = async (location: LocationPayload): Promise<void> => {
  const queue = await getLocationQueue();
  queue.push(location);
  await saveLocationQueue(queue);
};

export const clearLocationQueue = async (): Promise<void> => {
  await AsyncStorage.removeItem(LOCATION_QUEUE_KEY);
};
