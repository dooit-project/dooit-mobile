import { forwardRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppIcon, AppText, ItemLeading, uiAuditProps, type AppIconName } from '@/components/ui';
import { spacing, useAppTheme } from '@/theme';

export const TaskFormPropertyRow = forwardRef<
  ComponentRef<typeof Pressable>,
  { icon: AppIconName; label: string; value: string; disabled?: boolean; onPress: () => void }
>(function TaskFormPropertyRow({ icon, label, value, disabled, onPress }, ref) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      ref={ref}
      {...uiAuditProps({ uiRow: 'task-form-property', uiAlign: 'text-block', uiTouch: '44' })}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}, 변경`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onFocus={(event) => {
        const target = event.currentTarget as unknown as { matches?: (value: string) => boolean };
        setFocused(Platform.OS !== 'web' || Boolean(target.matches?.(':focus-visible')));
      }}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
        focused && { outlineStyle: 'solid', outlineWidth: 2, outlineColor: theme.colors.primary },
      ]}
    >
      <ItemLeading>
        <AppIcon name={icon} size="menu" color={theme.colors.textSecondary} />
      </ItemLeading>
      <View {...uiAuditProps({ uiText: 'block' })} style={styles.copy}>
        <AppText variant="body" weight="semibold">
          {label}
        </AppText>
        <AppText tone="secondary" variant="label" style={styles.value}>
          {value}
        </AppText>
      </View>
      <AppIcon name="chevron-right" size="menu" color={theme.colors.textSecondary} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    minHeight: 56,
    paddingVertical: spacing[3],
  },
  copy: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  value: { flexShrink: 1, textAlign: 'right' },
});
