import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { spacing, useAppTheme } from '@/theme';

import { AppText } from './app-text';
import { AppIcon } from './app-icon';

export function AddItemRow({
  children,
  disabled,
  onPress,
}: {
  children: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={children}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.primarySoft : 'transparent',
          borderColor: focused ? theme.colors.primary : 'transparent',
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      <AppIcon name="plus" size="list" color={theme.colors.textSecondary} />
      <AppText tone="secondary" weight="semibold" style={styles.label}>
        {children}
      </AppText>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    gap: spacing[5],
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderRadius: 8,
  },
  label: { flexShrink: 1 },
});
