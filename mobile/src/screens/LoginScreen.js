import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { authAPI } from '../services/api';
import { saveToken, saveUserData } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
    const { login: contextLogin } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const validateInputs = () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return false;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return false;
        }

        // Registration-specific validation
        if (!isLogin) {
            if (!name || name.trim().length < 2) {
                Alert.alert('Error', 'Please enter your name (at least 2 characters)');
                return false;
            }

            if (password !== confirmPassword) {
                Alert.alert('Error', 'Passwords do not match');
                return false;
            }
        }

        return true;
    };

    const handleAuth = async () => {
        if (!validateInputs()) {
            return;
        }

        setLoading(true);

        try {
            const response = isLogin
                ? await authAPI.login(email.trim(), password)
                : await authAPI.register(email.trim(), password);

            console.log('Auth response:', response.data);

            if (response.data.success) {
                // Save token and user data
                await saveToken(response.data.token);
                await saveUserData(response.data.user);

                // Update AuthContext - this will trigger automatic navigation
                await contextLogin(response.data.user);
            }
        } catch (error) {
            console.error('Auth error:', error.response?.data || error.message);

            const message =
                error.response?.data?.message ||
                error.message ||
                'Authentication failed. Please try again.';

            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        // Clear confirm password when switching modes
        setConfirmPassword('');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    <Text style={styles.title}>AI Ops Manager</Text>
                    <Text style={styles.subtitle}>
                        Your personal AI decision assistant
                    </Text>

                    <View style={styles.form}>
                        {!isLogin && (
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor="#999"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                editable={!loading}
                            />
                        )}

                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!loading}
                        />

                        {!isLogin && (
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                placeholderTextColor="#999"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                editable={!loading}
                            />
                        )}

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleAuth}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {isLogin ? 'Login' : 'Register'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={toggleMode}
                            disabled={loading}
                        >
                            <Text style={styles.switchText}>
                                {isLogin
                                    ? "Don't have an account? Register"
                                    : 'Already have an account? Login'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    switchText: {
        color: '#007AFF',
        textAlign: 'center',
        marginTop: 8,
    },
});
