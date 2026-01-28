import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import Button from '../components/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

export default function ProfileScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [gmailAccounts, setGmailAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newAppPassword, setNewAppPassword] = useState('');
    const [connecting, setConnecting] = useState(false);

    // AI Settings State
    const [aiSettings, setAiSettings] = useState({
        autoReply: false,
        dailySummary: true,
        urgencyNotifications: true,
    });

    useEffect(() => {
        loadGmailAccounts();
    }, []);

    const loadGmailAccounts = async () => {
        try {
            const data = await authAPI.getGmailAccounts();
            setGmailAccounts(data);
        } catch (error) {
            console.error('Failed to load Gmail accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectGmail = async () => {
        if (!newEmail || !newAppPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setConnecting(true);
        try {
            await authAPI.connectGmail({ email: newEmail, appPassword: newAppPassword });
            Alert.alert('Success', 'Gmail account connected successfully');
            setShowConnectModal(false);
            setNewEmail('');
            setNewAppPassword('');
            loadGmailAccounts();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to connect account');
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async (accountId) => {
        Alert.alert(
            'Disconnect Details',
            'Are you sure you want to disconnect this account?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disconnect',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authAPI.disconnectGmail(accountId);
                            loadGmailAccounts();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to disconnect account');
                        }
                    }
                }
            ]
        );
    };

    const toggleSetting = (key) => {
        setAiSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const AccountCard = ({ account }) => (
        <View style={styles.accountCard}>
            <View style={styles.accountInfo}>
                <View style={[styles.statusDot, { backgroundColor: account.status === 'CONNECTED' ? Colors.success : Colors.error }]} />
                <View>
                    <Text style={styles.accountEmail}>{account.email}</Text>
                    <Text style={styles.lastSync}>
                        Last Synced: {account.lastSync ? new Date(account.lastSync).toLocaleString() : 'Never'}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                onPress={() => handleDisconnect(account._id)}
                style={styles.disconnectButton}
            >
                <Text style={styles.disconnectText}>✕</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Header */}
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                </View>

                {/* Connected Accounts */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Connected Accounts</Text>
                    {loading ? (
                        <ActivityIndicator color={Colors.primary} />
                    ) : (
                        gmailAccounts.map(account => (
                            <AccountCard key={account._id} account={account} />
                        ))
                    )}
                    <Button
                        title="Connect New Account"
                        variant="outline"
                        onPress={() => setShowConnectModal(true)}
                        style={styles.addButton}
                        icon={<Text style={{ color: Colors.primary, marginRight: 8, fontSize: 18 }}>+</Text>}
                    />
                </View>

                {/* AI Preferences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>AI Preferences</Text>

                    <View style={styles.settingRow}>
                        <View>
                            <Text style={styles.settingLabel}>Auto-Draft Replies</Text>
                            <Text style={styles.settingDescription}>AI will prepare drafts for urgent emails</Text>
                        </View>
                        <Switch
                            value={aiSettings.autoReply}
                            onValueChange={() => toggleSetting('autoReply')}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View>
                            <Text style={styles.settingLabel}>Daily Morning Summary</Text>
                            <Text style={styles.settingDescription}>Get a summary notification at 8 AM</Text>
                        </View>
                        <Switch
                            value={aiSettings.dailySummary}
                            onValueChange={() => toggleSetting('dailySummary')}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View>
                            <Text style={styles.settingLabel}>Urgent Notifications</Text>
                            <Text style={styles.settingDescription}>Push alerts for high priority items</Text>
                        </View>
                        <Switch
                            value={aiSettings.urgencyNotifications}
                            onValueChange={() => toggleSetting('urgencyNotifications')}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                        />
                    </View>
                </View>

                <Button
                    title="Sign Out"
                    variant="ghost"
                    onPress={logout}
                    style={styles.logoutButton}
                    textStyle={{ color: Colors.error }}
                />
            </ScrollView>

            {/* Connect Modal */}
            <Modal
                visible={showConnectModal}
                transparent={true}
                animationType="slide"
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Connect Gmail</Text>
                        <Text style={styles.modalSubtitle}>Enter your email and app password</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            value={newEmail}
                            onChangeText={setNewEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="App Password (16 chars)"
                            value={newAppPassword}
                            onChangeText={setNewAppPassword}
                            secureTextEntry={false} // App passwords are often copied/pasted, visible is easier
                        />

                        <View style={styles.modalActions}>
                            <Button
                                title="Cancel"
                                variant="ghost"
                                onPress={() => setShowConnectModal(false)}
                                style={{ flex: 1, marginRight: 8 }}
                            />
                            <Button
                                title="Connect"
                                variant="primary"
                                onPress={handleConnectGmail}
                                loading={connecting}
                                style={{ flex: 1, marginLeft: 8 }}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingTop: 60,
        paddingHorizontal: Spacing.lg,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.circle,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    userName: {
        fontSize: Typography.h2,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: Typography.body,
        color: Colors.textSecondary,
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
    accountCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.card,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.sm,
    },
    accountInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: Spacing.md,
    },
    accountEmail: {
        fontSize: Typography.body,
        fontWeight: Typography.semibold,
        color: Colors.textPrimary,
    },
    lastSync: {
        fontSize: Typography.tiny,
        color: Colors.textSecondary,
    },
    disconnectButton: {
        padding: Spacing.xs,
        borderRadius: BorderRadius.circle,
        backgroundColor: Colors.surface,
    },
    disconnectText: {
        fontSize: Typography.small,
        color: Colors.textSecondary,
        fontWeight: 'bold',
    },
    addButton: {
        marginTop: Spacing.sm,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    settingLabel: {
        fontSize: Typography.body,
        fontWeight: Typography.semibold,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: Typography.tiny,
        color: Colors.textSecondary,
    },
    logoutButton: {
        marginTop: Spacing.lg,
        borderColor: Colors.error,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modalCard: {
        width: '100%',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        ...Shadows.lg,
    },
    modalTitle: {
        fontSize: Typography.h2,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: Typography.body,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
        textAlign: 'center',
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.md,
        fontSize: Typography.body,
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: Spacing.md,
    },
});
