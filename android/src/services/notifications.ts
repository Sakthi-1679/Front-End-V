import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { savePushToken } from './api';

// How notifications behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.log('Push notifications only work on real devices');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'VKM Flowers',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
      sound: 'default',
    });
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo push token:', token);
    // Save token to server so admin/user can receive notifications
    await savePushToken(token);
    return token;
  } catch (err) {
    console.error('Failed to get push token:', err);
    return null;
  }
};

export const setupNotificationListeners = () => {
  try {
    // Received while app is foregrounded
    const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received (foreground):', notification);
    });

    // User tapped on notification
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      console.log('Notification tapped, data:', data);
    });

    return () => {
      try { foregroundSub.remove(); } catch {}
      try { responseSub.remove(); } catch {}
    };
  } catch (e) {
    console.warn('Could not set up notification listeners:', e);
    return () => {};
  }
};
