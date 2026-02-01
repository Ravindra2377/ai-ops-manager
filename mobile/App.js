import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import {
  registerForPushNotifications,
  sendPushTokenToBackend,
  setupNotificationListeners,
  removeNotificationListeners
} from './src/services/notificationService';
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  const navigationRef = useRef();
  const notificationListeners = useRef();

  useEffect(() => {
    // Initialize push notifications
    initializePushNotifications();

    // Cleanup listeners on unmount
    return () => {
      if (notificationListeners.current) {
        removeNotificationListeners(notificationListeners.current);
      }
    };
  }, []);

  const initializePushNotifications = async () => {
    try {
      // Register for push notifications and get token
      const pushToken = await registerForPushNotifications();

      if (pushToken) {
        // Send token to backend
        await sendPushTokenToBackend(pushToken);

        // Set up notification listeners
        notificationListeners.current = setupNotificationListeners(
          handleNotificationReceived,
          handleNotificationTapped
        );
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const handleNotificationReceived = (notification) => {
    console.log('📬 Notification received in foreground:', notification);
    // Notification will show as banner automatically
  };

  const handleNotificationTapped = (response) => {
    console.log('👆 Notification tapped:', response);
    const data = response.notification.request.content.data;

    // Deep-link based on notification type
    if (data.type === 'REMINDER' && data.emailId) {
      navigationRef.current?.navigate('EmailDetail', { emailId: data.emailId });
    } else if (data.type === 'DECISION_FOLLOWUP' && data.decisionId) {
      navigationRef.current?.navigate('Dashboard'); // DecisionCard is on Dashboard
    } else if (data.type === 'URGENT_EMAIL' && data.emailId) {
      navigationRef.current?.navigate('EmailDetail', { emailId: data.emailId });
    }
  };
  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
    </NavigationContainer>
  );
}
