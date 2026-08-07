import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { saveUserConfig, getUserConfig } from '../storage/storage';

export const LoginScreen = ({ navigation }: any) => {
  const [employeeId, setEmployeeId] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const url = Linking.useURL();

  useEffect(() => {
    if (url) {
      const parsed = Linking.parse(url);
      if (parsed.queryParams) {
        const { employeeId: qEmp, apiUrl: qApi, token: qToken } = parsed.queryParams;
        if (qEmp) setEmployeeId(String(qEmp));
        if (qApi) setApiBaseUrl(String(qApi));
        if (qToken) setAuthToken(String(qToken));
      }
    }
  }, [url]);

  useEffect(() => {
    const checkConfig = async () => {
      const config = await getUserConfig();
      if (config) {
        navigation.replace('Home');
      } else {
        setIsLoading(false);
      }
    };
    checkConfig();
  }, [navigation]);

  const handleLogin = async () => {
    if (!employeeId || !apiBaseUrl || !authToken) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Clean up the URL in case it has trailing slashes
      const endpoint = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      
      // Determine if it's maxauth (usually base64 encoded user:pass) or an API Key
      const hasQuery = endpoint.includes('?');
      let fetchUrl = `${endpoint}${hasQuery ? '&' : '?'}oslc.select=*&oslc.pageSize=1`;
      
      if (authToken.length < 40 && !authToken.includes('-') && /^[A-Za-z0-9+/=]+$/.test(authToken)) {
        headers['maxauth'] = authToken;
      } else {
        // As requested by user, pass the API key directly in the URL query parameters
        fetchUrl = `${endpoint}${hasQuery ? '&' : '?'}apikey=${encodeURIComponent(authToken)}&oslc.select=*&oslc.pageSize=1`;
      }

      // Perform a lightweight GET request to verify the server and token
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}. Please check your Auth Token and API Base URL.`);
      }

      // Maximo might return 200 OK with an HTML login page if auth fails (Form based auth redirect). 
      // We MUST verify that it actually returned JSON.
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Authentication failed. Server redirected to HTML login page. Token is invalid.');
      }
      
      try {
        await response.json();
      } catch (e) {
        throw new Error('Authentication failed. Server did not return valid JSON.');
      }

      await saveUserConfig({
        employeeId,
        apiBaseUrl,
        authToken,
      });
      
      navigation.replace('Home');
    } catch (error: any) {
      Alert.alert('Connection Failed', error.message || 'Could not verify credentials with the server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Companion App Setup</Text>
      
      <Text style={styles.label}>Employee ID</Text>
      <TextInput
        style={styles.input}
        value={employeeId}
        onChangeText={setEmployeeId}
        placeholder="E.g., EMP001"
      />
      
      <Text style={styles.label}>API Base URL</Text>
      <TextInput
        style={styles.input}
        value={apiBaseUrl}
        onChangeText={setApiBaseUrl}
        placeholder="https://api.example.com"
        autoCapitalize="none"
        keyboardType="url"
      />
      
      <Text style={styles.label}>Auth Token</Text>
      <TextInput
        style={styles.input}
        value={authToken}
        onChangeText={setAuthToken}
        placeholder="Bearer Token"
        autoCapitalize="none"
      />
      
      <Button title="Save & Continue" onPress={handleLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
});
