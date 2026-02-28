// ⚠️ MUST be the very first import for navigation gestures to work
import 'react-native-gesture-handler';

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';
import { setupNotificationListeners } from './src/services/notifications';

export default function App() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    try {
      cleanup = setupNotificationListeners();
    } catch (e) {
      console.warn('Notification setup failed:', e);
    }
    return () => { try { cleanup?.(); } catch {} };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ToastProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </ToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
