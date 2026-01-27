import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PriorityBadge from './PriorityBadge';
import IntentBadge from './IntentBadge';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../constants/theme';

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

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.senderName} numberOfLines={1}>
                        {email.from?.name || email.from?.email || 'Unknown'}
                    </Text>
                    <Text style={styles.time}>{formatTime(email.receivedAt)}</Text>
                </View>
                <PriorityBadge priority={email.aiAnalysis?.urgency} />
            </View>

            <Text style={styles.subject} numberOfLines={2}>
                {email.subject || '(No Subject)'}
            </Text>

            {/* AI Summary (if available and meaningful) */}
            {email.aiAnalysis?.summary && email.aiAnalysis.summary.length > 8 ? (
                <Text style={styles.summary} numberOfLines={2}>
                    {email.aiAnalysis.summary}
                </Text>
            ) : null}

            <View style={styles.footer}>
                <IntentBadge intent={email.aiAnalysis?.intent} />
                {email.aiAnalysis?.confidenceScore ? (
                    <Text style={styles.confidence}>
                        {Math.round(email.aiAnalysis.confidenceScore * 100)}% confident
                    </Text>
                ) : null}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.medium,
        padding: Spacing.md,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm + 4,
        ...Shadows.small,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: Spacing.sm + 4,
    },
    senderName: {
        fontSize: Typography.body - 1,
        fontWeight: Typography.semibold,
        color: Colors.textPrimary,
        flex: 1,
        marginRight: Spacing.sm,
    },
    time: {
        fontSize: Typography.caption - 1,
        color: Colors.textTertiary,
    },
    subject: {
        fontSize: Typography.body + 1,
        fontWeight: Typography.semibold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
        lineHeight: 22,
    },
    summary: {
        fontSize: Typography.caption,
        lineHeight: 20,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm + 4,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm + 4,
    },
    confidence: {
        fontSize: Typography.small,
        color: Colors.textTertiary,
    },
});


export default function EmailCard({ email, onPress }) {
    const formatTime = (date) => {
