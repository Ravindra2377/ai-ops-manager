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
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { taskAPI } from '../services/api';
import Button from '../components/Button'; // Assuming you have this
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

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
            if (response.data && response.data.length > 0) {
                // API returns array, we need to find the specific one or backend returns array
                // Based on API signature: getAll returns array. 
                // Ideally getById would be better but reusing getAll is what was there.
                const task = response.data.find(t => t._id === taskId) || response.data[0];
                if (task) {
                    setTitle(task.title);
                    setDescription(task.description || '');
                    setPriority(task.priority);
                    setStatus(task.status);
                }
            } else if (Array.isArray(response.data)) {
                const task = response.data.find(t => t._id === taskId);
                if (task) {
                    setTitle(task.title);
                    setDescription(task.description || '');
                    setPriority(task.priority);
                    setStatus(task.status);
                }
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
                priority: priority.toUpperCase(), // Ensure uppercase for backend enum
                status: status.toUpperCase(),
            };

            if (isNewTask) {
                await taskAPI.create(taskData);
            } else {
                await taskAPI.update(taskId, taskData);
            }

            Alert.alert('Success', `Task ${isNewTask ? 'created' : 'updated'} successfully`);
            navigation.goBack();
        } catch (error) {
            console.error(error);
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
                            // Alert.alert('Success', 'Task deleted'); // Optional, navigation back is enough usually
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
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Text style={styles.headerButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isNewTask ? 'New Task' : 'Edit Task'}
                </Text>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.headerButton}>
                    <Text style={[styles.saveButtonText, saving && styles.disabledText]}>
                        {saving ? 'Saving...' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Title Input */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="What needs to be done?"
                            placeholderTextColor={Colors.textTertiary}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={200}
                        />
                    </View>

                    {/* Description Input */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Add details, context, or links..."
                            placeholderTextColor={Colors.textTertiary}
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
                        <View style={styles.pillContainer}>
                            {PRIORITY_OPTIONS.map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    style={[
                                        styles.pill,
                                        priority.toLowerCase() === p && styles[`pill${p.charAt(0).toUpperCase() + p.slice(1)}`],
                                    ]}
                                    onPress={() => setPriority(p)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.pillText,
                                            priority.toLowerCase() === p && styles.pillTextActive,
                                        ]}
                                    >
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Status Selector (Edit Mode Only) */}
                    {!isNewTask && (
                        <View style={styles.section}>
                            <Text style={styles.label}>Status</Text>
                            <View style={styles.pillContainer}>
                                {['pending', 'completed'].map((s) => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[
                                            styles.pill,
                                            status.toLowerCase() === s && styles.pillActive,
                                        ]}
                                        onPress={() => setStatus(s)}
                                    >
                                        <Text
                                            style={[
                                                styles.pillText,
                                                status.toLowerCase() === s && styles.pillTextActive,
                                            ]}
                                        >
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
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
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? 40 : 60, // Basic safe area
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
    },
    headerButton: {
        padding: Spacing.xs,
    },
    headerButtonText: {
        fontSize: Typography.body,
        color: Colors.textSecondary,
    },
    headerTitle: {
        fontSize: Typography.h3,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
    },
    saveButtonText: {
        fontSize: Typography.body,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    disabledText: {
        color: Colors.textTertiary,
    },
    content: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl * 2,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    label: {
        fontSize: Typography.caption,
        fontWeight: Typography.bold,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.body,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    textArea: {
        minHeight: 120,
    },
    pillContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    pill: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: BorderRadius.pill,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    pillActive: { // Generic active (e.g. for status)
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    // Priority specific active styles
    pillLow: {
        backgroundColor: Colors.low,
        borderColor: Colors.low,
    },
    pillMedium: {
        backgroundColor: Colors.medium,
        borderColor: Colors.medium,
    },
    pillHigh: {
        backgroundColor: Colors.urgent,
        borderColor: Colors.urgent,
    },
    pillText: {
        fontSize: Typography.body,
        fontWeight: Typography.semibold,
        color: Colors.textSecondary,
    },
    pillTextActive: {
        color: Colors.textInverted,
    },
    deleteButton: {
        marginTop: Spacing.xl,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.error,
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    deleteButtonText: {
        color: Colors.error,
        fontWeight: Typography.bold,
        fontSize: Typography.body,
    },
});
