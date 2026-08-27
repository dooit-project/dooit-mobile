import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import type { PressableProps, ViewStyle } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { radii, sizes, spacing, useAppTheme } from '@/theme';

import { AppText } from './app-text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'compact' | 'medium' | 'large';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leading?: ReactNode;
  style?: ViewStyle;
};

export const Button = forwardRef<ComponentRef<typeof Pressable>, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    size = 'medium',
    loading = false,
    fullWidth = false,
    leading,
    disabled,
    accessibilityState,
    onBlur,
    onFocus,
    style,
    ...props
  },
  ref,
) {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const isDisabled = disabled || loading;
  const variants = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      textColor: theme.colors.textOnPrimary,
      pressedColor: theme.colors.primaryPressed,
    },
    secondary: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primarySoft,
      textColor: theme.colors.primary,
      pressedColor: theme.colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: theme.colors.textSecondary,
      pressedColor: theme.colors.surfaceMuted,
    },
    danger: {
      backgroundColor: theme.colors.danger,
      borderColor: theme.colors.danger,
      textColor: theme.colors.textOnPrimary,
      pressedColor: theme.colors.dangerPressed,
    },
  };
  const selected = variants[variant];

  return (
    <Pressable
      {...props}
      ref={ref}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      style={({ pressed }) => [
        styles.base,
        size === 'large' ? styles.large : size === 'compact' ? styles.compact : styles.medium,
        {
          backgroundColor: pressed ? selected.pressedColor : selected.backgroundColor,
          borderColor: isFocused ? theme.colors.text : selected.borderColor,
          borderWidth: isFocused ? 2 : 1,
          opacity: isDisabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={selected.textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {leading}
          <AppText
            variant="label"
            weight="bold"
            style={[styles.label, { color: selected.textColor }]}
          >
            {children}
          </AppText>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  medium: {
    minHeight: sizes.touchTarget,
  },
  compact: {
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing[2],
  },
  large: {
    minHeight: 48,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'center',
    minWidth: 0,
  },
  label: {
    flexShrink: 1,
    textAlign: 'center',
  },
});
