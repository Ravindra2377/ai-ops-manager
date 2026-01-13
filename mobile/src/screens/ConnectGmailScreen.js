import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { authAPI } from '../services/api';
import { getUserData } from '../utils/storage';

export default function ConnectGmailScreen({ navigation }) {
    const [loading, setLoading] = useState(false);

    const handleConnectGmail = async () => {
        setLoading(true);

        try {
            const userData = await getUserData();
            const response = await authAPI.getGmailAuthUrl(userData.id);

            if (response.data.success) {
                // Open Gmail OAuth URL in browser
                await Linking.openURL(response.data.authUrl);

                // Show instructions
                Alert.alert(
                    'Connect Gmail',
                    'Please complete the Gmail authorization in your browser. After authorization, return to the app.',
                    [
                        {
                            text: 'I\'ve Connected',
                            onPress: () => navigation.replace('Dashboard'),
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel',
                        },
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to get Gmail authorization URL');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        Alert.alert(
            'Skip Gmail Connection',
            'You can connect Gmail later from Settings. The app will have limited functionality without Gmail.',
            [
                {
                    text: 'Connect Now',
                    style: 'cancel',
                },
                {
                    text: 'Skip',
                    onPress: () => navigation.replace('Dashboard'),
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Connect Gmail</Text>
                <Text style={styles.subtitle}>
                    Connect your Gmail account to let AI analyze your emails and suggest
                    actions
                </Text>

                <View style={styles.features}>
                    <Text style={styles.featureItem}>✓ AI analyzes email intent</Text>
                    <Text style={styles.featureItem}>✓ Priority classification</Text>
                    <Text style={styles.featureItem}>✓ Smart action suggestions</Text>
                    <Text style={styles.featureItem}>✓ Draft reply generation</Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleConnectGmail}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Connect Gmail</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSkip} disabled={loading}>
                    <Text style={styles.skipText}>Skip for now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
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
        marginBottom: 32,
        lineHeight: 24,
    },
    features: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 32,
        gap: 12,
    },
    featureItem: {
        fontSize: 16,
        color: '#333',
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    skipText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 16,
    },
});
