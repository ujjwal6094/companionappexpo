import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { clearUserConfig } from '../storage/storage';
import { requestLocationPermissions, checkLocationServicesEnabled } from '../services/permissionService';
import { 
  initializeBackgroundGeolocation, 
  stopTracking, 
  getCurrentTrackingState 
} from '../services/backgroundLocationService';

export const HomeScreen = ({ navigation }: any) => {
  const [isTracking, setIsTracking] = useState(false);
  const [logs, setLogs] = useState<{time: string, msg: string, type: 'info' | 'error' | 'success'}[]>([]);
  const [lastLocation, setLastLocation] = useState<string>('Waiting for GPS...');

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    let type: 'info' | 'error' | 'success' = 'info';
    
    if (msg.toLowerCase().includes('error') || msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('filtered')) {
      type = 'error';
    } else if (msg.toLowerCase().includes('success') || msg.toLowerCase().includes('accepted') || msg.toLowerCase().includes('uploaded')) {
      type = 'success';
    }

    setLogs((prev) => [{ time, msg, type }, ...prev].slice(0, 100));
    
    if (msg.includes('Accepted:')) {
      const coords = msg.split('Accepted:')[1].trim();
      setLastLocation(coords);
    }
  };

  useEffect(() => {
    const init = async () => {
      const servicesOn = await checkLocationServicesEnabled();
      if (!servicesOn) {
        addLog('Error: Location Services are disabled');
        Alert.alert(
          'GPS is Off',
          'Please enable your GPS location services to use tracking features.',
          [{ text: 'OK' }]
        );
        return;
      }

      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) {
        addLog('Error: Location Permissions denied');
      }

      await initializeBackgroundGeolocation(
        (state) => {
          setIsTracking(state.enabled);
          addLog(state.enabled ? 'GPS Tracking Engine Started' : 'GPS Tracking Engine Stopped');
        },
        addLog
      );

      const currentState = await getCurrentTrackingState();
      setIsTracking(currentState.enabled);
    };

    init();
  }, []);

  const handleExportLogs = async () => {
    try {
      if (logs.length === 0) {
        addLog('Error: No logs to export');
        return;
      }
      const logText = logs.map(l => `[${l.time}] ${l.type.toUpperCase()}: ${l.msg}`).join('\n');
      const fileUri = `${FileSystem.documentDirectory}companion_logs_${new Date().getTime()}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, logText, { encoding: FileSystem.EncodingType.UTF8 });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Export Companion Logs',
          UTI: 'public.plain-text'
        });
        addLog('Success: Logs exported');
      } else {
        addLog('Error: Sharing not available on this device');
      }
    } catch (e: any) {
      console.error(e);
      addLog(`Error exporting logs: ${e.message || e}`);
    }
  };

  const handleLogout = async () => {
    await stopTracking();
    await clearUserConfig();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>System Logs</Text>
          <Text style={styles.subtitle}>Maximo Companion Engine</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleExportLogs}>
            <Text style={styles.iconText}>↓ Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
            <Text style={styles.iconText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Panel */}
      <View style={styles.statusPanel}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Tracking Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: isTracking ? '#059669' : '#DC2626' }]}>
            <View style={[styles.pulse, { backgroundColor: isTracking ? '#34D399' : '#F87171' }]} />
            <Text style={styles.statusBadgeText}>{isTracking ? 'ACTIVE' : 'OFFLINE'}</Text>
          </View>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Last Fix</Text>
          <Text style={styles.locationText} numberOfLines={1}>{lastLocation}</Text>
        </View>
      </View>

      {/* Console Area */}
      <View style={styles.consoleContainer}>
        <View style={styles.consoleHeader}>
          <Text style={styles.consoleTitle}>Live Feed</Text>
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>System idle. Waiting for events...</Text>
          ) : (
            logs.map((log, index) => (
              <View key={index} style={styles.logEntry}>
                <Text style={styles.logTime}>[{log.time}]</Text>
                <Text style={[
                  styles.logMsg, 
                  log.type === 'error' && styles.logError,
                  log.type === 'success' && styles.logSuccess,
                ]}>
                  {log.msg}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  statusPanel: {
    backgroundColor: '#1E293B',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  statusLabel: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  locationText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '500',
    maxWidth: '60%',
  },
  consoleContainer: {
    flex: 1,
    backgroundColor: '#020617',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  consoleHeader: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  consoleTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 8,
  },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  logTime: {
    color: '#475569',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  logMsg: {
    color: '#94A3B8',
    fontSize: 13,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  logError: {
    color: '#F87171',
  },
  logSuccess: {
    color: '#34D399',
  },
  emptyText: {
    color: '#475569',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontStyle: 'italic',
  }
});

