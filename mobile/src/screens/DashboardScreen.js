import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { dashboardAPI } from '../services/api';
import { getToken } from '../utils/storage';

const API_URL = 'https://ai-ops-manager-api.onrender.com';

export default function DashboardScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);
    const [reminders, setReminders] = useState([]);

    useEffect(() => {
        loadDashboard();
        loadReminders();
    }, []);

    const loadDashboard = async () => {
        try {
            const statsRes = await dashboardAPI.getStats();
            setStats(statsRes.data.stats);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            // Set default stats on error
            setStats({
                emails: { total: 0, pending: 0, highUrgency: 0 },
                tasks: { total: 0, pending: 0, completed: 0 }
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboard();
        loadReminders();
    };

    const loadReminders = async () => {
        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/api/reminders?status=triggered`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setReminders(data.reminders || []);
            }
        } catch (error) {
            console.error('Error loading reminders:', error);
        }
    };

    if (loading) {
        return (
            <TouchableOpacity onPress={onPress} style={styles.statCardContainer}>
                <Wrapper {...wrapperProps}>
                    <View style={[styles.statCard, urgent && styles.urgentStatCard]}>
                        <Text style={[styles.statValue, urgent && styles.urgentStatValue]}>
                            {value}
                        </Text>
                        <Text style={styles.statLabel}>{label}</Text>
                        {urgent && (
                            <View style={styles.urgentIcon}>
                                <Text>🔥</Text>
                            </View>
                        )}
                    </View>
                </Wrapper>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View>
                        <Text style={styles.greeting}>{getGreeting()},</Text>
                        <Text style={styles.userName}>User</Text>
                    </View>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>U</Text>
                    </View>
                </View>

                {/* AI Status */}
                <View style={styles.aiStatusContainer}>
                    <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
                    <Text style={styles.aiStatusText}>
                        AI is analyzing your inbox...
                    </Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <StatCard
                        label="Pending Emails"
                        value={stats.emailsPending}
                        onPress={() => navigation.navigate('Emails')}
                    />
                    <StatCard
                        label="High Priority"
                        value={stats.highPriorityEmails}
                        urgent={stats.highPriorityEmails > 0}
                        onPress={() => navigation.navigate('Emails', { filter: 'HIGH' })}
                    />
                    <StatCard
                        label="Pending Tasks"
                        value={stats.tasksPending}
                        onPress={() => navigation.navigate('Tasks')}
                    />
                </View>

                {/* Reminders Section */}
                {stats.reminders.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Reminders</Text>
                        {stats.reminders.map((reminder) => (
                            <TouchableOpacity
                                key={reminder.id}
                                style={styles.reminderCard}
                                onPress={() => navigation.navigate('EmailDetail', { emailId: reminder.emailId })}
                            >
                                <View style={styles.reminderAccent} />
                                <View style={styles.reminderContent}>
                                    <Text style={styles.reminderTitle} numberOfLines={1}>
                                        {reminder.note}
                                    </Text>
                                    <Text style={styles.reminderTime}>
                                        Due: {new Date(reminder.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionButtons}>
                        <Button
                            title="View All Emails"
                            onPress={() => navigation.navigate('Emails')}
                            variant="primary"
                            icon={<Text style={{ marginRight: 8, color: '#FFF' }}>✉️</Text>}
                            style={{ flex: 1, marginRight: 8 }}
                        />
                        <Button
                            title="View Tasks"
                            onPress={() => navigation.navigate('Tasks')}
                            variant="secondary"
                            icon={<Text style={{ marginRight: 8, color: Colors.primary }}>✓</Text>}
                            style={{ flex: 1, marginLeft: 8 }}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: 60,
    },
    content: {
        padding: Spacing.lg,
        paddingBottom: 40,
    },
    heroSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    greeting: {
        fontSize: Typography.h2,
        color: Colors.textSecondary,
    },
    userName: {
        fontSize: Typography.display,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.circle,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: Typography.h3,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    aiStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.pill,
        alignSelf: 'flex-start',
        marginBottom: Spacing.xl,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        marginRight: Spacing.sm,
    },
    aiStatusText: {
        fontSize: Typography.caption,
        fontWeight: Typography.semibold,
        color: Colors.primaryDark,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
        gap: Spacing.sm,
    },
    statCardContainer: {
        flex: 1,
        height: 110,
    },
    cardWrapper: {
        flex: 1,
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.lg,
        ...Shadows.md,
        padding: 1, // acts as border width placeholder
    },
    urgentCardWrapper: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        ...Shadows.glow,
        padding: 1.5, // Gradient border width
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.card, // Inner white background
        borderRadius: BorderRadius.lg - 1, // Slightly smaller to fit inside border
        padding: Spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    urgentStatCard: {
        // Keeps white background inside gradient border
    },
    statValue: {
        fontSize: 28,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    urgentStatValue: {
        color: Colors.urgent,
    },
    statLabel: {
        fontSize: Typography.small,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 14,
    },
    urgentIcon: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.h3,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    reminderCard: {
        color: '#FF9500',
        fontStyle: 'italic',
        marginTop: 4,
    },
});
