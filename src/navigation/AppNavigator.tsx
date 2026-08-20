import React, { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LogsScreen } from '../screens/LogsScreen';
import { saveUserConfig } from '../storage/storage';
import { startTracking, stopTracking } from '../services/backgroundLocationService';
import { requestLocationPermissions } from '../services/permissionService';

const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

export const AppNavigator = () => {
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) return;
      const parsed = Linking.parse(url);

      // Stop tracking and exit app
      if (parsed.path === 'stop' || url.includes('://stop')) {
        await stopTracking();
        setTimeout(() => {
          BackHandler.exitApp();
        }, 500);
        return;
      }

      // Start tracking automatically
      if (parsed.path === 'start' || url.includes('://start')) {
        if (parsed.queryParams) {
          const { employeeId, apiUrl, token, interval, tripId, orgid } = parsed.queryParams;
          console.log(`[AppNavigator] Received start intent with params: employeeId=${employeeId}, interval=${interval}, tripId=${tripId}, orgid=${orgid}`);
          // Even if token is empty, we must try to process it, or alert
          if (employeeId && apiUrl) {
            await saveUserConfig({
              employeeId: String(employeeId),
              apiBaseUrl: String(apiUrl),
              authToken: String(token || ''),
              interval: interval ? String(interval) : '5',
              tripId: tripId ? String(tripId) : undefined,
              orgid: orgid ? String(orgid) : undefined
            });
            console.log(`[AppNavigator] Saved config with interval: ${interval ? String(interval) : '5'} and tripId: ${tripId || 'none'}`);

            await requestLocationPermissions();
            await startTracking();

            // We are headless now! Minimize the app instantly so the user doesn't see it.

            setTimeout(() => {
              BackHandler.exitApp();
            }, 500);
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
