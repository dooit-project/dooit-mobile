import { useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { radii, sizes, spacing, useAppTheme } from '@/theme';

import { AppText } from './app-text';
import { uiAuditProps } from './ui-audit-props';

type Option<Value extends string> = {
  value: Value;
  label: string;
  accessibilityLabel?: string;
};

/** A compact, single-choice group; it keeps the same options on every platform. */
export function SegmentedControl<Value extends string>({
  options,
  value,
  accessibilityLabel,
  disabled = false,
  onValueChange,
}: {
  options: readonly Option<Value>[];
  value: Value;
  accessibilityLabel: string;
  disabled?: boolean;
  onValueChange: (value: Value) => void;
}) {
  const theme = useAppTheme();
  const nodes = useRef<Record<string, ComponentRef<typeof Pressable> | null>>({});
  const [focused, setFocused] = useState<Value | null>(null);

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.group, { backgroundColor: theme.colors.surfaceMuted }]}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <Pressable
            {...uiAuditProps({ uiTouch: '44' })}
            key={option.value}
            ref={(node) => {
              nodes.current[option.value] = node;
            }}
            accessibilityRole="radio"
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityState={{ checked: selected, disabled }}
            aria-checked={selected}
            disabled={disabled}
            tabIndex={Platform.OS === 'web' ? (selected && !disabled ? 0 : -1) : undefined}
            onFocus={(event) => {
              const target = event.currentTarget as unknown as {
                matches?: (selector: string) => boolean;
              };
              if (Platform.OS === 'web' && target.matches?.(':focus-visible'))
                setFocused(option.value);
            }}
            onBlur={() => setFocused(null)}
            onPress={() => onValueChange(option.value)}
            {...(Platform.OS === 'web'
              ? {
                  onKeyDown: (event: {
                    key: string;
                    altKey?: boolean;
                    ctrlKey?: boolean;
                    metaKey?: boolean;
                    preventDefault: () => void;
                  }) => {
                    if (disabled || event.altKey || event.ctrlKey || event.metaKey) return;
                    // Pressable already activates Enter on keyup; handle radio Space here.
                    if ([' ', 'Spacebar'].includes(event.key)) {
                      event.preventDefault();
                      onValueChange(option.value);
                      return;
                    }
                    let next = index;
                    if (['ArrowRight', 'ArrowDown'].includes(event.key))
                      next = (index + 1) % options.length;
                    else if (['ArrowLeft', 'ArrowUp'].includes(event.key))
                      next = (index + options.length - 1) % options.length;
                    else if (event.key === 'Home') next = 0;
                    else if (event.key === 'End') next = options.length - 1;
                    else return;
                    event.preventDefault();
                    onValueChange(options[next].value);
                    nodes.current[options[next].value]?.focus();
                  },
                }
              : {})}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: selected
                  ? theme.colors.surfaceElevated
                  : pressed
                    ? theme.colors.border
                    : 'transparent',
                borderColor: selected ? theme.colors.borderStrong : 'transparent',
                opacity: disabled ? 0.5 : 1,
              },
              focused === option.value
                ? {
                    outlineStyle: 'solid',
                    outlineColor: theme.colors.primary,
                    outlineWidth: 2,
                    outlineOffset: 1,
                  }
                : null,
            ]}
          >
            <AppText
              variant="label"
              weight="semibold"
              tone={selected ? 'primary' : 'secondary'}
              align="center"
              style={styles.label}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', gap: spacing[1], padding: spacing[1], borderRadius: radii.lg },
  option: {
    flex: 1,
    minWidth: 0,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[2],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
  },
  label: { flexShrink: 1 },
});
