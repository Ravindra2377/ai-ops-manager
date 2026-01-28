import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { taskAPI } from '../api';
import PriorityBadge from '../components/PriorityBadge';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

const STATUS_Tabs = [
    { key: 'ALL', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'COMPLETED', label: 'Done' },
];

export default function TaskListScreen({ navigation }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState('PENDING');

    const loadTasks = async () => {
        try {
            setLoading(true);
            const data = await taskAPI.getAll();
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const handleToggleComplete = async (taskId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

            // Optimistic update
            setTasks(tasks.map(t =>
                t._id === taskId ? { ...t, status: newStatus } : t
            ));

            await taskAPI.update(taskId, { status: newStatus });
        } catch (error) {
            console.error('Failed to update task:', error);
            Alert.alert('Error', 'Failed to update task status');
            // Revert on error
            loadTasks();
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (selectedTab === 'ALL') return true;
        return task.status === selectedTab;
    });

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'HIGH': return Colors.urgent;
            case 'MEDIUM': return Colors.high;
            case 'LOW': return Colors.medium;
            default: return Colors.textTertiary;
        }
    };

    const TaskCard = ({ item }) => {
        const isCompleted = item.status === 'COMPLETED';
        const priorityColor = getPriorityColor(item.priority);

        return (
            <TouchableOpacity
                style={[styles.card, isCompleted && styles.cardCompleted]}
                onPress={() => navigation.navigate('TaskDetail', { taskId: item._id })}
                activeOpacity={0.7}
            >
                <View style={[styles.accentBar, { backgroundColor: isCompleted ? Colors.success : priorityColor }]} />

                <View style={styles.cardContent}>
                    <TouchableOpacity
                        style={[styles.checkbox, isCompleted && styles.checkboxChecked]}
                        onPress={() => handleToggleComplete(item._id, item.status)}
                    >
                        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>

                    <View style={styles.taskInfo}>
                        <Text
                            style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}
                            numberOfLines={1}
                        >
                            {item.title}
                        </Text>

                        <View style={styles.taskMeta}>
                            <PriorityBadge priority={item.priority} mini />
                            {item.source === 'EMAIL' && (
                                <View style={styles.aiTag}>
                                    <Text style={styles.aiTagText}>🤖 AI</Text>
                                </View>
                            )}
                            {item.dueDate && (
                                <Text style={styles.dueDate}>
                                    📅 {new Date(item.dueDate).toLocaleDateString()}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
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
                <Text style={styles.title}>Tasks</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('TaskDetail', { taskId: null })}
                >
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabsContainer}>
                {STATUS_Tabs.map((tab) => (
                    <TabButton key={tab.key} tab={tab} />
                ))}
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredTasks}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <TaskCard item={item} />}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTasks(); }} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No tasks found</Text>
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
    addButton: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.circle,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        fontSize: 24,
        color: Colors.primary,
        fontWeight: '300',
        marginTop: -2,
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
        backgroundColor: Colors.primary,
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
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.md,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    cardCompleted: {
        opacity: 0.7,
    },
    accentBar: {
        width: 4,
        height: '100%',
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        padding: Spacing.md,
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.textTertiary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    checkboxChecked: {
        backgroundColor: Colors.success,
        borderColor: Colors.success,
    },
    checkmark: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: Typography.body,
        fontWeight: Typography.semibold,
        color: Colors.textPrimary,
        marginBottom: 6,
    },
    taskTitleCompleted: {
        textDecorationLine: 'line-through',
        color: Colors.textTertiary,
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    aiTag: {
        backgroundColor: Colors.aiGlow + '30',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    aiTagText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.ai,
    },
    dueDate: {
        fontSize: Typography.small,
        color: Colors.textSecondary,
    },
    emptyState: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: Typography.body,
        color: Colors.textSecondary,
    },
});
