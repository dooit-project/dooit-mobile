import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import type { PressableProps, ViewStyle } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { radii, sizes, spacing, useAppTheme } from '@/theme';

import { AppText } from './app-text';
import { uiAuditProps } from './ui-audit-props';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dangerOutline';
type ButtonSize = 'compact' | 'medium' | 'large';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leading?: ReactNode;
  labelVariant?: 'bodyLarge' | 'body' | 'label';
  contentAlignment?: 'center' | 'start';
  focusAppearance?: 'border' | 'ring';
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
    labelVariant,
    contentAlignment = 'center',
    focusAppearance = 'border',
    disabled,
    accessibilityLabel,
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
  const [isFocusVisible, setIsFocusVisible] = useState(false);
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
    outline: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.borderStrong,
      textColor: theme.colors.textSecondary,
      pressedColor: theme.colors.surfaceMuted,
    },
    dangerOutline: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.border,
      textColor: theme.colors.danger,
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
  const resolvedLabelVariant = labelVariant ?? (size === 'compact' ? 'label' : 'body');

  return (
    <Pressable
      {...props}
      {...uiAuditProps({ uiTouch: '44' })}
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ?? (typeof children === 'string' ? children : undefined)
      }
      accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onBlur={(event) => {
        setIsFocused(false);
        setIsFocusVisible(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        setIsFocused(true);
        const target = event.target as unknown as { matches?: (selector: string) => boolean };
        setIsFocusVisible(target.matches?.(':focus-visible') ?? true);
        onFocus?.(event);
      }}
      style={({ pressed }) => [
        styles.base,
        size === 'large' ? styles.large : size === 'compact' ? styles.compact : styles.medium,
        contentAlignment === 'start' && styles.start,
        {
          backgroundColor: pressed ? selected.pressedColor : selected.backgroundColor,
          borderColor:
            isFocused && focusAppearance === 'border' ? theme.colors.text : selected.borderColor,
          borderWidth: variant === 'dangerOutline' || variant === 'outline' ? 1 : 2,
          opacity: isDisabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
        focusAppearance === 'ring' && isFocused && isFocusVisible
          ? {
              outlineColor: theme.colors.primary,
              outlineWidth: 2,
              outlineOffset: 2,
              outlineStyle: 'solid',
            }
          : undefined,
      ]}
    >
      <View
        {...(leading ? uiAuditProps({ uiRow: 'button', uiAlign: 'text-block' }) : {})}
        style={[
          styles.content,
          contentAlignment === 'start' && styles.startContent,
          loading && styles.hiddenContent,
        ]}
      >
        {leading}
        <AppText
          {...uiAuditProps({ uiText: 'block' })}
          variant={resolvedLabelVariant}
          weight="semibold"
          style={[
            styles.label,
            contentAlignment === 'start' && styles.startLabel,
            { color: selected.textColor },
          ]}
        >
          {children}
        </AppText>
      </View>
      {loading ? (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <ActivityIndicator
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            color={selected.textColor}
            size="small"
          />
        </View>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 2,
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
    maxWidth: '100%',
  },
  hiddenContent: { opacity: 0 },
  start: { alignItems: 'flex-start' },
  startContent: { justifyContent: 'flex-start' },
  startLabel: { textAlign: 'left' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flexShrink: 1,
    textAlign: 'center',
  },
});
