import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';

export default function TermsOfServiceScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Service</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <Text style={styles.lastUpdated}>Last Updated: February 8, 2026</Text>

                <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                <Text style={styles.paragraph}>
                    By accessing or using Loopback ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
                </Text>

                <Text style={styles.sectionTitle}>2. Description of Service</Text>
                <Text style={styles.paragraph}>
                    Loopback is an AI-powered email management application that:{'\n'}
                    • Analyzes your Gmail emails for intent and urgency{'\n'}
                    • Generates daily briefs summarizing your inbox{'\n'}
                    • Tracks decision commitments made via email{'\n'}
                    • Provides smart reminders for important emails
                </Text>

                <Text style={styles.sectionTitle}>3. Eligibility</Text>
                <Text style={styles.paragraph}>
                    You must be:{'\n'}
                    • At least 13 years old{'\n'}
                    • Capable of forming a binding contract{'\n'}
                    • Not prohibited from using the Service under applicable law
                </Text>

                <Text style={styles.sectionTitle}>4. Gmail Access and Permissions</Text>

                <Text style={styles.subsectionTitle}>4.1 OAuth Authorization</Text>
                <Text style={styles.paragraph}>
                    • You grant Loopback permission to access your Gmail via OAuth 2.0{'\n'}
                    • We only access emails you explicitly authorize{'\n'}
                    • You can revoke access at any time via Google Account settings
                </Text>

                <Text style={styles.subsectionTitle}>4.2 Scope of Access</Text>
                <Text style={styles.paragraph}>
                    We access:{'\n'}
                    ✅ Email metadata (sender, subject, date){'\n'}
                    ✅ Email content (for AI analysis only){'\n'}
                    ✅ Gmail labels and categories{'\n\n'}
                    We never:{'\n'}
                    ❌ Send emails without your explicit action{'\n'}
                    ❌ Delete emails{'\n'}
                    ❌ Share your emails with third parties
                </Text>

                <Text style={styles.sectionTitle}>5. Acceptable Use</Text>

                <Text style={styles.subsectionTitle}>You May</Text>
                <Text style={styles.paragraph}>
                    • Use Loopback for personal email management{'\n'}
                    • Connect multiple Gmail accounts (if supported){'\n'}
                    • Customize priority rules and preferences{'\n'}
                    • Export your data at any time
                </Text>

                <Text style={styles.subsectionTitle}>You May Not</Text>
                <Text style={styles.paragraph}>
                    • Use Loopback for illegal activities{'\n'}
                    • Attempt to reverse engineer or hack the Service{'\n'}
                    • Share your account credentials{'\n'}
                    • Use the Service to spam or harass others{'\n'}
                    • Violate any applicable laws or regulations
                </Text>

                <Text style={styles.sectionTitle}>6. AI-Generated Content</Text>

                <Text style={styles.subsectionTitle}>6.1 AI Analysis Disclaimer</Text>
                <Text style={styles.paragraph}>
                    • Email classifications are AI-generated and may contain errors{'\n'}
                    • Daily briefs are AI-generated summaries, not professional advice{'\n'}
                    • You are responsible for verifying AI-generated insights{'\n'}
                    • We do not guarantee 100% accuracy of AI classifications
                </Text>

                <Text style={styles.subsectionTitle}>6.2 No Professional Advice</Text>
                <Text style={styles.paragraph}>
                    Loopback does not provide legal, financial, medical, or professional consulting advice. Always consult qualified professionals for important decisions.
                </Text>

                <Text style={styles.sectionTitle}>7. Intellectual Property</Text>

                <Text style={styles.subsectionTitle}>Our Rights</Text>
                <Text style={styles.paragraph}>
                    Loopback owns all rights to the Service, including software code, AI models, UI design, and branding.
                </Text>

                <Text style={styles.subsectionTitle}>Your Rights</Text>
                <Text style={styles.paragraph}>
                    • You retain ownership of your email content{'\n'}
                    • You grant us a limited license to process your emails for Service functionality{'\n'}
                    • This license terminates when you delete your account
                </Text>

                <Text style={styles.sectionTitle}>8. Fees and Payment</Text>
                <Text style={styles.paragraph}>
                    • Currently, Loopback is free to use{'\n'}
                    • We reserve the right to introduce paid features in the future{'\n'}
                    • We will provide 30 days notice before charging existing users
                </Text>

                <Text style={styles.sectionTitle}>9. Service Availability</Text>
                <Text style={styles.paragraph}>
                    • We strive for 99.9% uptime but do not guarantee it{'\n'}
                    • Scheduled maintenance will be announced in advance{'\n'}
                    • We are not liable for service interruptions
                </Text>

                <Text style={styles.sectionTitle}>10. Termination</Text>

                <Text style={styles.subsectionTitle}>By You</Text>
                <Text style={styles.paragraph}>
                    • You may delete your account at any time{'\n'}
                    • All data will be permanently deleted within 30 days{'\n'}
                    • Gmail access will be immediately revoked
                </Text>

                <Text style={styles.subsectionTitle}>By Us</Text>
                <Text style={styles.paragraph}>
                    We may suspend or terminate your account if you:{'\n'}
                    • Violate these Terms{'\n'}
                    • Engage in fraudulent activity{'\n'}
                    • Abuse the Service or other users
                </Text>

                <Text style={styles.sectionTitle}>11. Disclaimers</Text>
                <Text style={styles.paragraph}>
                    THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ACCURACY OR RELIABILITY.
                </Text>

                <Text style={styles.sectionTitle}>12. Limitation of Liability</Text>
                <Text style={styles.paragraph}>
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW:{'\n'}
                    • We are not liable for indirect, incidental, or consequential damages{'\n'}
                    • Our total liability is limited to $100 or fees paid in the last 12 months{'\n'}
                    • We are not liable for data loss, business interruption, or lost profits
                </Text>

                <Text style={styles.sectionTitle}>13. Privacy</Text>
                <Text style={styles.paragraph}>
                    Your use of the Service is also governed by our Privacy Policy, which is incorporated by reference into these Terms.
                </Text>

                <Text style={styles.sectionTitle}>14. Changes to Terms</Text>
                <Text style={styles.paragraph}>
                    We may update these Terms from time to time. We will notify you of material changes via email or in-app notification. Continued use after changes constitutes acceptance.
                </Text>

                <Text style={styles.sectionTitle}>15. Contact Us</Text>
                <Text style={styles.paragraph}>
                    For questions about these Terms:{'\n\n'}
                    • Email: legal@loopback.app{'\n'}
                    • Support: support@loopback.app
                </Text>

                <View style={styles.summary}>
                    <Text style={styles.summaryTitle}>Summary</Text>
                    <Text style={styles.summaryText}>
                        Use Loopback responsibly. We provide the Service "as is" without guarantees. You own your data. We can change these Terms with notice. Disputes go to arbitration. Don't be evil.
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
