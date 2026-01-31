import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Modal,
    Linking,
} from 'react-native';
import { authAPI, API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../utils/storage';

// Get base URL without /api suffix
const BASE_URL = API_URL.replace('/api', '');

export default function ProfileScreen({ navigation }) {
    const { user: contextUser, logout: contextLogout } = useAuth();
    const [user, setUser] = useState(null);
    const [gmailAccounts, setGmailAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLabelModal, setShowLabelModal] = useState(false);

    useEffect(() => {
        loadUserData();
        loadGmailAccounts();
    }, []);

    const loadUserData = async () => {
        try {
            const response = await authAPI.getProfile();
            if (response.data.success) {
                setUser(response.data.user);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGmailAccounts = async () => {
        try {
            const token = await getToken();
            const response = await fetch(`${BASE_URL}/api/gmail/accounts`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.success) {
                setGmailAccounts(data.accounts || []);
            }
        } catch (error) {
            console.error('Error loading Gmail accounts:', error);
        }
    };

    const handleAddAccount = async (label) => {
        try {
            setShowLabelModal(false);

            // Check account limit
            const token = await getToken();
            const limitResponse = await fetch(`${BASE_URL}/api/gmail/accounts/check-limit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const limitData = await limitResponse.json();

            if (!limitData.canAdd) {
                if (limitData.needsUpgrade) {
                    Alert.alert(
                        'Upgrade Required',
                        'Free tier allows 1 Gmail account. Upgrade to Premium for up to 3 accounts.',
                        [{ text: 'OK' }]
                    );
                } else {
                    Alert.alert(
                        'Account Limit Reached',
                        `You can connect up to ${limitData.maxAccounts} Gmail accounts.`,
                        [{ text: 'OK' }]
                    );
                }
                return;
            }

            if (!user) {
                Alert.alert('Error', 'User data not loaded. Please reload.');
                return;
            }

            // Get OAuth URL
            // Fix: Fetch the URL first, then open it (don't open API endpoint directly)
            // Use user._id or user.id (Mongoose object usually has _id)
            const userId = user._id || user.id;
            const apiEndpoint = `${BASE_URL}/api/auth/gmail/authorize?userId=${userId}&label=${label}&addingAccount=true`;

            Alert.alert(
                'Add Gmail Account',
                `Opening browser to connect your ${label} Gmail account...`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Continue',
                        onPress: async () => {
                            try {
                                const token = await getToken();
                                const response = await fetch(apiEndpoint, {
                                    headers: {
                                        'Authorization': `Bearer ${token}`
                                    }
                                });
                                const data = await response.json();

                                if (data.success && data.authUrl) {
                                    await Linking.openURL(data.authUrl);
                                    // Reload accounts after a delay
                                    setTimeout(() => loadGmailAccounts(), 3000);
                                } else {
                                    Alert.alert('Error', 'Failed to get authorization URL');
                                }
                            } catch (err) {
                                console.error('Error fetching auth URL:', err);
                                Alert.alert('Error', 'Failed to initiate connection');
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error adding account:', error);
            Alert.alert('Error', 'Failed to add account');
        }
    };

    const handleSetPrimary = async (accountId) => {
        try {
            const token = await getToken();
            const response = await fetch(`${BASE_URL}/api/gmail/accounts/${accountId}/set-primary`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();

            if (data.success) {
                Alert.alert('Success', data.message);
                loadGmailAccounts();
            }
        } catch (error) {
            console.error('Error setting primary:', error);
            Alert.alert('Error', 'Failed to set primary account');
        }
    };

    const handleDisconnectAccount = (accountId, email) => {
        Alert.alert(
            'Disconnect Account?',
            `Are you sure you want to disconnect ${email}? All emails from this account will be deleted.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disconnect',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await getToken();
                            const response = await fetch(`${BASE_URL}/api/gmail/accounts/${accountId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                },
                            });
                            const data = await response.json();

                            if (data.success) {
                                Alert.alert('Success', data.message);
                                loadGmailAccounts();
                            }
                        } catch (error) {
                            console.error('Error disconnecting:', error);
                            Alert.alert('Error', 'Failed to disconnect account');
                        }
                    },
                },
            ]
        );
    };

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await contextLogout();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to log out. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            {/* Identity Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>ACCOUNT</Text>
                <View style={styles.card}>
                    <View style={styles.identityRow}>
                        <Text style={styles.identityIcon}>👤</Text>
                        <View style={styles.identityInfo}>
                            <Text style={styles.identityName}>User</Text>
                            <Text style={styles.identityEmail}>{user?.email}</Text>
                        </View>
                    </View>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>✅ Securely Connected</Text>
                    </View>
                </View>
            </View>

            {/* Gmail Accounts Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📧 GMAIL ACCOUNTS</Text>

                {gmailAccounts.map((account) => (
                    <View key={account.id} style={styles.card}>
                        <View style={styles.accountHeader}>
                            <View style={styles.accountLabelRow}>
                                <Text style={styles.accountLabel}>{account.label}</Text>
                                {account.isPrimary && (
                                    <View style={styles.primaryBadge}>
                                        <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.accountEmail}>{account.email}</Text>
                            <Text style={styles.accountSync}>
                                Last sync: {account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString() : 'Never'}
                            </Text>
                        </View>
                        <View style={styles.accountActions}>
                            {!account.isPrimary && (
                                <TouchableOpacity
                                    style={styles.setPrimaryButton}
                                    onPress={() => handleSetPrimary(account.id)}
                                >
                                    <Text style={styles.setPrimaryButtonText}>Set Primary</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.disconnectButton}
                                onPress={() => handleDisconnectAccount(account.id, account.email)}
                            >
                                <Text style={styles.disconnectButtonText}>Disconnect</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                {gmailAccounts.length < 3 && (
                    <TouchableOpacity
                        style={styles.addAccountButton}
                        onPress={() => setShowLabelModal(true)}
                    >
                        <Text style={styles.addAccountButtonText}>➕ Add Another Gmail Account</Text>
                    </TouchableOpacity>
                )}

                {gmailAccounts.length === 0 && (
                    <View style={styles.card}>
                        <Text style={styles.noAccountsText}>No Gmail accounts connected</Text>
                        <TouchableOpacity
                            style={styles.connectButton}
                            onPress={() => navigation.navigate('ConnectGmail')}
                        >
                            <Text style={styles.connectButtonText}>Connect Gmail</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* AI Controls */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🤖 AI CONTROLS</Text>

                <View style={styles.card}>
                    <View style={styles.controlRow}>
                        <View>
                            <Text style={styles.controlLabel}>AI Suggestions</Text>
                            <Text style={styles.controlDescription}>
                                Analyze emails and suggest actions
                            </Text>
                        </View>
                        <View style={styles.statusPill}>
                            <Text style={styles.statusPillText}>ON</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.controlRow}>
                        <View>
                            <Text style={styles.controlLabel}>Auto-Actions</Text>
                            <Text style={styles.controlDescription}>
                                AI can take actions without approval
                            </Text>
                        </View>
                        <View style={[styles.statusPill, styles.statusPillDisabled]}>
                            <Text style={styles.statusPillTextDisabled}>OFF</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Security & Privacy */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔒 SECURITY & PRIVACY</Text>
                <View style={styles.card}>
                    <Text style={styles.securityItem}>• Emails are never sent automatically</Text>
                    <Text style={styles.securityItem}>• AI suggestions require your approval</Text>
                    <Text style={styles.securityItem}>• All tokens are encrypted</Text>
                    <Text style={styles.securityItem}>• You can disconnect anytime</Text>
                </View>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>🚪 Log Out</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />

            {/* Label Selection Modal */}
            <Modal
                visible={showLabelModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowLabelModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Choose Account Label</Text>
                        <TouchableOpacity
                            style={styles.labelOption}
                            onPress={() => handleAddAccount('Work')}
                        >
                            <Text style={styles.labelOptionText}>Work 💼</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.labelOption}
                            onPress={() => handleAddAccount('Personal')}
                        >
                            <Text style={styles.labelOptionText}>🏠 Personal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.labelOption}
                            onPress={() => handleAddAccount('Other')}
                        >
                            <Text style={styles.labelOptionText}>📌 Other</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowLabelModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
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
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1C1C1E',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    identityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    identityIcon: {
        fontSize: 40,
        marginRight: 16,
    },
    identityInfo: {
        flex: 1,
    },
    identityName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    identityEmail: {
        fontSize: 15,
        color: '#8E8E93',
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2E7D32',
    },
    accountHeader: {
        marginBottom: 12,
    },
    accountLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    accountLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        marginRight: 8,
    },
    primaryBadge: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    primaryBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    accountEmail: {
        fontSize: 15,
        color: '#3C3C43',
        marginBottom: 4,
    },
    accountSync: {
        fontSize: 13,
        color: '#8E8E93',
    },
    accountActions: {
        flexDirection: 'row',
        gap: 8,
    },
    setPrimaryButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    setPrimaryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    disconnectButton: {
        flex: 1,
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    disconnectButtonText: {
        color: '#FF3B30',
        fontSize: 14,
        fontWeight: '600',
    },
    addAccountButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
    },
    addAccountButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    noAccountsText: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 16,
    },
    connectButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    connectButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    controlRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    controlLabel: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    controlDescription: {
        fontSize: 14,
        color: '#8E8E93',
    },
    statusPill: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusPillText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2E7D32',
    },
    statusPillDisabled: {
        backgroundColor: '#F2F2F7',
    },
    statusPillTextDisabled: {
        color: '#8E8E93',
    },
    securityItem: {
        fontSize: 15,
        lineHeight: 24,
        color: '#3C3C43',
        marginBottom: 8,
    },
    logoutButton: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 32,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    logoutButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FF3B30',
    },
    bottomSpacer: {
        height: 40,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 20,
        textAlign: 'center',
    },
    labelOption: {
        backgroundColor: '#F2F2F7',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    labelOptionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    cancelButton: {
        padding: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8E8E93',
    },
});
