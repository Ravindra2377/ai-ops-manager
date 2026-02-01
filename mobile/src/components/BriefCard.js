import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Hardcoded Tailwind-like colors for immediate polish
const COLORS = {
    CRITICAL: {
        bg: '#FEF2F2', // Red 50
        border: '#FECACA', // Red 200
        text: '#991B1B', // Red 800
        icon: '#DC2626', // Red 600
        accent: '#FCA5A5', // Red 300
    },
    WARNING: {
        bg: '#FFF7ED', // Orange 50
        border: '#FED7AA', // Orange 200
        text: '#9A3412', // Orange 800
        icon: '#EA580C', // Orange 600
        accent: '#FDBA74', // Orange 300
    },
    CLEAR: {
        bg: '#F0FDF4', // Green 50
        border: '#BBF7D0', // Green 200
        text: '#166534', // Green 800
        icon: '#16A34A', // Green 600
        accent: '#86EFAC', // Green 300
    }
};

const ICONS = {
    CRITICAL: 'error',
    WARNING: 'warning',
    CLEAR: 'check-circle'
};

export default function BriefCard({ brief, loading, onRefresh }) {
    if (loading) {
        return (
            <View style={[styles.card, { backgroundColor: '#F3F4F6' }]}>
                <Text style={{ color: '#6B7280' }}>Loading Brief...</Text>
            </View>
        );
    }

    if (!brief) return null;

    const { state, headline, items, subtext } = brief;
    const theme = COLORS[state] || COLORS.CLEAR;

    return (
        <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            {/* Header */}
            <View style={styles.header}>
                <MaterialIcons name={ICONS[state]} size={24} color={theme.icon} />
                <View style={styles.headerText}>
                    <Text style={[styles.headline, { color: theme.text }]}>
                        {headline}
                    </Text>
                    {subtext && (
                        <Text style={[styles.mainSubtext, { color: theme.text, opacity: 0.8 }]}>
                            {subtext}
                        </Text>
                    )}
                </View>
            </View>

            {/* Items List */}
            {items && items.length > 0 && (
                <View style={styles.itemsContainer}>
                    {items.map((item, index) => (
                        <TouchableOpacity
                            key={item.id || index}
                            style={[styles.itemRow, { borderBottomColor: index === items.length - 1 ? 'transparent' : theme.border }]}
                            onPress={() => console.log('Open Item:', item.id)} // TODO: Navigation
                        >
                            <View style={styles.bulletPoint}>
                                <View style={[styles.dot, { backgroundColor: theme.icon }]} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.itemText, { color: theme.text, fontWeight: '600' }]}>
                                    {item.text}
                                </Text>
                                {item.subtext && (
                                    <Text style={[styles.itemSubtext, { color: theme.text, opacity: 0.7 }]}>
                                        {item.subtext}
                                    </Text>
                                )}
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color={theme.text} style={{ opacity: 0.5 }} />
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Clear State Extra visual */}
            {state === 'CLEAR' && (
                <View style={{ marginTop: 10, alignItems: 'center' }}>
                    {/* Maybe a nice illustration later */}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center', // Align icon with text block center or top? Center usually better for headline.
        marginBottom: 12,
    },
    headerText: {
        marginLeft: 12,
        flex: 1,
    },
    headline: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    mainSubtext: {
        fontSize: 14,
        marginTop: 2,
    },
    itemsContainer: {
        marginTop: 4,
        backgroundColor: 'rgba(255,255,255,0.4)', // Slight glass
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    itemRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    bulletPoint: {
        width: 20,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    itemText: {
        fontSize: 15,
        lineHeight: 20,
    },
    itemSubtext: {
        fontSize: 13,
    }
});
