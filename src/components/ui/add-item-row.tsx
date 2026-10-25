import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { spacing, useAppTheme } from '@/theme';

import { AppText } from './app-text';
import { AppIcon } from './app-icon';
import { uiAuditProps } from './ui-audit-props';

export function AddItemRow({
  children,
  disabled,
  onPress,
  compact = false,
  tone = 'secondary',
}: {
  children: string;
  disabled?: boolean;
  onPress: () => void;
  compact?: boolean;
  tone?: 'primary' | 'secondary';
}) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      {...uiAuditProps({ uiRow: 'add-item', uiAlign: 'text-block', uiTouch: '44' })}
      accessibilityRole="button"
      accessibilityLabel={children}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.row,
        compact && styles.compact,
        {
          backgroundColor: pressed ? theme.colors.primarySoft : 'transparent',
          borderColor: focused ? theme.colors.primary : 'transparent',
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      <AppIcon
        name="plus"
        size="list"
        color={tone === 'primary' ? theme.colors.primary : theme.colors.textSecondary}
      />
      <AppText
        {...uiAuditProps({ uiText: 'block' })}
        tone={tone}
        weight="semibold"
        style={styles.label}
      >
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
  compact: { minHeight: 44, paddingVertical: spacing[2], paddingHorizontal: 0 },
});
