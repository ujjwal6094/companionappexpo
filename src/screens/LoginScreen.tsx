import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { saveUserConfig } from '../storage/storage';

export const LoginScreen = ({ navigation }: any) => {
  const handleStartDemo = async () => {
    await saveUserConfig({
      employeeId: 'DEMO_TECH_01',
      apiBaseUrl: 'https://httpbin.org/post',
      authToken: 'demo_token_12345',
      interval: '5',
      tripId: 'DEMO-TRIP-01',
      orgid: 'DEMO_ORG',
    });
    if (navigation?.replace) {
      navigation.replace('Home');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>T-Matrix Track</Text>
      <Text style={styles.subtitle}>Awaiting session launch from Maximo Mobile / T-Matrix.</Text>
      {navigation?.replace && (
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.replace('Home')}
          >
            <Text style={styles.buttonText}>Open Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.demoButton]}
            onPress={handleStartDemo}
          >
            <Text style={[styles.buttonText, styles.demoButtonText]}>Load Demo Session</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonGroup: {
    gap: 12,
    width: '100%',
    maxWidth: 240,
  },
  button: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  buttonText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
  },
  demoButton: {
    borderColor: '#0284C7',
    backgroundColor: '#0F2B48',
  },
  demoButtonText: {
    color: '#E0F2FE',
  },
});
