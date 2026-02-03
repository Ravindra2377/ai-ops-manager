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

import BriefCard from '../components/BriefCard';
import DecisionCard from '../components/DecisionCard';
import { Image } from 'react-native';

const DEFAULT_AVATAR = require('../../assets/infinity-logo.png');

const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning,';
    if (hours < 18) return 'Good Afternoon,';
    return 'Good Evening,';
};

const getDateString = () => {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
};

export default function DashboardScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);
    const [reminders, setReminders] = useState([]);
    const [brief, setBrief] = useState(null);
    const [decisions, setDecisions] = useState([]);

    useEffect(() => {
        loadDashboard();
        loadReminders();
        loadBrief();
        loadDecisions();
    }, []);

    const loadDashboard = async () => {
        try {
            const statsRes = await dashboardAPI.getStats();
            setStats(statsRes.data.stats);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            setStats({
                emails: { total: 0, pending: 0, highUrgency: 0 },
                tasks: { total: 0, pending: 0, completed: 0 }
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadBrief = async () => {
        try {
            const res = await dashboardAPI.getBrief(); // Fetch Brief
            setBrief(res.data);
        } catch (error) {
            console.error('Error loading brief:', error);
        }
    };

    const loadDecisions = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/api/decisions/pending`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setDecisions(data.decisions);
            }
        } catch (error) {
            console.error('Error loading decisions:', error);
        }
    };

    const handleResolveDecision = async (decisionId, resolution) => {
        try {
            const token = await getToken();
            await fetch(`${API_URL}/api/decisions/${decisionId}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ resolution }),
            });
            // Reload decisions after resolution
            loadDecisions();
        } catch (error) {
            console.error('Error resolving decision:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboard();
        loadReminders();
        loadBrief();
        loadDecisions();
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    // Ensure stats has safe defaults
    const safeStats = stats || {
        emails: { total: 0, pending: 0, highUrgency: 0 },
        tasks: { total: 0, pending: 0, completed: 0 }
    };

    const emailsPending = safeStats.emails?.pending || 0;
    const emailsUrgent = safeStats.emails?.highUrgency || 0;
    const tasksPending = safeStats.tasks?.pending || 0;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Premium Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.dateText}>{getDateString()}</Text>
                    <Text style={styles.greetingTitle}>
                        {getGreeting()} <Text style={{ fontWeight: '300' }}>Panvi</Text>
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Image source={DEFAULT_AVATAR} style={styles.avatarImage} />
                </TouchableOpacity>
            </View>

            {/* Daily Brief Card (Command Center) */}
            <View style={styles.section}>
                <BriefCard brief={brief} loading={loading && !brief} />
            </View>

            {/* Decision Follow-Through Cards */}
            {decisions.length > 0 && (
                <View style={styles.section}>
                    {decisions.map((decision) => (
                        <DecisionCard
                            key={decision._id}
                            decision={decision}
                            onResolve={handleResolveDecision}
                        />
                    ))}
                </View>
            )}

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{String(emailsPending)}</Text>
                    <Text style={styles.statLabel}>Pending Emails</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, styles.urgentText]}>
                        {String(emailsUrgent)}
                    </Text>
                    <Text style={styles.statLabel}>High Priority</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{String(tasksPending)}</Text>
                    <Text style={styles.statLabel}>Pending Tasks</Text>
                </View>
            </View>

            {/* Reminders Due Section */}
            {reminders.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⏰ Reminders Due ({reminders.length})</Text>
                    {reminders.map((reminder) => (
                        <TouchableOpacity
                            key={reminder.id}
                            style={styles.reminderCard}
                            onPress={() => navigation.navigate('EmailDetail', { emailId: reminder.emailId })}
                        >
                            <View style={styles.reminderHeader}>
                                <Text style={styles.reminderSubject} numberOfLines={1}>
                                    {reminder.email?.subject || 'No subject'}
                                </Text>
                            </View>
                            <Text style={styles.reminderSender} numberOfLines={1}>
                                From: {reminder.email?.sender || 'Unknown'}
                            </Text>
                            {reminder.reason && (
                                <Text style={styles.reminderReason}>{reminder.reason}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Emails')}
                >
                    <Text style={styles.actionButtonText}>View All Emails</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Tasks')}
                >
                    <Text style={styles.actionButtonText}>View Tasks</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff', // Clean white background for header area
    },
    dateText: {
        fontSize: 13,
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
        marginBottom: 4,
    },
    greetingTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    profileButton: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#fff',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        marginTop: 8, // Added little spacing
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    urgentText: {
        color: '#FF3B30',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    actionButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    reminderCard: {
        backgroundColor: '#FFF9E6',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9500',
    },
    reminderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    reminderSubject: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        flex: 1,
    },
    reminderSender: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 4,
    },
    reminderReason: {
        fontSize: 13,
        color: '#FF9500',
        fontStyle: 'italic',
        marginTop: 4,
    },
});
