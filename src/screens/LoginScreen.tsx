import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// In Headless Mode, this screen is only ever shown for a split second 
// if the OS requires a UI to be present to display the Permission Dialog.
export const LoginScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // Use a generic background color
  },
});
