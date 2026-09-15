import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Checks that device location services (GPS/network) are turned ON.
 * Returns false if location services are off.
 */
export const checkLocationServicesEnabled = async (): Promise<boolean> => {
  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    console.warn('[Permissions] Location Services are disabled on the device.');
    return false;
  }
  return true;
};

/**
 * Requests notification permission.
 */
const requestNotificationPermission = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      const hasNotification = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (!hasNotification) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
      }
    }
  } else if (Platform.OS === 'ios') {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  }
};

/**
 * Full permission check that runs on every deep-link open.
 */
export const requestLocationPermissions = async (): Promise<boolean> => {
  try {
    const servicesEnabled = await checkLocationServicesEnabled();
    if (!servicesEnabled) {
      return false;
    }

    await requestNotificationPermission();

    let fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== 'granted') {
      fg = await Location.requestForegroundPermissionsAsync();
    }
    if (fg.status !== 'granted') {
      console.warn('[Permissions] Foreground location permission denied');
      return false;
    }

    let bg = await Location.getBackgroundPermissionsAsync();
    if (bg.status !== 'granted') {
      bg = await Location.requestBackgroundPermissionsAsync();
    }
    if (bg.status !== 'granted') {
      console.warn('[Permissions] Background location permission denied');
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Permissions] Error requesting location permissions:', error);
    return false;
  }
};
