import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';

export default function TermsAcceptanceScreen({ onAccept, navigation }) {
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

    const handleOpenTerms = () => {
        navigation.navigate('TermsOfService');
    };

    const handleOpenPrivacy = () => {
        navigation.navigate('PrivacyPolicy');
    };

    const handleContinue = () => {
        if (agreedToTerms && agreedToPrivacy) {
            onAccept();
        }
    };

    const canContinue = agreedToTerms && agreedToPrivacy;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* App Logo/Icon */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logoEmoji}>📧</Text>
                    <Text style={styles.appName}>Loopback</Text>
                    <Text style={styles.tagline}>
                        The accountability layer your inbox is missing
                    </Text>
                </View>

                {/* Welcome Message */}
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeTitle}>Welcome!</Text>
                    <Text style={styles.welcomeText}>
                        Before you get started, please review and accept our Terms of Service and Privacy Policy.
                    </Text>
                </View>

                {/* Key Points */}
                <View style={styles.keyPointsSection}>
                    <Text style={styles.keyPointsTitle}>What you should know:</Text>

                    <View style={styles.keyPoint}>
                        <Text style={styles.keyPointIcon}>🔒</Text>
                        <Text style={styles.keyPointText}>
                            Your emails are analyzed by AI but never shared with third parties
                        </Text>
                    </View>

                    <View style={styles.keyPoint}>
                        <Text style={styles.keyPointIcon}>🤖</Text>
                        <Text style={styles.keyPointText}>
                            AI suggestions always require your approval before any action
                        </Text>
                    </View>

                    <View style={styles.keyPoint}>
                        <Text style={styles.keyPointIcon}>🔐</Text>
                        <Text style={styles.keyPointText}>
                            All tokens are encrypted and you can disconnect anytime
                        </Text>
                    </View>

                    <View style={styles.keyPoint}>
                        <Text style={styles.keyPointIcon}>📧</Text>
                        <Text style={styles.keyPointText}>
                            We never send emails automatically on your behalf
                        </Text>
                    </View>
                </View>

                {/* Checkboxes */}
                <View style={styles.checkboxSection}>
                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setAgreedToTerms(!agreedToTerms)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                            {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>
                            I agree to the{' '}
                            <Text style={styles.link} onPress={handleOpenTerms}>
                                Terms of Service
                            </Text>
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setAgreedToPrivacy(!agreedToPrivacy)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, agreedToPrivacy && styles.checkboxChecked]}>
                            {agreedToPrivacy && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>
                            I agree to the{' '}
                            <Text style={styles.link} onPress={handleOpenPrivacy}>
                                Privacy Policy
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                    style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
                    onPress={handleContinue}
                    disabled={!canContinue}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.continueButtonText, !canContinue && styles.continueButtonTextDisabled]}>
                        Agree & Continue
                    </Text>
                </TouchableOpacity>

                {/* Footer */}
                <Text style={styles.footer}>
                    By continuing, you acknowledge that you have read and understood our terms and policies.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    appName: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    tagline: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    welcomeSection: {
        marginBottom: 32,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 12,
    },
    welcomeText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#3C3C43',
    },
    keyPointsSection: {
        backgroundColor: '#F2F2F7',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
    },
    keyPointsTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 16,
    },
    keyPoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    keyPointIcon: {
        fontSize: 20,
        marginRight: 12,
        marginTop: 2,
    },
    keyPointText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
        color: '#3C3C43',
    },
    checkboxSection: {
        marginBottom: 24,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#C7C7CC',
        marginRight: 12,
        marginTop: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    checkboxLabel: {
        fontSize: 15,
        lineHeight: 22,
        color: '#3C3C43',
    },
    checkboxTextContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    link: {
        color: '#007AFF',
        fontWeight: '600',
        textDecorationLine: 'underline',
        fontSize: 15,
        lineHeight: 22,
    },
    continueButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonDisabled: {
        backgroundColor: '#E5E5EA',
        shadowOpacity: 0,
        elevation: 0,
    },
    continueButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    continueButtonTextDisabled: {
        color: '#8E8E93',
    },
    footer: {
        fontSize: 13,
        lineHeight: 20,
        color: '#8E8E93',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});
