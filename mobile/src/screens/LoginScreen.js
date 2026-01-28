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
import { LinearGradient } from 'expo-linear-gradient';
import { authAPI } from '../services/api';
import { saveToken, saveUserData } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, BorderRadius, Spacing } from '../constants/theme';

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
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={[Colors.gradientPrimaryStart, Colors.gradientPrimaryEnd]}
            style={styles.container}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.glassCard}>
                    <Text style={styles.title}>AI Ops Manager</Text>
                    <Text style={styles.subtitle}>
                        Your personal AI decision assistant
                    </Text>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="name@company.com"
                                placeholderTextColor={Colors.textTertiary}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={Colors.textTertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <Button
                            title={mode === 'login' ? 'Login' : 'Create Account'}
                            onPress={handleSubmit}
                            loading={isLoading}
                            variant="primary"
                            fullWidth
                            style={styles.submitButton}
                        />

                        <TouchableOpacity
                            onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
                            style={styles.switchButton}
                        >
                            <Text style={styles.switchText}>
                                {mode === 'login'
                                    ? "Don't have an account? Register"
                                    : "Already have an account? Login"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    glassCard: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        ...Shadows.lg,
        alignItems: 'center',
    },
    title: {
        fontSize: Typography.h1,
        fontWeight: Typography.bold,
        color: Colors.primary,
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: Typography.body,
        color: Colors.textSecondary,
        marginBottom: Spacing.xl,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: Typography.caption,
        fontWeight: Typography.semibold,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: Typography.body,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    submitButton: {
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
    },
    switchButton: {
        alignItems: 'center',
    },
    switchText: {
        fontSize: Typography.body,
        color: Colors.textSecondary,
    },
});
