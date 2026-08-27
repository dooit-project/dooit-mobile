import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import type { PressableProps, ViewStyle } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';

import { radii, sizes, useAppTheme } from '@/theme';

type IconButtonProps = Omit<PressableProps, 'accessibilityLabel' | 'children' | 'style'> & {
  accessibilityLabel: string;
  children: ReactNode;
  selected?: boolean;
  expanded?: boolean;
  style?: ViewStyle;
};

export const IconButton = forwardRef<ComponentRef<typeof Pressable>, IconButtonProps>(
  function IconButton(
    {
      accessibilityLabel,
      children,
      selected = false,
      expanded,
      disabled,
      onBlur,
      onFocus,
      style,
      ...props
    },
    ref,
  ) {
    const theme = useAppTheme();
    const [isFocused, setIsFocused] = useState(false);
    const isDisabled = Boolean(disabled);

    return (
      <Pressable
        {...props}
        ref={ref}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, expanded, selected }}
        disabled={isDisabled}
        hitSlop={4}
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
          {
            backgroundColor:
              pressed || selected || expanded
                ? theme.colors.primarySoft
                : theme.colors.surfaceMuted,
            borderColor: isFocused ? theme.colors.text : 'transparent',
            borderWidth: isFocused ? 2 : 1,
            opacity: isDisabled ? 0.45 : 1,
          },
          style,
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
