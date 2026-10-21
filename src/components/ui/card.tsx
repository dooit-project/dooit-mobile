import type { PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { radii, sizes, useAppTheme } from '@/theme';

type CardVariant = 'default' | 'muted' | 'outlined' | 'sheet' | 'grouped';

type CardProps = PropsWithChildren<
  ViewProps & {
    variant?: CardVariant;
    padded?: boolean;
  }
>;

export function Card({
  children,
  variant = 'default',
  padded = true,
  accessible,
  accessibilityLabel,
  style,
  ...props
}: CardProps) {
  const theme = useAppTheme();
  const variants = {
    grouped: {
      backgroundColor: theme.colors.surface,
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: 0,
      borderCurve: 'continuous' as const,
    },
    default: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    },
    muted: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.surfaceMuted,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border,
    },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderBottomColor: theme.colors.rule,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: 'transparent',
      borderRadius: radii.none,
      borderWidth: 0,
    },
  };

  return (
    <View
      {...props}
      accessible={accessible ?? Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      style={[styles.base, variants[variant], padded && styles.padded, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  padded: {
    padding: sizes.cardPadding,
  },
});
