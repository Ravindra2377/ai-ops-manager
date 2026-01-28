import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Clipboard,
    Platform,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { emailAPI } from '../api';
import Button from '../components/Button';
import UrgencyBadge from '../components/UrgencyBadge';
import IntentBadge from '../components/IntentBadge';
import htmlSanitizer from '../utils/htmlSanitizer';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

export default function EmailDetailScreen({ route, navigation }) {
    const { emailId } = route.params;
    const [email, setEmail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadEmailDetails();
    }, [emailId]);

    const loadEmailDetails = async () => {
        try {
            const data = await emailAPI.getById(emailId);
            setEmail(data);
        } catch (error) {
            console.error('Failed to load email:', error);
            Alert.alert('Error', 'Could not load email details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action) => {
        setProcessing(true);
        try {
            // Implementation placeholder - would connect to API
            await new Promise(resolve => setTimeout(resolve, 1000));
            Alert.alert('Success', `Email ${action}ed successfully`);
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Action failed');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!email) return null;

    const ai = email.aiAnalysis || {};

    return (
        <View style={styles.container}>
            {/* Sticky Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerIcon}>
                        <Text>🗑️</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Sender Info */}
                <View style={styles.senderSection}>
                    <Text style={styles.subject}>{email.subject}</Text>
                    <View style={styles.senderRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {(email.from?.name || email.from?.email || '?').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.senderName}>
                                {email.from?.name || email.from?.email}
                            </Text>
                            <Text style={styles.date}>
                                {new Date(email.receivedAt).toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* AI Summary Highlight */}
                {ai.summary && (
                    <View style={styles.summaryBox}>
                        <View style={styles.summaryLabelContainer}>
                            <Text style={styles.summaryLabel}>📝 AI Summary</Text>
                        </View>
                        <Text style={styles.summaryText}>{ai.summary}</Text>
                    </View>
                )}

                {/* AI Analysis Gradient Card */}
                <LinearGradient
                    colors={[Colors.surface, Colors.primaryLight]}
                    style={styles.aiCard}
                >
                    <View style={styles.aiHeader}>
                        <Text style={styles.aiTitle}>🤖 AI Analysis</Text>
                    </View>

                    <View style={styles.badgesRow}>
                        <UrgencyBadge urgency={ai.urgency} />
                        <IntentBadge intent={ai.intent} />
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionLabel}>Suggested Action</Text>
                    <Text style={styles.actionText}>{ai.suggestedAction || 'No specific action suggested.'}</Text>

                    {ai.draftReply && (
                        <View style={styles.draftBox}>
                            <Text style={styles.draftLabel}>Draft Reply:</Text>
                            <Text style={styles.draftText}>{ai.draftReply}</Text>
                            <TouchableOpacity
                                style={styles.copyButton}
                                onPress={() => Clipboard.setString(ai.draftReply)}
                            >
                                <Text style={styles.copyText}>Copy</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </LinearGradient>

                {/* Email Body */}
                <View style={styles.bodyContainer}>
                    <Text style={styles.sectionLabel}>Email Content</Text>
                    <View style={styles.webViewContainer}>
                        <WebView
                            originWhitelist={['*']}
                            source={{ html: htmlSanitizer(email.body || email.snippet) }}
                            style={styles.webView}
                            scrollEnabled={false}
                        />
                    </View>
                </View>

                {/* Space for FABs */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating Action Buttons */}
            <View style={styles.fabContainer}>
                <Button
                    title="Reject"
                    variant="urgent"
                    onPress={() => handleAction('reject')}
                    style={styles.fabButton}
                    icon={<Text style={{ color: '#FFF', marginRight: 8 }}>✕</Text>}
                />
                <Button
                    title="Approve"
                    variant="success"
                    onPress={() => handleAction('approve')}
                    style={styles.fabButton}
                    icon={<Text style={{ color: '#FFF', marginRight: 8 }}>✓</Text>}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingTop: 10, // Adjust for status bar if needed
    },
    backButton: {
        padding: Spacing.sm,
    },
    backIcon: {
        fontSize: 24,
        color: Colors.textPrimary,
    },
    headerActions: {
        flexDirection: 'row',
    },
    headerIcon: {
        padding: Spacing.sm,
    },
    scrollContent: {
        padding: Spacing.md,
    },
    senderSection: {
        marginBottom: Spacing.lg,
    },
    subject: {
        fontSize: Typography.h2,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    senderRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.circle,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    avatarText: {
        fontSize: Typography.h3,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    senderName: {
        fontSize: Typography.body,
        fontWeight: Typography.semibold,
        color: Colors.textPrimary,
    },
    date: {
        fontSize: Typography.small,
        color: Colors.textSecondary,
    },
    summaryBox: {
        backgroundColor: Colors.info + '15', // 15% opacity
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: Colors.info,
    },
    summaryLabelContainer: {
        marginBottom: Spacing.xs,
    },
    summaryLabel: {
        fontSize: Typography.small,
        fontWeight: Typography.bold,
        color: Colors.info,
    },
    summaryText: {
        fontSize: Typography.body,
        color: Colors.textPrimary,
        lineHeight: 22,
    },
    aiCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
        overflow: 'hidden',
    },
    aiHeader: {
        marginBottom: Spacing.md,
    },
    aiTitle: {
        fontSize: Typography.h3,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.md,
    },
    sectionLabel: {
        fontSize: Typography.small,
        fontWeight: Typography.bold,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
        textTransform: 'uppercase',
    },
    actionText: {
        fontSize: Typography.body,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    draftBox: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    draftLabel: {
        fontSize: Typography.small,
        fontWeight: Typography.bold,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    draftText: {
        fontSize: Typography.small,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    copyButton: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    copyText: {
        fontSize: Typography.micro,
        color: Colors.textSecondary,
    },
    bodyContainer: {
        flex: 1,
    },
    webViewContainer: {
        height: 400, // Adjust as needed or implement auto-height
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    webView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    fabContainer: {
        position: 'absolute',
        bottom: Spacing.xl,
        left: Spacing.lg,
        right: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    fabButton: {
        flex: 1,
        ...Shadows.lg,
    },
});
