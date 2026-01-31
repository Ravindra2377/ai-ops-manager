import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function UrgencyBadge({ urgency }) {
    const getUrgencyStyle = () => {
        switch (urgency?.toUpperCase()) {
            case 'HIGH':
                return { backgroundColor: '#FF3B30', color: '#fff' };
            case 'MEDIUM':
                return { backgroundColor: '#FF9500', color: '#fff' };
            case 'LOW':
                return { backgroundColor: '#34C759', color: '#fff' };
            default:
                return { backgroundColor: '#8E8E93', color: '#fff' };
        }
    };

    const style = getUrgencyStyle();

    return (
        <View style={[styles.badge, { backgroundColor: style.backgroundColor }]}>
            <Text style={[styles.text, { color: style.color }]}>
                {urgency || 'UNKNOWN'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
