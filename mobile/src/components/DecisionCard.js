import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function DecisionCard({ decision, onResolve }) {
    const handleResolve = (resolution) => {
        onResolve(decision._id, resolution);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.emoji}>📋</Text>
                <Text style={styles.title}>Yesterday's Decision</Text>
            </View>

            <Text style={styles.decisionText}>{decision.decisionText}</Text>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.button, styles.completedButton]}
                    onPress={() => handleResolve('COMPLETED')}
                >
                    <Text style={styles.buttonText}>✅ Yes, done</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.snoozeButton]}
                    onPress={() => handleResolve('SNOOZED')}
                >
                    <Text style={styles.buttonText}>⏰ Remind me later</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.abandonButton]}
                    onPress={() => handleResolve('ABANDONED')}
                >
                    <Text style={styles.buttonText}>❌ Not relevant</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    emoji: {
        fontSize: 20,
        marginRight: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    decisionText: {
        fontSize: 15,
        color: '#4A4A4A',
        marginBottom: 16,
        lineHeight: 22,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    completedButton: {
        backgroundColor: '#10B981',
    },
    snoozeButton: {
        backgroundColor: '#F59E0B',
    },
    abandonButton: {
        backgroundColor: '#6B7280',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
});
