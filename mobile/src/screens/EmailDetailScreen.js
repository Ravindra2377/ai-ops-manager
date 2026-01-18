import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Modal } from 'react-native';
import { emailAPI, taskAPI } from '../services/api';
import UrgencyBadge from '../components/UrgencyBadge';
import IntentBadge from '../components/IntentBadge';
import { sanitizeEmailHtml } from '../utils/htmlSanitizer';
import { getToken } from '../utils/storage';

const API_URL = 'https://ai-ops-manager-api.onrender.com';

export default function EmailDetailScreen({ route, navigation }) {
    const { emailId } = route.params;
    const [email, setEmail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [reminder, setReminder] = useState(null);
    const [reminderLoading, setReminderLoading] = useState(false);

    useEffect(() => {
        loadEmail();
        loadReminder();
    }, []);

    const loadEmail = async () => {
        try {
            const response = await emailAPI.getById(emailId);
            if (response.data.success) {
                setEmail(response.data.email);
            }
        } catch (error) {
            console.error('Error loading email:', error);
            Alert.alert('Error', 'Failed to load email');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action) => {
        setActionLoading(true);
        try {
            const response = await emailAPI.takeAction(emailId, action);
            if (response.data.success) {
                Alert.alert('Success', `Email marked as ${action}`);
                setEmail(response.data.email);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update email');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveDraft = async () => {
        setActionLoading(true);
        try {
            const response = await emailAPI.saveDraftReply(emailId);
            if (response.data.success) {
                Alert.alert('Success', 'Draft saved to Gmail');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to save draft');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateTask = async () => {
        setActionLoading(true);
        try {
            const response = await taskAPI.createFromEmail(emailId);
            if (response.data.success) {
                Alert.alert('Success', 'Task created from email');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to create task');
        } finally {
            setActionLoading(false);
        }
    };

    const loadReminder = async () => {
        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/api/reminders?status=pending`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                const emailReminder = data.reminders.find(r => r.emailId === emailId);
                setReminder(emailReminder || null);
            }
        } catch (error) {
            console.error('Error loading reminder:', error);
        }
    };

    const handleSetReminder = async (timeOption) => {
        setShowReminderModal(false);
        setReminderLoading(true);

        try {
            const now = new Date();
            let remindAt;

            switch (timeOption) {
                case 'later_today':
                    remindAt = new Date(now);
                    remindAt.setHours(18, 0, 0, 0); // 6 PM today
                    if (remindAt <= now) remindAt.setDate(remindAt.getDate() + 1); // If past 6 PM, set for tomorrow
                    break;
                case 'tomorrow':
                    remindAt = new Date(now);
                    remindAt.setDate(remindAt.getDate() + 1);
                    remindAt.setHours(9, 0, 0, 0); // 9 AM tomorrow
                    break;
                case '3_days':
                    remindAt = new Date(now);
                    remindAt.setDate(remindAt.getDate() + 3);
                    remindAt.setHours(9, 0, 0, 0); // 9 AM in 3 days
                    break;
                default:
                    return;
            }

            const token = await getToken();
            const response = await fetch(`${API_URL}/api/reminders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailId,
                    remindAt: remindAt.toISOString(),
                }),
            });

            const data = await response.json();

            if (data.success) {
                setReminder(data.reminder);
                Alert.alert('Success', `I'll remind you ${formatReminderTime(remindAt)}`);
            } else if (data.needsUpgrade) {
                Alert.alert('Upgrade Required', data.message);
            } else {
                Alert.alert('Error', data.message || 'Failed to set reminder');
            }
        } catch (error) {
            console.error('Error setting reminder:', error);
            Alert.alert('Error', 'Failed to set reminder');
        } finally {
            setReminderLoading(false);
        }
    };

    const handleCancelReminder = async () => {
        if (!reminder) return;

        setReminderLoading(true);
        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/api/reminders/${reminder.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = await response.json();

            if (data.success) {
                setReminder(null);
                Alert.alert('Success', 'Reminder cancelled');
            }
        } catch (error) {
            console.error('Error cancelling reminder:', error);
            Alert.alert('Error', 'Failed to cancel reminder');
        } finally {
            setReminderLoading(false);
        }
    };

    const formatReminderTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (d.toDateString() === now.toDateString()) {
            return `today at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        } else if (d.toDateString() === tomorrow.toDateString()) {
            return `tomorrow at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        } else {
            return `on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (!email) return null;

    const ai = email.aiAnalysis || {};

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Sender Info */}
                <View style={styles.senderSection}>
                    <Text style={styles.senderName}>
                        {email.from?.name || email.from?.email}
                    </Text>
                    <Text style={styles.senderEmail}>{email.from?.email}</Text>
                    <Text style={styles.timestamp}>
                        {new Date(email.receivedAt).toLocaleString()}
                    </Text>
                </View>

                {/* Subject */}
                <Text style={styles.subject}>{email.subject || '(No Subject)'}</Text>

                {/* AI Summary (if available) */}
                {ai.summary ? (
                    <View style={styles.summarySection}>
                        <Text style={styles.summaryLabel}>📝 Summary</Text>
                        <Text style={styles.summaryText}>{ai.summary}</Text>
                    </View>
                ) : null}

                {/* Email Body */}
                <View style={styles.bodySection}>
                    {email.bodyHtml ? (
                        <WebView
                            source={{ html: sanitizeEmailHtml(email.bodyHtml) }}
                            style={styles.webView}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                            originWhitelist={['*']}
                            javaScriptEnabled={false}
                            domStorageEnabled={false}
                            onShouldStartLoadWithRequest={(request) => {
                                // Block external navigation, only allow initial load
                                return request.url === 'about:blank';
                            }}
                        />
                    ) : (
                        <Text style={styles.body}>{email.body}</Text>
                    )}
                </View>

                {/* AI Analysis Section */}
                <View style={styles.aiSection}>
                    <Text style={styles.aiTitle}>🤖 AI Analysis</Text>

                    <View style={styles.badgesRow}>
                        <IntentBadge intent={ai.intent} />
                        <UrgencyBadge urgency={ai.urgency} />
                    </View>

                    {ai.confidenceScore ? (
                        <Text style={styles.confidence}>
                            AI Confidence: {Math.round(ai.confidenceScore * 100)}%
                        </Text>
                    ) : null}

                    {ai.reasoning ? (
                        <View style={styles.reasoningBox}>
                            <Text style={styles.reasoningTitle}>💡 Why This Matters</Text>
                            <Text style={styles.reasoningText}>{ai.reasoning}</Text>
                        </View>
                    ) : null}

                    {/* Suggested Actions */}
                    {ai.suggestedActions && ai.suggestedActions.length > 0 ? (
                        <View style={styles.actionsSection}>
                            <Text style={styles.actionsTitle}>Suggested Actions</Text>
                            {ai.suggestedActions.map((action, index) => (
                                <View key={index} style={styles.actionItem}>
                                    <View style={styles.actionHeader}>
                                        <Text style={styles.actionType}>{action.type}</Text>
                                        <Text style={styles.actionPriority}>
                                            Priority: {action.priority}
                                        </Text>
                                    </View>
                                    <Text style={styles.actionDescription}>
                                        {action.description}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    {/* Draft Reply */}
                    {ai.draftReply ? (
                        <View style={styles.draftSection}>
                            <Text style={styles.draftTitle}>✉️ Draft Reply</Text>
                            <View style={styles.draftBox}>
                                <Text style={styles.draftText}>{ai.draftReply}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.saveDraftButton}
                                onPress={handleSaveDraft}
                                disabled={actionLoading}
                            >
                                <Text style={styles.saveDraftButtonText}>
                                    Save to Gmail Drafts
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>

                {/* Action Buttons */}
                <View style={styles.bottomActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleAction('approved')}
                        disabled={actionLoading || email.userAction === 'approved'}
                    >
                        <Text style={styles.actionButtonText}>
                            {email.userAction === 'approved' ? '✓ Approved' : 'Approve'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleAction('rejected')}
                        disabled={actionLoading || email.userAction === 'rejected'}
                    >
                        <Text style={styles.actionButtonText}>
                            {email.userAction === 'rejected' ? '✗ Rejected' : 'Reject'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleAction('ignored')}
                    disabled={actionLoading || email.userAction === 'ignored'}
                >
                    <Text style={styles.secondaryButtonText}>
                        {email.userAction === 'ignored' ? 'Ignored' : 'Mark as Ignored'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleCreateTask}
                    disabled={actionLoading}
                >
                    <Text style={styles.secondaryButtonText}>Create Task from Email</Text>
                </TouchableOpacity>

                {/* Remind Me Button */}
                {reminder ? (
                    <TouchableOpacity
                        style={[styles.secondaryButton, styles.reminderSetButton]}
                        onPress={handleCancelReminder}
                        disabled={reminderLoading}
                    >
                        <Text style={styles.reminderSetText}>
                            ⏰ Reminder Set: {formatReminderTime(reminder.remindAt)}
                        </Text>
                        <Text style={styles.cancelReminderText}>Tap to cancel</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => setShowReminderModal(true)}
                        disabled={reminderLoading}
                    >
                        <Text style={styles.secondaryButtonText}>⏰ Remind Me</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Time Picker Modal */}
            <Modal
                visible={showReminderModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowReminderModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>⏰ Set Reminder</Text>

                        <TouchableOpacity
                            style={styles.timeOption}
                            onPress={() => handleSetReminder('later_today')}
                        >
                            <Text style={styles.timeOptionText}>Later Today (6 PM)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.timeOption}
                            onPress={() => handleSetReminder('tomorrow')}
                        >
                            <Text style={styles.timeOptionText}>Tomorrow Morning (9 AM)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.timeOption}
                            onPress={() => handleSetReminder('3_days')}
                        >
                            <Text style={styles.timeOptionText}>In 3 Days (9 AM)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.timeOption, styles.cancelOption]}
                            onPress={() => setShowReminderModal(false)}
                        >
                            <Text style={styles.cancelOptionText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backButton: {
        fontSize: 17,
        color: '#007AFF',
    },
    content: {
        flex: 1,
    },
    senderSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    senderName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    senderEmail: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 8,
    },
    timestamp: {
        fontSize: 13,
        color: '#8E8E93',
    },
    subject: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    summarySection: {
        backgroundColor: '#F0F9FF',
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#1C1C1E',
        fontWeight: '500',
    },
    bodySection: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 16,
        minHeight: 200,
    },
    webView: {
        flex: 1,
        minHeight: 400,
        backgroundColor: 'transparent',
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
        color: '#1C1C1E',
    },
    aiSection: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 16,
    },
    aiTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        marginBottom: 12,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    confidence: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 16,
    },
    reasoningBox: {
        backgroundColor: '#F2F2F7',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    reasoningTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    reasoningText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#3C3C43',
    },
    actionsSection: {
        marginTop: 16,
    },
    actionsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 12,
    },
    actionItem: {
        backgroundColor: '#F2F2F7',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    actionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    actionType: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    actionPriority: {
        fontSize: 12,
        color: '#8E8E93',
    },
    actionDescription: {
        fontSize: 14,
        color: '#3C3C43',
        lineHeight: 20,
    },
    draftSection: {
        marginTop: 16,
    },
    draftTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 12,
    },
    draftBox: {
        backgroundColor: '#F2F2F7',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    draftText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#3C3C43',
    },
    saveDraftButton: {
        backgroundColor: '#007AFF',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveDraftButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomActions: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
    },
    actionButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    approveButton: {
        backgroundColor: '#34C759',
    },
    rejectButton: {
        backgroundColor: '#FF3B30',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    secondaryButtonText: {
        color: '#007AFF',
        fontSize: 15,
        fontWeight: '500',
    },
    reminderSetButton: {
        backgroundColor: '#F0F9FF',
        borderColor: '#007AFF',
    },
    reminderSetText: {
        color: '#007AFF',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    cancelReminderText: {
        color: '#8E8E93',
        fontSize: 13,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        marginBottom: 20,
        textAlign: 'center',
    },
    timeOption: {
        backgroundColor: '#F2F2F7',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    timeOptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    cancelOption: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        marginTop: 8,
    },
    cancelOptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#8E8E93',
    },
});
