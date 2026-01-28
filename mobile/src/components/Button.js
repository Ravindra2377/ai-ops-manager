import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

export default function Button({
    title,
    onPress,
    variant = 'primary', // primary, secondary, outline, danger
    size = 'medium', // small, medium, large
    loading = false,
    disabled = false,
    icon = null,
    style,
    textStyle,
    fullWidth = false,
}) {
    // Determine content based on variant
    const isGradient = variant === 'primary' || variant === 'success' || variant === 'urgent';

    const getGradientColors = () => {
        switch (variant) {
            case 'primary':
                return [Colors.gradientPrimaryStart, Colors.gradientPrimaryEnd];
            case 'success':
                return [Colors.gradientSuccessStart, Colors.gradientSuccessEnd];
            case 'urgent':
                return [Colors.gradientUrgentStart, Colors.gradientUrgentEnd];
            default:
                return [Colors.primary, Colors.primaryDark];
        }
    };

    const getButtonStyle = () => {
        let baseStyle = [
            styles.button,
            fullWidth && styles.fullWidth,
            styles[`${size}Button`],
            disabled && styles.disabledButton,
        ];

        if (!isGradient) {
            switch (variant) {
                case 'secondary':
                    baseStyle.push(styles.secondaryButton);
                    break;
                case 'outline':
                    baseStyle.push(styles.outlineButton);
                    break;
                case 'ghost':
                    baseStyle.push(styles.ghostButton);
                    break;
            }
        }

        return baseStyle;
    };

    const getTextStyle = () => {
        let baseText = [
            styles.text,
            styles[`${size}Text`],
            textStyle,
        ];

        if (variant === 'outline' || variant === 'ghost') {
            baseText.push(styles.primaryText);
        } else if (variant === 'secondary') {
            baseText.push(styles.secondaryText);
        } else {
            baseText.push(styles.invertedText);
        }

        if (disabled) {
            baseText.push(styles.disabledText);
        }

        return baseText;
    };

    const content = (
        <View style={styles.contentContainer}>
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' || variant === 'ghost' ? Colors.primary : '#FFF'}
                    size="small"
                />
            ) : (
                <>
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    <Text style={getTextStyle()}>{title}</Text>
                </>
            )}
        </View>
    );

    if (isGradient && !disabled && variant !== 'outline' && variant !== 'ghost') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.8}
                style={[styles.container, fullWidth && styles.fullWidth, style]}
            >
                <LinearGradient
                    colors={getGradientColors()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={getButtonStyle()}
                >
                    {content}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.6}
            style={[getButtonStyle(), style]}
        >
            {content}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.md,
        ...Shadows.sm,
    },
    button: {
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    fullWidth: {
        width: '100%',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginRight: Spacing.sm,
    },

    // Sizes
    smallButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        minHeight: 36,
    },
    mediumButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        minHeight: 48,
    },
    largeButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        minHeight: 56,
    },

    // Variants
    secondaryButton: {
        backgroundColor: Colors.primaryLight,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    ghostButton: {
        backgroundColor: 'transparent',
    },
    disabledButton: {
        backgroundColor: Colors.border,
        borderColor: Colors.border,
        shadowOpacity: 0,
        elevation: 0,
    },

    // Text Styles
    text: {
        fontWeight: Typography.semibold,
        letterSpacing: 0.5,
    },
    smallText: {
        fontSize: Typography.small,
    },
    mediumText: {
        fontSize: Typography.body,
    },
    largeText: {
        fontSize: Typography.h3,
    },
    invertedText: {
        color: Colors.textInverted,
    },
    primaryText: {
        color: Colors.primary,
    },
    secondaryText: {
        color: Colors.primaryDark,
    },
    disabledText: {
        color: Colors.textTertiary,
    },
});
