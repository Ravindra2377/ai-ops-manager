import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '../constants/theme';

export default function PriorityBadge({ priority }) {
    const getBadgeColor = () => {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return Colors.urgent;
            case 'high':
                return Colors.high;
            case 'medium':
                return Colors.medium;
            case 'low':
                return Colors.low;
            default:
                return Colors.textTertiary;
        }
    };

    const getLabel = () => {
        return priority?.charAt(0).toUpperCase() + priority?.slice(1) || 'Normal';
    };

    return (
        <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
            <Text style={styles.text}>{getLabel()}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.small - 2,
        alignSelf: 'flex-start',
    },
    text: {
        color: '#fff',
        fontSize: Typography.small,
        fontWeight: Typography.semibold,
    },
});
