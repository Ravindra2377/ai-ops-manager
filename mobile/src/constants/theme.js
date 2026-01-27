/**
 * Design System - Theme Constants
 * Centralized design tokens for consistent UI/UX
 */

export const Colors = {
    // Primary Colors
    primary: '#4A90E2',
    primaryDark: '#2E5C8A',
    primaryLight: '#E8F4FF',

    // Semantic Colors
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#5AC8FA',

    // Priority Colors
    urgent: '#FF3B30',
    high: '#FF9500',
    medium: '#4A90E2',
    low: '#8E8E93',

    // Neutral Colors
    background: '#F8F9FA',
    card: '#FFFFFF',
    border: '#E5E5EA',
    textPrimary: '#1C1C1E',
    textSecondary: '#6C6C70',
    textTertiary: '#AEAEB2',
    placeholder: '#999999',

    // Gradients
    gradientStart: '#4A90E2',
    gradientEnd: '#E8F4FF',
};

export const Typography = {
    // Font Sizes
    h1: 28,
    h2: 22,
    h3: 18,
    body: 16,
    caption: 14,
    small: 12,

    // Font Weights
    bold: '700',
    semibold: '600',
    medium: '500',
    regular: '400',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const BorderRadius = {
    small: 8,
    medium: 12,
    large: 16,
    circle: 999,
};

export const Shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
        elevation: 8,
    },
};

export const Animation = {
    fast: 150,
    normal: 250,
    slow: 350,
};
