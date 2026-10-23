import type { TextProps, TextStyle } from 'react-native';
import { StyleSheet, Text } from 'react-native';

import { typography, useAppTheme } from '@/theme';

type TextVariant =
  | 'display'
  | 'title'
  | 'sectionTitle'
  | 'bodyLarge'
  | 'body'
  | 'label'
  | 'caption';
type TextTone = 'default' | 'secondary' | 'muted' | 'primary' | 'success' | 'warning' | 'danger';
type TextWeight = keyof typeof typography.weight;

type AppTextProps = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  weight?: TextWeight;
  align?: TextStyle['textAlign'];
};

const variantStyles = StyleSheet.create({
  display: {
    fontSize: typography.size.display,
    lineHeight: typography.lineHeight.display,
    letterSpacing: typography.letterSpacing.tight,
  },
  title: {
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
    letterSpacing: typography.letterSpacing.tight,
  },
  sectionTitle: {
    fontSize: typography.size.sectionTitle,
    lineHeight: typography.lineHeight.sectionTitle,
  },
  bodyLarge: {
    fontSize: typography.size.bodyLarge,
    lineHeight: typography.lineHeight.bodyLarge,
  },
  body: {
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
  },
  label: {
    fontSize: typography.size.label,
    lineHeight: typography.lineHeight.label,
  },
  caption: {
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
  },
});

export function AppText({
  variant = 'body',
  tone = 'default',
  weight = 'regular',
  align,
  style,
  ...props
}: AppTextProps) {
  const theme = useAppTheme();
  const toneColors = {
    default: theme.colors.text,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    primary: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
  };

  return (
    <Text
      {...props}
      style={[
        variantStyles[variant],
        {
          color: toneColors[tone],
          fontWeight: typography.weight[weight],
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
