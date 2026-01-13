import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const INTENT_LABELS = {
    MEETING_REQUEST: '📅 Meeting',
    QUESTION: '❓ Question',
    TASK_REQUEST: '✅ Task',
    INFORMATION: 'ℹ️ Info',
    DECISION_NEEDED: '⚡ Decision',
    FOLLOW_UP: '🔄 Follow-up',
    UNKNOWN: '📧 Email',
};

export default function IntentBadge({ intent }) {
    const label = INTENT_LABELS[intent] || INTENT_LABELS.UNKNOWN;

    return (
        <View style={styles.badge}>
            <Text style={styles.text}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#F2F2F7',
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 13,
        color: '#3C3C43',
        fontWeight: '500',
    },
});
