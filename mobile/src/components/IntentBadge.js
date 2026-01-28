import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

export default function IntentBadge({ intent, mini = false }) {
    if (!intent) return null;

    const getColor = () => {
        switch (intent) {
            case 'ACTION_REQUIRED':
                return { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE' }; // Indigo
            case 'FYI':
                return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' }; // Emerald
            case 'MEETING':
                return { bg: '#F3E8FF', text: '#7C3AED', border: '#DDD6FE' }; // Violet
            default:
                return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' }; // Slate
        }
    };

    const colors = getColor();

    return (
        <View style={[
            styles.badge,
            { backgroundColor: colors.bg, borderColor: colors.border },
            mini && styles.miniBadge
        ]}>
            <Text style={[
                styles.text,
                { color: colors.text },
                mini && styles.miniText
            ]}>
                {intent.replace('_', ' ')}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    miniBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
    },
    miniText: {
        fontSize: 10,
    }
});
