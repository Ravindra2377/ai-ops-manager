import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Production API URL (Render)
export const API_URL = 'https://ai-ops-manager-api.onrender.com/api';
// Local Development URL
// export const API_URL = 'http://192.168.31.1:5000/api';
// export const API_URL = 'http://192.168.0.2:5000/api';
const BASE_URL = API_URL.replace('/api', ''); // Base URL without /api

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000,
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear storage
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('userData');
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (email, password) =>
        api.post('/auth/register', { email, password }),

    login: (email, password) =>
        api.post('/auth/login', { email, password }),

    getGmailAuthUrl: (userId) =>
        api.get(`/auth/gmail/authorize?userId=${userId}`),

    getProfile: () =>
        api.get('/auth/me'),
};

// Email API
export const emailAPI = {
    sync: (maxResults = 10) =>
        api.post('/emails/sync', { maxResults }),

    getAll: (filters = {}) =>
        api.get('/emails', { params: filters }),

    getById: (id) =>
        api.get(`/emails/${id}`),

    takeAction: (id, action) =>
        api.post(`/emails/${id}/action`, { action }),

    saveDraftReply: (id) =>
        api.post(`/emails/${id}/draft-reply`),

    getStats: () =>
        api.get('/emails/stats/overview'),
};

// Task API
export const taskAPI = {
    getAll: (filters = {}) =>
        api.get('/tasks', { params: filters }),

    create: (taskData) =>
        api.post('/tasks', taskData),

    createFromEmail: (emailId) =>
        api.post(`/tasks/from-email/${emailId}`),

    update: (id, updates) =>
        api.put(`/tasks/${id}`, updates),

    delete: (id) =>
        api.delete(`/tasks/${id}`),
    getReminders: (status = 'pending') => api.get(`/reminders?status=${status}`),
    createReminder: (data) => api.post('/reminders', data),
    cancelReminder: (id) => api.delete(`/reminders/${id}`),
    getBrief: () => api.get('/api/brief'),
};

// Dashboard API
export const dashboardAPI = {
    getBrief: (timeOfDay = 'morning') =>
        api.get('/dashboard/brief', { params: { timeOfDay } }),

    getStats: () =>
        api.get('/dashboard/stats'),
};

export default api;
