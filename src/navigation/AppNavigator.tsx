import React, { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LogsScreen } from '../screens/LogsScreen';
import { saveUserConfig } from '../storage/storage';
import { startTracking, stopTracking } from '../services/backgroundLocationService';
import { syncQueue, getPendingLocationsCount } from '../services/locationQueueService';
import { requestLocationPermissions, checkLocationServicesEnabled, hasLocationPermissionsGranted } from '../services/permissionService';

const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

/**
 * Minimizes the app after starting tracking.
 * - Android: BackHandler.exitApp() moves the app to background.
 * - iOS: BackHandler is not available, so we navigate to Home screen.
 *   The user will need to manually background the app on iOS.
 */
const minimizeOrNavigateHome = () => {
  if (Platform.OS === 'android') {
    setTimeout(() => {
      BackHandler.exitApp();
    }, 3500);
  } else if (Platform.OS === 'ios') {
    setTimeout(() => {
      Linking.openURL('maximomobile://')
        .catch(err => console.log("Failed to return to Maximo Mobile:", err));
    }, 3500);
  }
};

export const AppNavigator = () => {
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) return;
      const parsed = Linking.parse(url);

      // Stop tracking and exit app
      if (parsed.path === 'stop' || url.includes('://stop')) {
        await stopTracking();
        if (Platform.OS === 'android') {
          setTimeout(() => BackHandler.exitApp(), 3500);
        } else if (Platform.OS === 'ios') {
          setTimeout(() => {
            Linking.openURL('maximomobile://')
              .catch(err => console.log("Failed to return to Maximo Mobile:", err));
          }, 3500);
        }
        return;
      }

      // Start tracking automatically via deep link (supports start, setup, track)
      const path = (parsed.path || '').toLowerCase();
      const isStartAction =
        path === 'start' ||
        path === 'setup' ||
        path === 'track' ||
        url.includes('://start') ||
        url.includes('://setup') ||
        url.includes('://track');

      if (isStartAction && parsed.queryParams) {
        const q = parsed.queryParams;
        const employeeId = q.employeeId || q.personid || q.personId || q.userId || q.userid;
        const apiUrl = q.apiUrl || q.apiurl || q.url;
        const token = q.token || q.apikey || q.authToken || '';
        const interval = q.interval || '5';
        const tripId = q.tripId || q.tripid || q.tripnum || q.tripNum;
        const orgid = q.orgid || q.orgId;

        console.log(
          `[AppNavigator] Received start/setup intent with params: employeeId=${employeeId}, interval=${interval}, tripId=${tripId}, orgid=${orgid}`
        );

        if (employeeId && apiUrl) {
          // 1. If previous pending locations exist from prior offline trips, flush them first
          try {
            const pending = await getPendingLocationsCount();
            if (pending > 0) {
              console.log(`[AppNavigator] Flushing ${pending} previous pending offline locations before starting new trip...`);
              await Promise.race([
                syncQueue(msg => console.log(`[PreSync] ${msg}`)),
                new Promise(resolve => setTimeout(resolve, 5000)) // 5s timeout guard so we don't block if still offline
              ]);
            }
          } catch (syncErr) {
            console.warn('[AppNavigator] Pre-sync finished with note:', syncErr);
          }

          const cleanTripId = tripId && tripId !== 'null' && tripId !== 'undefined' ? String(tripId) : undefined;
          await saveUserConfig({
            employeeId: String(employeeId),
            apiBaseUrl: String(apiUrl),
            authToken: String(token || ''),
            interval: interval ? String(interval) : '5',
            tripId: cleanTripId,
            orgid: orgid ? String(orgid) : undefined,
          });
          console.log(
            `[AppNavigator] Saved config with interval: ${interval ? String(interval) : '5'} and tripId: ${cleanTripId || 'none'}`
          );

          // Check if location permissions are already granted (protects against launching background tracking without prominent disclosure)
          const hasPermission = await hasLocationPermissionsGranted();
          if (!hasPermission) {
            console.warn('[AppNavigator] Permissions not yet granted — navigating to Home for disclosure & consent.');
            if (navigationRef.isReady()) {
              navigationRef.navigate('Home' as never);
            }
            return;
          }

          await startTracking();

          // Go headless: minimize on Android, navigate to Home on iOS
          minimizeOrNavigateHome();
        }
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Logs"
          component={LogsScreen}
          options={{ title: 'Offline Queue & Logs' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
