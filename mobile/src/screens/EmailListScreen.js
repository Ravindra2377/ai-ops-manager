import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { emailAPI } from '../services/api';
import EmailCard from '../components/EmailCard';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

const URGENCY_TABS = [
    { key: 'all', label: 'All' },
    { key: 'HIGH', label: 'High' },
    { key: 'MEDIUM', label: 'Medium' },
    { key: 'LOW', label: 'Low' },
];

export default function EmailListScreen({ navigation }) {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [selectedTab, setSelectedTab] = useState('all');
    const [stats, setStats] = useState({ high: 0, medium: 0, low: 0 });

    useEffect(() => {
        loadEmails();
    }, [selectedTab]);

    const loadEmails = async () => {
        try {
            const filters = selectedTab !== 'all' ? { urgency: selectedTab } : {};
            const response = await emailAPI.getAll(filters);

            if (response.data.success) {
                setEmails(response.data.emails);
                calculateStats(response.data.emails);
            }
        } catch (error) {
            console.error('Error loading emails:', error);
            Alert.alert('Error', 'Failed to load emails');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateStats = (emailList) => {
        const stats = {
            high: emailList.filter((e) => e.aiAnalysis?.urgency === 'HIGH').length,
            medium: emailList.filter((e) => e.aiAnalysis?.urgency === 'MEDIUM').length,
            low: emailList.filter((e) => e.aiAnalysis?.urgency === 'LOW').length,
        };
        setStats(stats);
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            setSyncing(true);
            const data = await emailAPI.sync();
            // If sync returns new emails, prepend them or reload
            if (data.count > 0) {
                await loadEmails();
            }
        } catch (error) {
            console.error('Failed to sync:', error);
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        loadEmails();
    }, []);

    const filteredEmails = emails.filter(email => {
        if (selectedTab === 'ALL') return true;
        // Check if aiAnalysis exists before accessing urgency
        return email.aiAnalysis?.urgency === selectedTab;
    });

    const getTabStyle = (isActive, tabKey) => {
        if (!isActive) return styles.tab;

        // Return active tab style
        return styles.tabActive;
    };

    const TabButton = ({ tab }) => {
        const isActive = selectedTab === tab.key;

        if (isActive) {
            return (
                <TouchableOpacity
                    onPress={() => setSelectedTab(tab.key)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[Colors.gradientPrimaryStart, Colors.gradientPrimaryEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.tab, styles.tabActive]}
                    >
                        <Text style={[styles.tabText, styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                style={styles.tab}
                onPress={() => setSelectedTab(tab.key)}
            >
                <Text style={styles.tabText}>{tab.label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Emails</Text>
                <TouchableOpacity
                    onPress={handleSync}
                    disabled={syncing}
                    style={styles.syncButton}
                >
                    {syncing ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                        <Text style={styles.syncText}>↻ Sync</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.tabsContainer}>
                {URGENCY_TABS.map((tab) => (
                    <TabButton key={tab.key} tab={tab} />
                ))}
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredEmails}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <EmailCard
                            email={item}
                            onPress={() => navigation.navigate('EmailDetail', { emailId: item._id })}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => loadEmails(true)} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No emails found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.h1,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
    },
    syncButton: {
        padding: Spacing.sm,
    },
    syncText: {
        fontSize: Typography.body,
        color: Colors.primary,
        fontWeight: Typography.semibold,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.pill,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tabActive: {
        backgroundColor: Colors.primary, // Fallback
        borderWidth: 0,
    },
    tabText: {
        fontSize: Typography.caption,
        fontWeight: Typography.semibold,
        color: Colors.textSecondary,
    },
    tabTextActive: {
        color: Colors.textInverted,
    },
    listContent: {
        paddingBottom: Spacing.xl,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 100,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 24,
    },
    syncButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    syncButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
