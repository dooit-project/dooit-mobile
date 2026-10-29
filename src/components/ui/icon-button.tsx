import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import type { PressableProps, ViewStyle } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';

import { radii, sizes, useAppTheme } from '@/theme';
import { uiAuditProps } from './ui-audit-props';

type IconButtonProps = Omit<PressableProps, 'accessibilityLabel' | 'children' | 'style'> & {
  accessibilityLabel: string;
  children: ReactNode;
  selected?: boolean;
  variant?: 'soft' | 'plain';
  expanded?: boolean;
  style?: ViewStyle;
  focusAppearance?: 'border' | 'ring';
};

export const IconButton = forwardRef<ComponentRef<typeof Pressable>, IconButtonProps>(
  function IconButton(
    {
      accessibilityLabel,
      children,
      selected = false,
      variant = 'soft',
      expanded,
      disabled,
      onBlur,
      onFocus,
      style,
      focusAppearance = 'border',
      ...props
    },
    ref,
  ) {
    const theme = useAppTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isFocusVisible, setIsFocusVisible] = useState(false);
    const isDisabled = Boolean(disabled);

    return (
      <Pressable
        {...props}
        {...uiAuditProps({ uiTouch: '44' })}
        ref={ref}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, expanded, selected }}
        aria-expanded={expanded}
        disabled={isDisabled}
        hitSlop={4}
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
          {
            backgroundColor:
              pressed || selected || expanded
                ? theme.colors.primarySoft
                : variant === 'plain'
                  ? 'transparent'
                  : theme.colors.surfaceMuted,
            borderColor:
              isFocused && focusAppearance === 'border' ? theme.colors.text : 'transparent',
            borderWidth: focusAppearance === 'ring' || isFocused ? 2 : 1,
            opacity: isDisabled ? 0.45 : 1,
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
        {children}
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: sizes.touchTarget,
    justifyContent: 'center',
    width: sizes.touchTarget,
  },
});
