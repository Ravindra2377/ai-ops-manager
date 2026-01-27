import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../constants/theme';

export default function Button({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style
}) {
    const buttonStyles = [
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'text' && styles.textButton,
        (disabled || loading) && styles.disabled,
        style,
    ];

    const textStyles = [
        styles.text,
        variant === 'primary' && styles.primaryText,
        variant === 'secondary' && styles.secondaryText,
        variant === 'text' && styles.textButtonText,
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? '#fff' : Colors.primary} />
            ) : (
                <Text style={textStyles}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: BorderRadius.medium,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        ...Shadows.medium,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    textButton: {
        backgroundColor: 'transparent',
        paddingVertical: Spacing.sm,
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontSize: Typography.body,
        fontWeight: Typography.semibold,
    },
    primaryText: {
        color: '#fff',
    },
    secondaryText: {
        color: Colors.primary,
    },
    textButtonText: {
        color: Colors.primary,
    },
});
