import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { taskAPI } from '../services/api';

const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

export default function TaskDetailScreen({ route, navigation }) {
    const { taskId } = route.params;
    const isNewTask = !taskId;

    const [loading, setLoading] = useState(!isNewTask);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [status, setStatus] = useState('pending');

    useEffect(() => {
        if (!isNewTask) {
            loadTask();
        }
    }, []);

    const loadTask = async () => {
        try {
            const response = await taskAPI.getAll({ _id: taskId });
            if (response.data.success && response.data.tasks.length > 0) {
                const task = response.data.tasks[0];
                setTitle(task.title);
                setDescription(task.description || '');
                setPriority(task.priority);
                setStatus(task.status);
            }
        } catch (error) {
            console.error('Error loading task:', error);
            Alert.alert('Error', 'Failed to load task');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a task title');
            return;
        }

        setSaving(true);
        try {
            const taskData = {
                title: title.trim(),
                description: description.trim(),
                priority,
                status,
            };

            if (isNewTask) {
                await taskAPI.create(taskData);
                Alert.alert('Success', 'Task created');
            } else {
                await taskAPI.update(taskId, taskData);
                Alert.alert('Success', 'Task updated');
            }

            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to save task');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await taskAPI.delete(taskId);
                            Alert.alert('Success', 'Task deleted');
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete task');
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
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isNewTask ? 'New Task' : 'Edit Task'}
                </Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
                        {saving ? 'Saving...' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Title Input */}
                <View style={styles.section}>
                    <Text style={styles.label}>Title *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter task title"
                        value={title}
                        onChangeText={setTitle}
                        multiline
                        maxLength={200}
                    />
                </View>

                {/* Description Input */}
                <View style={styles.section}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Add details..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Priority Selector */}
                <View style={styles.section}>
                    <Text style={styles.label}>Priority</Text>
                    <View style={styles.priorityButtons}>
                        {PRIORITY_OPTIONS.map((p) => (
                            <TouchableOpacity
                                key={p}
                                style={[
                                    styles.priorityButton,
                                    priority === p && styles.priorityButtonActive,
                                    priority === p && styles[`priority${p.charAt(0).toUpperCase() + p.slice(1)}`],
                                ]}
                                onPress={() => setPriority(p)}
                            >
                                <Text
                                    style={[
                                        styles.priorityButtonText,
                                        priority === p && styles.priorityButtonTextActive,
                                    ]}
                                >
                                    {p.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Status Selector */}
                {!isNewTask && (
                    <View style={styles.section}>
                        <Text style={styles.label}>Status</Text>
                        <View style={styles.statusButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.statusButton,
                                    status === 'pending' && styles.statusButtonActive,
                                ]}
                                onPress={() => setStatus('pending')}
                            >
                                <Text
                                    style={[
                                        styles.statusButtonText,
                                        status === 'pending' && styles.statusButtonTextActive,
                                    ]}
                                >
                                    Pending
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.statusButton,
                                    status === 'completed' && styles.statusButtonActive,
                                ]}
                                onPress={() => setStatus('completed')}
                            >
                                <Text
                                    style={[
                                        styles.statusButtonText,
                                        status === 'completed' && styles.statusButtonTextActive,
                                    ]}
                                >
                                    Completed
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Delete Button */}
                {!isNewTask && (
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Text style={styles.deleteButtonText}>Delete Task</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
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
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backButton: {
        fontSize: 17,
        color: '#007AFF',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    saveButton: {
        fontSize: 17,
        fontWeight: '600',
        color: '#007AFF',
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 16,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    input: {
        fontSize: 17,
        color: '#000',
        padding: 12,
        backgroundColor: '#F2F2F7',
        borderRadius: 10,
    },
    textArea: {
        minHeight: 100,
    },
    priorityButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    priorityButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
    },
    priorityButtonActive: {
        borderWidth: 2,
    },
    priorityLow: {
        backgroundColor: '#34C759',
        borderColor: '#34C759',
    },
    priorityMedium: {
        backgroundColor: '#FF9500',
        borderColor: '#FF9500',
    },
    priorityHigh: {
        backgroundColor: '#FF3B30',
        borderColor: '#FF3B30',
    },
    priorityButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    priorityButtonTextActive: {
        color: '#fff',
    },
    statusButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    statusButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
    },
    statusButtonActive: {
        backgroundColor: '#007AFF',
    },
    statusButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    statusButtonTextActive: {
        color: '#fff',
    },
    deleteButton: {
        backgroundColor: '#fff',
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 32,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30',
    },
});
