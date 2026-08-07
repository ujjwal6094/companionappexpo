import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { clearUserConfig } from '../storage/storage';
import { requestLocationPermissions } from '../services/permissionService';
import { 
  initializeBackgroundGeolocation, 
  startTracking, 
  stopTracking, 
  getCurrentTrackingState 
} from '../services/backgroundLocationService';
import { syncQueue } from '../services/locationQueueService';

export const HomeScreen = ({ navigation }: any) => {
  const [isTracking, setIsTracking] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastLocation, setLastLocation] = useState<string>('Unknown');

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev].slice(0, 50)); // Keep last 50 logs
    
    // Simple parsing for last location display
    if (msg.includes('[Location] received:')) {
      const coords = msg.split('[Location] received:')[1].trim();
      setLastLocation(coords);
    }
  };

  useEffect(() => {
    const init = async () => {
      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Location permission is required.');
      }

      await initializeBackgroundGeolocation(
        (state) => {
          setIsTracking(state.enabled);
        },
        addLog
      );

      const currentState = await getCurrentTrackingState();
      setIsTracking(currentState.enabled);
    };

    init();
  }, []);

  const handleStartTracking = async () => {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return;
    }
    
    await startTracking();
    setIsTracking(true);
    addLog('Tracking manually started');
  };

  const handleStopTracking = async () => {
    await stopTracking();
    setIsTracking(false);
    addLog('Tracking manually stopped');
  };

  const handleSync = async () => {
    addLog('Manual sync initiated...');
    await syncQueue(addLog);
  };

  const handleLogout = async () => {
    await stopTracking();
    await clearUserConfig();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Companion Tracker</Text>
        <Text style={styles.status}>Status: {isTracking ? '🟢 ON' : '🔴 OFF'}</Text>
        <Text style={styles.location}>Last Location: {lastLocation}</Text>
      </View>

      <View style={styles.buttons}>
        <Button 
          title="Start Tracking" 
          onPress={handleStartTracking} 
          disabled={isTracking} 
        />
        <View style={styles.spacer} />
        <Button 
          title="Stop Tracking" 
          onPress={handleStopTracking} 
          disabled={!isTracking} 
          color="red"
        />
        <View style={styles.spacer} />
        <Button title="Sync Pending Locations" onPress={handleSync} />
        <View style={styles.spacer} />
        <Button title="View Logs & Queue" onPress={() => navigation.navigate('Logs')} color="purple" />
        <View style={styles.spacer} />
        <Button title="Logout" onPress={handleLogout} color="gray" />
      </View>

      <Text style={styles.logTitle}>Recent Activity:</Text>
      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 18,
    marginTop: 10,
    fontWeight: '600',
  },
  location: {
    fontSize: 14,
    marginTop: 5,
    color: '#666',
  },
  buttons: {
    marginBottom: 20,
  },
  spacer: {
    height: 10,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  logText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
});
