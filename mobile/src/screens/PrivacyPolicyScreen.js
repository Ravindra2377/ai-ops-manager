import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';

export default function PrivacyPolicyScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <Text style={styles.lastUpdated}>Last Updated: February 8, 2026</Text>

                <Text style={styles.sectionTitle}>Introduction</Text>
                <Text style={styles.paragraph}>
                    Loopback ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our email management application.
                </Text>

                <Text style={styles.sectionTitle}>Information We Collect</Text>

                <Text style={styles.subsectionTitle}>1. Account Information</Text>
                <Text style={styles.paragraph}>
                    • Email address (for authentication){'\n'}
                    • Name (optional, for personalization){'\n'}
                    • Password (encrypted and hashed)
                </Text>

                <Text style={styles.subsectionTitle}>2. Gmail Data</Text>
                <Text style={styles.paragraph}>
                    When you connect your Gmail account, we access:{'\n'}
                    • Email metadata (sender, subject, date, labels){'\n'}
                    • Email content (for AI analysis only){'\n'}
                    • Gmail labels and categories{'\n\n'}
                    <Text style={styles.bold}>Important:</Text> We only access emails you explicitly grant permission to read. We never send emails on your behalf without your explicit action.
                </Text>

                <Text style={styles.subsectionTitle}>3. Usage Data</Text>
                <Text style={styles.paragraph}>
                    • Email priority classifications{'\n'}
                    • Decision follow-through actions{'\n'}
                    • Reminder preferences{'\n'}
                    • App usage analytics (anonymized)
                </Text>

                <Text style={styles.sectionTitle}>How We Use Your Information</Text>

                <Text style={styles.subsectionTitle}>Core Functionality</Text>
                <Text style={styles.paragraph}>
                    • <Text style={styles.bold}>AI Email Analysis:</Text> Classify emails by intent and urgency{'\n'}
                    • <Text style={styles.bold}>Daily Brief Generation:</Text> Summarize your inbox state{'\n'}
                    • <Text style={styles.bold}>Decision Follow-Through:</Text> Track commitments you make via email{'\n'}
                    • <Text style={styles.bold}>Smart Reminders:</Text> Notify you about important emails
                </Text>

                <Text style={styles.sectionTitle}>Data Storage and Security</Text>

                <Text style={styles.subsectionTitle}>Storage</Text>
                <Text style={styles.paragraph}>
                    • <Text style={styles.bold}>Database:</Text> MongoDB Atlas (encrypted at rest){'\n'}
                    • <Text style={styles.bold}>Email Data:</Text> Stored temporarily for analysis, deleted after 90 days{'\n'}
                    • <Text style={styles.bold}>Gmail Tokens:</Text> Encrypted using industry-standard encryption{'\n'}
                    • <Text style={styles.bold}>Server:</Text> Hosted on Render.com (SOC 2 compliant)
                </Text>

                <Text style={styles.subsectionTitle}>Security Measures</Text>
                <Text style={styles.paragraph}>
                    • All data transmitted over HTTPS/TLS{'\n'}
                    • Passwords hashed using bcrypt{'\n'}
                    • OAuth 2.0 for Gmail authentication{'\n'}
                    • Regular security audits{'\n'}
                    • No third-party data sharing
                </Text>

                <Text style={styles.sectionTitle}>Data Retention</Text>
                <Text style={styles.paragraph}>
                    • <Text style={styles.bold}>Active Users:</Text> Data retained while account is active{'\n'}
                    • <Text style={styles.bold}>Inactive Accounts:</Text> Data deleted after 180 days of inactivity{'\n'}
                    • <Text style={styles.bold}>Deleted Accounts:</Text> All data permanently deleted within 30 days{'\n'}
                    • <Text style={styles.bold}>Email Content:</Text> Deleted after 90 days or when you disconnect Gmail
                </Text>

                <Text style={styles.sectionTitle}>Your Rights</Text>
                <Text style={styles.paragraph}>
                    You have the right to:{'\n'}
                    • <Text style={styles.bold}>Access:</Text> Request a copy of your data{'\n'}
                    • <Text style={styles.bold}>Delete:</Text> Delete your account and all associated data{'\n'}
                    • <Text style={styles.bold}>Disconnect:</Text> Revoke Gmail access at any time{'\n'}
                    • <Text style={styles.bold}>Export:</Text> Download your data in JSON format{'\n'}
                    • <Text style={styles.bold}>Opt-out:</Text> Disable specific features (reminders, notifications)
                </Text>

                <Text style={styles.sectionTitle}>Third-Party Services</Text>
                <Text style={styles.paragraph}>
                    We use the following third-party services:{'\n\n'}
                    • <Text style={styles.bold}>Google Gmail API:</Text> Access your emails for analysis{'\n'}
                    • <Text style={styles.bold}>Google Gemini AI:</Text> Email content analysis (anonymized){'\n'}
                    • <Text style={styles.bold}>MongoDB Atlas:</Text> Database hosting (encrypted){'\n'}
                    • <Text style={styles.bold}>Render.com:</Text> Server hosting
                </Text>

                <Text style={styles.sectionTitle}>Children's Privacy</Text>
                <Text style={styles.paragraph}>
                    Loopback is not intended for users under 13 years old. We do not knowingly collect data from children.
                </Text>

                <Text style={styles.sectionTitle}>International Users</Text>
                <Text style={styles.paragraph}>
                    Loopback is hosted in the United States. By using our service, you consent to the transfer of your data to the US. We comply with applicable data protection laws including GDPR and CCPA.
                </Text>

                <Text style={styles.sectionTitle}>Changes to This Policy</Text>
                <Text style={styles.paragraph}>
                    We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification.
                </Text>

                <Text style={styles.sectionTitle}>Contact Us</Text>
                <Text style={styles.paragraph}>
                    If you have questions about this Privacy Policy:{'\n\n'}
                    • Email: privacy@loopback.app{'\n'}
                    • Support: support@loopback.app
                </Text>

                <View style={styles.summary}>
                    <Text style={styles.summaryTitle}>Summary</Text>
                    <Text style={styles.summaryText}>
                        We collect only what's necessary to make Loopback work. We never sell your data. You can delete everything anytime. We use industry-standard security. Your emails are analyzed by AI but never shared with humans or third parties.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        marginRight: 16,
    },
    backButtonText: {
        fontSize: 17,
        color: '#007AFF',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingVertical: 24,
        paddingBottom: 40,
    },
    lastUpdated: {
        fontSize: 13,
        color: '#8E8E93',
        marginBottom: 24,
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1C1C1E',
        marginTop: 24,
        marginBottom: 12,
    },
    subsectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1C1C1E',
        marginTop: 16,
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 24,
        color: '#3C3C43',
        marginBottom: 12,
    },
    bold: {
        fontWeight: '600',
        color: '#1C1C1E',
    },
    summary: {
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        padding: 16,
        marginTop: 32,
    },
    summaryTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#3C3C43',
    },
});
