import * as Location from 'expo-location';
import { Platform, PermissionsAndroid } from 'react-native';

export const requestLocationPermissions = async (): Promise<boolean> => {
  try {
    // 0. Request notification permission on Android 13+ (Required for Foreground Service to work!)
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const hasNotification = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (!hasNotification) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
    }

    // 1. Request foreground permission first
    let fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== 'granted') {
      fg = await Location.requestForegroundPermissionsAsync();
    }
    if (fg.status !== 'granted') {
      console.warn('Foreground location permission denied');
      return false;
    }

    // 2. Request background permission
    let bg = await Location.getBackgroundPermissionsAsync();
    if (bg.status !== 'granted') {
      bg = await Location.requestBackgroundPermissionsAsync();
    }
    if (bg.status !== 'granted') {
      console.warn('Background location permission denied');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return false;
  }
};
