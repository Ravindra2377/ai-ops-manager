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

import BriefCard from '../components/BriefCard'; // New Import

export default function DashboardScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);
    const [reminders, setReminders] = useState([]);
    const [brief, setBrief] = useState(null); // New State

    useEffect(() => {
        loadDashboard();
        loadReminders();
        loadBrief(); // Load Brief
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

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboard();
        loadReminders();
        loadBrief();
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
            <View style={styles.header}>
                <Text style={styles.title}>Dashboard</Text>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.profileIcon}>👤</Text>
                </TouchableOpacity>
            </View>

            {/* Daily Brief Card (Command Center) */}
            <View style={styles.section}>
                <BriefCard brief={brief} loading={loading && !brief} />
            </View>

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
        padding: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
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
