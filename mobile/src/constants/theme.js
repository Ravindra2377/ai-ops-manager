/**
 * Design System - Theme Constants
 * Centralized design tokens for consistent UI/UX
 */

export const Colors = {
    // Brand Colors - AI/Executive Feel
    primary: '#6366F1',        // Indigo - Main brand color
    primaryDark: '#4F46E5',    // Darker indigo for active states
    primaryLight: '#EEF2FF',   // Very light indigo for backgrounds
    accent: '#8B5CF6',         // Purple accent for gradients

    // Semantic Colors
    success: '#10B981',        // Modern emerald green
    warning: '#F59E0B',        // Amber for warnings
    error: '#EF4444',          // Modern red for errors/high urgency
    info: '#3B82F6',           // Blue for information

    // AI Specific
    ai: '#8B5CF6',             // Purple for AI elements
    aiGlow: '#A78BFA',         // Light purple for glow effects

    // Priority/Urgency Colors
    urgent: '#EF4444',         // Red
    high: '#F97316',           // Orange
    medium: '#F59E0B',         // Amber
    low: '#10B981',            // Emerald

    // Neutral Colors
    background: '#FFFFFF',     // Clean white background
    surface: '#F8FAFC',        // Slight off-white for secondary backgrounds
    card: '#FFFFFF',           // White for cards
    border: '#E2E8F0',         // Light gray border

    // Text Colors
    textPrimary: '#1E293B',    // Slate 800 - High contrast text
    textSecondary: '#64748B',  // Slate 500 - Secondary text
    textTertiary: '#94A3B8',   // Slate 400 - Disabled/Placeholder
    textInverted: '#FFFFFF',   // White text on dark backgrounds

    // Gradients
    gradientPrimaryStart: '#6366F1',
    gradientPrimaryEnd: '#8B5CF6',
    gradientUrgentStart: '#EF4444',
    gradientUrgentEnd: '#F87171',
    gradientSuccessStart: '#10B981',
    gradientSuccessEnd: '#34D399',
};

export const Typography = {
    // Font Sizes
    display: 32,
    h1: 24,
    h2: 20,
    h3: 18,
    body: 16,
    caption: 14,
    small: 12,
    tiny: 10,

    // Font Weights
    bold: '700',
    semibold: '600',
    medium: '500',
    regular: '400',
    light: '300',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    section: 60,
};

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 999,
};

export const Shadows = {
    sm: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    lg: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    glow: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 5,
    },
};

export const Animation = {
    fast: 150,
    normal: 250,
    slow: 350,
    spring: {
        damping: 15,
        stiffness: 120,
    },
};
