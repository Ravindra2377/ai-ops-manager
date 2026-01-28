import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import UrgencyBadge from './UrgencyBadge';
import IntentBadge from './IntentBadge';

export default function EmailCard({ email, onPress }) {
    const formatTime = (date) => {
        const now = new Date();
        const emailDate = new Date(date);
        const diffMs = now - emailDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return emailDate.toLocaleDateString();
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'HIGH': return Colors.urgent;
            case 'MEDIUM': return Colors.high;
            case 'LOW': return Colors.medium;
            default: return Colors.textTertiary;
        }
    };

    const urgencyColor = getUrgencyColor(email.aiAnalysis?.urgency);
    const confidence = email.aiAnalysis?.confidenceScore || 0;
    const confidencePercent = Math.round(confidence * 100);

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.accentBar, { backgroundColor: urgencyColor }]} />

            <View style={styles.cardContent}>
                <View style={styles.header}>
                    <View style={styles.senderContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {getInitials(email.from?.name || email.from?.email)}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.senderName} numberOfLines={1}>
                                {email.from?.name || email.from?.email || 'Unknown'}
                            </Text>
                            <Text style={styles.time}>{formatTime(email.receivedAt)}</Text>
                        </View>
                    </View>

                    {/* Confidence Ring Indicator */}
                    <View style={styles.confidenceContainer}>
                        <View style={[styles.confidenceRing, { borderColor: urgencyColor }]}>
                            <Text style={[styles.confidenceText, { color: urgencyColor }]}>
                                {confidencePercent}%
                            </Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.subject} numberOfLines={1}>
                    {email.subject || '(No Subject)'}
                </Text>

                <Text style={styles.summary} numberOfLines={2}>
                    {email.aiAnalysis?.summary || email.snippet || 'No summary available...'}
                </Text>

                <View style={styles.footer}>
                    <UrgencyBadge urgency={email.aiAnalysis?.urgency} mini />
                    <IntentBadge intent={email.aiAnalysis?.intent} mini />
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.md,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        flexDirection: 'row',
        overflow: 'hidden',
        ...Shadows.sm,
    },
    accentBar: {
        width: 4,
        height: '100%',
    },
    cardContent: {
        flex: 1,
        padding: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    senderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.circle,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    avatarText: {
        fontSize: Typography.body,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    senderName: {
        fontSize: Typography.body,
        fontWeight: Typography.semibold,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    time: {
        fontSize: Typography.small,
        color: Colors.textSecondary,
    },
    subject: {
        fontSize: Typography.body,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    summary: {
        fontSize: Typography.caption,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: Spacing.sm,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    confidenceContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    confidenceRing: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.circle,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confidenceText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});
