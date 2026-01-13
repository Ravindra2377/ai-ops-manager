import React, { createContext, useState, useEffect, useContext } from 'react';
import { getToken, clearAuthData, getUserData } from '../utils/storage';

// Create Auth Context
const AuthContext = createContext({
    isAuthenticated: false,
    user: null,
    loading: true,
    login: () => { },
    logout: () => { },
    updateUser: () => { },
});

// Auth Provider Component
export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check authentication status on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await getToken();
            const userData = await getUserData();

            if (token && userData) {
                setIsAuthenticated(true);
                setUser(userData);
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        } catch (error) {
            console.error('Error checking auth:', error);
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (userData) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            await clearAuthData();
            setIsAuthenticated(false);
            setUser(null);
        } catch (error) {
            console.error('Error during logout:', error);
            throw error;
        }
    };

    const updateUser = (userData) => {
        setUser(userData);
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                loading,
                login,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
