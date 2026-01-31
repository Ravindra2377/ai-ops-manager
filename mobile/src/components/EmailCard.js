import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
                <UrgencyBadge urgency={email.aiAnalysis?.urgency} />
            </View>

            {/* Account Label Badge */}
            {email.accountLabel && (
                <View style={[
                    styles.labelBadge,
                    email.accountLabel === 'Work' ? styles.labelWork : styles.labelPersonal
                ]}>
                    <Text style={[
                        styles.labelText,
                        email.accountLabel === 'Work' ? styles.labelTextWork : styles.labelTextPersonal
                    ]}>
                        {email.accountLabel}
                    </Text>
                </View>
            )}

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
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    senderName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1C1C1E',
        flex: 1,
        marginRight: 8,
    },
    time: {
        fontSize: 13,
        color: '#8E8E93',
    },
    subject: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
        lineHeight: 22,
    },
    summary: {
        fontSize: 14,
        lineHeight: 20,
        color: '#3C3C43',
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    confidence: {
        fontSize: 12,
        color: '#8E8E93',
    },
    labelBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 8,
        backgroundColor: '#F2F2F7',
    },
    labelWork: {
        backgroundColor: '#E3F2FD', // Light Blue
    },
    labelPersonal: {
        backgroundColor: '#F3E5F5', // Light Purple
    },
    labelText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8E8E93',
    },
    labelTextWork: {
        color: '#1976D2',
    },
    labelTextPersonal: {
        color: '#7B1FA2',
    },
});
