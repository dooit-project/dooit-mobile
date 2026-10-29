import { forwardRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { radii, sizes, spacing, typography, useAppTheme } from '@/theme';

import { uiAuditProps } from './ui-audit-props';

/** Keeps text and field geometry stable when focus or validation changes. */
export const TextField = forwardRef<
  TextInput,
  TextInputProps & { invalid?: boolean; errorMessage?: string; errorMessageId?: string }
>(function TextField(
  { invalid = false, errorMessage, errorMessageId, onFocus, onBlur, editable, style, ...props },
  ref,
) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  const accent = invalid ? theme.colors.danger : theme.colors.primary;

  return (
    <TextInput
      {...props}
      {...uiAuditProps({ uiTouch: '44' })}
      ref={ref}
      {...(Platform.OS === 'web' && invalid && errorMessageId
        ? { 'aria-describedby': errorMessageId }
        : {})}
      accessibilityHint={invalid && errorMessage ? errorMessage : props.accessibilityHint}
      editable={editable}
      aria-invalid={invalid || undefined}
      placeholderTextColor={props.placeholderTextColor ?? theme.colors.textMuted}
      underlineColorAndroid="transparent"
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[
        styles.input,
        {
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          borderColor: focused || invalid ? accent : theme.colors.border,
          outlineColor: accent,
          outlineWidth: focused ? 1 : 0,
          opacity: editable === false ? 0.5 : 1,
        },
        style,
      ]}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    outlineStyle: 'solid',
    outlineOffset: 0,
  },
});
