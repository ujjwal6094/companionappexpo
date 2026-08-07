import React from 'react';
import './src/services/backgroundLocationService'; // REQUIRED: Must be imported in global scope for Expo background tasks to work!
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AppNavigator />
  );
}
