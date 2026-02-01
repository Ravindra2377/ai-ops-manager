import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getToken } from '../utils/storage';

const API_URL = 'https://ai-ops-manager-api.onrender.com';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false, // Calm notifications - no sound spam
        shouldSetBadge: true,
    }),
});

/**
 * Request notification permissions and get Expo push token
 */
export async function registerForPushNotifications() {
    let token;

    if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Notification permissions denied');
        return null;
    }

    // Get Expo push token
    try {
        token = (await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id',
        })).data;
        console.log('Expo push token:', token);
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }

    // Android-specific channel setup
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#007AFF',
        });
    }

    return token;
}

/**
 * Send push token to backend
 */
export async function sendPushTokenToBackend(pushToken) {
    try {
        const authToken = await getToken();
        const response = await fetch(`${API_URL}/api/notifications/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ pushToken }),
        });

        const data = await response.json();
        if (data.success) {
            console.log('Push token registered successfully');
            return true;
        } else {
            console.error('Failed to register push token:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Error sending push token to backend:', error);
        return false;
    }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(onNotificationReceived, onNotificationTapped) {
    // Foreground notification listener
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
        if (onNotificationReceived) {
            onNotificationReceived(notification);
        }
    });

    // Notification tap listener (background/killed state)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification tapped:', response);
        if (onNotificationTapped) {
            onNotificationTapped(response);
        }
    });

    return {
        notificationListener,
        responseListener,
    };
}

/**
 * Remove notification listeners
 */
export function removeNotificationListeners(listeners) {
    if (listeners.notificationListener) {
        Notifications.removeNotificationSubscription(listeners.notificationListener);
    }
    if (listeners.responseListener) {
        Notifications.removeNotificationSubscription(listeners.responseListener);
    }
}
