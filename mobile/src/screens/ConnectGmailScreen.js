import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authAPI } from '../api';
import Button from '../components/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

export default function ConnectGmailScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        if (!email || !appPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await authAPI.connectGmail({ email, appPassword });
            Alert.alert('Success', 'Gmail account connected successfully!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to connect account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={[Colors.surface, Colors.primaryLight]}
            style={styles.container}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.icon}>📧</Text>
                        </View>
                        <Text style={styles.title}>Connect Gmail</Text>
                        <Text style={styles.subtitle}>
                            Let AI organize your inbox. Use an App Password for secure access.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Gmail Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="you@company.com"
                                placeholderTextColor={Colors.textTertiary}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>App Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="16-character app password"
                                placeholderTextColor={Colors.textTertiary}
                                value={appPassword}
                                onChangeText={setAppPassword}
                                secureTextEntry={false}
                            />
                            <Text style={styles.helperText}>
                                Generate this in your Google Account settings under Security {'>'} 2-Step Verification {'>'} App Passwords.
                            </Text>
                        </View>

                        <Button
                            title="Connect Account"
                            onPress={handleConnect}
                            loading={loading}
                            variant="primary"
                            fullWidth
                            style={styles.button}
                        />

                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.skipButton}
                        >
                            <Text style={styles.skipText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
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
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.circle,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
        ...Shadows.md,
    },
    icon: {
        fontSize: 40,
    },
    title: {
        fontSize: Typography.h1,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
        maxWidth: 300,
    },
    form: {
        width: '100%',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        ...Shadows.lg,
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
    helperText: {
        fontSize: Typography.tiny,
        color: Colors.textTertiary,
        marginTop: Spacing.xs,
        marginLeft: Spacing.xs,
    },
    button: {
        marginTop: Spacing.sm,
        marginBottom: Spacing.md,
    },
    skipButton: {
        alignItems: 'center',
        padding: Spacing.sm,
    },
    skipText: {
        fontSize: Typography.body,
        color: Colors.textSecondary,
    },
});
