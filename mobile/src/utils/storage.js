import * as SecureStore from 'expo-secure-store';

/**
 * Save user token securely
 */
export const saveToken = async (token) => {
    try {
        await SecureStore.setItemAsync('userToken', token);
        return true;
    } catch (error) {
        console.error('Error saving token:', error);
        return false;
    }
};

/**
 * Get user token
 */
export const getToken = async () => {
    try {
        return await SecureStore.getItemAsync('userToken');
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
};

/**
 * Save user data
 */
export const saveUserData = async (userData) => {
    try {
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
        return true;
    } catch (error) {
        console.error('Error saving user data:', error);
        return false;
    }
};

/**
 * Get user data
 */
export const getUserData = async () => {
    try {
        const data = await SecureStore.getItemAsync('userData');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
};

/**
 * Clear all auth data (logout)
 */
export const clearAuthData = async () => {
    try {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
        return true;
    } catch (error) {
        console.error('Error clearing auth data:', error);
        return false;
    }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
    const token = await getToken();
    return !!token;
};
