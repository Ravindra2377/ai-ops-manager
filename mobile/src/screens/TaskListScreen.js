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
import { taskAPI } from '../services/api';

const STATUS_TABS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Done' },
];

export default function TaskListScreen({ navigation }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState('all');

    useEffect(() => {
        loadTasks();
    }, [selectedTab]);

    const loadTasks = async () => {
        try {
            const filters = selectedTab !== 'all' ? { status: selectedTab } : {};
            const response = await taskAPI.getAll(filters);

            if (response.data.success) {
                setTasks(response.data.tasks);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            Alert.alert('Error', 'Failed to load tasks');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleToggleComplete = async (taskId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
            await taskAPI.update(taskId, { status: newStatus });
            loadTasks();
        } catch (error) {
            Alert.alert('Error', 'Failed to update task');
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTasks();
    };

    const renderTaskCard = ({ item }) => {
        const isCompleted = item.status === 'completed';
        const priorityColor = {
            high: '#FF3B30',
            medium: '#FF9500',
            low: '#34C759',
        }[item.priority] || '#8E8E93';

        return (
            <TouchableOpacity
                style={styles.taskCard}
                onPress={() => navigation.navigate('TaskDetail', { taskId: item._id })}
                activeOpacity={0.7}
            >
                <View style={styles.taskHeader}>
                    <TouchableOpacity
                        style={[
                            styles.checkbox,
                            isCompleted && styles.checkboxCompleted,
                        ]}
                        onPress={() => handleToggleComplete(item._id, item.status)}
                    >
                        {isCompleted ? <Text style={styles.checkmark}>✓</Text> : null}
                    </TouchableOpacity>

                    <View style={styles.taskContent}>
                        <Text
                            style={[
                                styles.taskTitle,
                                isCompleted && styles.taskTitleCompleted,
                            ]}
                            numberOfLines={2}
                        >
                            {item.title}
                        </Text>
                        {item.description ? (
                            <Text style={styles.taskDescription} numberOfLines={1}>
                                {item.description}
                            </Text>
                        ) : null}
                        <View style={styles.taskMeta}>
                            <View
                                style={[styles.priorityBadge, { backgroundColor: priorityColor }]}
                            >
                                <Text style={styles.priorityText}>
                                    {item.priority.toUpperCase()}
                                </Text>
                            </View>
                            {item.createdBy === 'ai' ? (
                                <Text style={styles.aiTag}>🤖 AI</Text>
                            ) : null}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Tasks</Text>
            <Text style={styles.emptyText}>
                {selectedTab === 'all'
                    ? 'Create tasks from emails or add manually'
                    : `No ${selectedTab} tasks`}
            </Text>
            <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate('TaskDetail', { taskId: null })}
            >
                <Text style={styles.createButtonText}>+ Create Task</Text>
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
                <Text style={styles.title}>Tasks</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('TaskDetail', { taskId: null })}
                >
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            {/* Status Tabs */}
            <View style={styles.tabs}>
                {STATUS_TABS.map((tab) => {
                    const count =
                        tab.key === 'all'
                            ? tasks.length
                            : tasks.filter((t) => t.status === tab.key).length;

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

            {/* Task List */}
            <FlatList
                data={tasks}
                renderItem={renderTaskCard}
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
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: '300',
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
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#007AFF',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxCompleted: {
        backgroundColor: '#007AFF',
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    taskContent: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    taskTitleCompleted: {
        textDecorationLine: 'line-through',
        color: '#8E8E93',
    },
    taskDescription: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 8,
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    aiTag: {
        fontSize: 12,
        color: '#8E8E93',
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
    createButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
