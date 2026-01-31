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
import { emailAPI } from '../services/api';
import EmailCard from '../components/EmailCard';

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
            high: emailList.filter((e) => e.aiAnalysis?.urgency?.toUpperCase() === 'HIGH').length,
            medium: emailList.filter((e) => e.aiAnalysis?.urgency?.toUpperCase() === 'MEDIUM').length,
            low: emailList.filter((e) => e.aiAnalysis?.urgency?.toUpperCase() === 'LOW').length,
        };
        setStats(stats);
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const response = await emailAPI.sync(20);

            if (response.data.success) {
                Alert.alert(
                    'Sync Complete',
                    `Processed: ${response.data.emailsProcessed}\nSkipped: ${response.data.emailsSkipped || 0}\nFailed: ${response.data.emailsFailed || 0}`
                );
                loadEmails();
            }
        } catch (error) {
            console.error('Sync error:', error);
            Alert.alert('Sync Failed', error.response?.data?.message || 'Failed to sync emails');
        } finally {
            setSyncing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadEmails();
    };

    const renderEmailCard = ({ item }) => (
        <EmailCard
            email={item}
            onPress={() => navigation.navigate('EmailDetail', { emailId: item._id })}
        />
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Emails</Text>
            <Text style={styles.emptyText}>
                {selectedTab === 'all'
                    ? 'Sync your emails to get started'
                    : `No ${selectedTab.toLowerCase()} priority emails`}
            </Text>
            <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
                <Text style={styles.syncButtonText}>Sync Emails</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Emails</Text>
                <TouchableOpacity
                    style={styles.syncIconButton}
                    onPress={handleSync}
                    disabled={syncing}
                >
                    <Text style={styles.syncIcon}>{syncing ? '⏳' : '🔄'}</Text>
                </TouchableOpacity>
            </View>

            {/* Urgency Tabs */}
            <View style={styles.tabs}>
                {URGENCY_TABS.map((tab) => {
                    const count =
                        tab.key === 'all'
                            ? emails.length
                            : stats[tab.key.toLowerCase()] || 0;

                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                styles.tab,
                                selectedTab === tab.key && styles.tabActive,
                            ]}
                            onPress={() => setSelectedTab(tab.key)}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    selectedTab === tab.key && styles.tabTextActive,
                                ]}
                            >
                                {tab.label}
                            </Text>
                            {count > 0 ? (
                                <View style={styles.tabBadge}>
                                    <Text style={styles.tabBadgeText}>{String(count)}</Text>
                                </View>
                            ) : null}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Email List */}
            <FlatList
                data={emails}
                renderItem={renderEmailCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={renderEmptyState}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
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
        padding: 16,
        paddingTop: 60,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000',
    },
    syncIconButton: {
        padding: 8,
    },
    syncIcon: {
        fontSize: 24,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        gap: 6,
    },
    tabActive: {
        backgroundColor: '#007AFF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    tabTextActive: {
        color: '#fff',
    },
    tabBadge: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    tabBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    listContent: {
        paddingTop: 16,
        paddingBottom: 24,
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
