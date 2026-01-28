import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    Animated,
    Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

export default function DashboardScreen({ navigation }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        emailsPending: 0,
        highPriorityEmails: 0,
        tasksPending: 0,
        reminders: []
    });

    // Animation for AI pulse
    const pulseAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        startPulse();
        loadDashboard();
    }, []);

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.4,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const loadDashboard = async () => {
        try {
            const response = await dashboardAPI.getStats();
            if (response.data && response.data.stats) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            // Keep default stats on error to prevent crash
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboard();
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Component for Stat Cards
    const StatCard = ({ label, value, urgent, onPress }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={{ flex: 1 }}
        >
            <View style={[
                styles.statCardWrapper,
                urgent && styles.urgentWrapper
            ]}>
                {urgent ? (
                    <LinearGradient
                        colors={[Colors.gradientUrgentStart, Colors.gradientUrgentEnd]}
                        style={styles.gradientBorder}
                    >
                        <View style={styles.statCardInner}>
                            <Text style={[styles.statValue, { color: Colors.urgent }]}>{value}</Text>
                            <Text style={styles.statLabel}>{label}</Text>
                        </View>
                    </LinearGradient>
                ) : (
                    <View style={styles.statCardInner}>
                        <Text style={styles.statValue}>{value}</Text>
                        <Text style={styles.statLabel}>{label}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" backgroundColor={Colors.background} />
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
                        <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'User'}</Text>
                    </View>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
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
                        value={stats.emailsPending || 0}
                        onPress={() => navigation.navigate('Emails')}
                    />
                    <View style={{ width: Spacing.sm }} />
                    <StatCard
                        label="High Priority"
                        value={stats.highPriorityEmails || 0}
                        urgent={(stats.highPriorityEmails || 0) > 0}
                        onPress={() => navigation.navigate('Emails', { filter: 'HIGH' })}
                    />
                    <View style={{ width: Spacing.sm }} />
                    <StatCard
                        label="Pending Tasks"
                        value={stats.tasksPending || 0}
                        onPress={() => navigation.navigate('Tasks')}
                    />
                </View>

                {/* Reminders Section */}
                {stats.reminders && stats.reminders.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Reminders</Text>
                        {stats.reminders.map((reminder, index) => (
                            <TouchableOpacity
                                key={reminder.id || index}
                                style={styles.reminderCard}
                                onPress={() => reminder.emailId && navigation.navigate('EmailDetail', { emailId: reminder.emailId })}
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
                            title="All Emails"
                            onPress={() => navigation.navigate('Emails')}
                            variant="primary"
                            style={{ flex: 1, marginRight: 8 }}
                        />
                        <Button
                            title="My Tasks"
                            onPress={() => navigation.navigate('Tasks')}
                            variant="outline"
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        height: 100,
    },
    statCardWrapper: {
        flex: 1,
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.lg,
        ...Shadows.md,
        height: '100%',
    },
    urgentWrapper: {
        ...Shadows.glow,
    },
    gradientBorder: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        padding: 1.5,
    },
    statCardInner: {
        flex: 1,
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.lg, // Match wrapper radius
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xs,
        width: '100%',
    },
    statValue: {
        fontSize: 24,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: Typography.tiny,
        color: Colors.textSecondary,
        textAlign: 'center',
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
        flexDirection: 'row',
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    reminderAccent: {
        width: 4,
        backgroundColor: Colors.warning,
    },
    reminderContent: {
        padding: Spacing.md,
        flex: 1,
    },
    reminderTitle: {
        fontSize: Typography.body,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    reminderTime: {
        fontSize: Typography.small,
        color: Colors.textSecondary,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});
