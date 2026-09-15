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
import { requestLocationPermissions, checkLocationServicesEnabled } from '../services/permissionService';

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
    }, 500);
  } else {
    // iOS: navigate to Home so user can see tracking is active, then background manually
    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('Home' as never);
      }
    }, 300);
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
          setTimeout(() => BackHandler.exitApp(), 500);
        }
        return;
      }

      // Start tracking automatically via deep link
      if (parsed.path === 'start' || url.includes('://start')) {
        if (parsed.queryParams) {
          const { employeeId, apiUrl, token, interval, tripId, orgid } = parsed.queryParams;
          console.log(
            `[AppNavigator] Received start intent with params: employeeId=${employeeId}, interval=${interval}, tripId=${tripId}, orgid=${orgid}`
          );

          if (employeeId && apiUrl) {
            await saveUserConfig({
              employeeId: String(employeeId),
              apiBaseUrl: String(apiUrl),
              authToken: String(token || ''),
              interval: interval ? String(interval) : '5',
              tripId: tripId ? String(tripId) : undefined,
              orgid: orgid ? String(orgid) : undefined,
            });
            console.log(
              `[AppNavigator] Saved config with interval: ${interval ? String(interval) : '5'} and tripId: ${tripId || 'none'}`
            );

            // Always check that location services are enabled (every deep link open, not just first time)
            const hasPermission = await requestLocationPermissions();
            if (!hasPermission) {
              console.warn('[AppNavigator] Permission denied — tracking not started.');
              // Navigate to Home so user sees the issue instead of blank screen
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
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Maximo Companion' }}
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
