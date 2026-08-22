import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { radii, spacing, useAppTheme } from '@/theme';

import { AppText } from './app-text';

type InlineNoticeTone = 'default' | 'success' | 'warning' | 'danger';

type InlineNoticeProps = {
  message: string;
  title?: string;
  tone?: InlineNoticeTone;
  action?: ReactNode;
  actionPosition?: 'inline' | 'bottom';
};

export function InlineNotice({
  message,
  title,
  tone = 'default',
  action,
  actionPosition = 'inline',
}: InlineNoticeProps) {
  const theme = useAppTheme();
  const appearances = {
    default: {
      backgroundColor: theme.colors.highlightBlue,
      borderColor: theme.colors.border,
      textTone: 'default' as const,
    },
    success: {
      backgroundColor: theme.colors.successSoft,
      borderColor: theme.colors.success,
      textTone: 'success' as const,
    },
    warning: {
      backgroundColor: theme.colors.warningSoft,
      borderColor: theme.colors.warning,
      textTone: 'warning' as const,
    },
    danger: {
      backgroundColor: theme.colors.dangerSoft,
      borderColor: theme.colors.danger,
      textTone: 'danger' as const,
    },
  };
  const appearance = appearances[tone];
  const accessibilityRole = tone === 'danger' || tone === 'warning' ? 'alert' : undefined;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={accessibilityRole}
      style={[
        styles.container,
        actionPosition === 'bottom' && styles.containerStacked,
        {
          backgroundColor: appearance.backgroundColor,
          borderColor: appearance.borderColor,
        },
      ]}
    >
      <View style={styles.copy}>
        {title ? (
          <AppText tone={appearance.textTone} variant="label" weight="bold">
            {title}
          </AppText>
        ) : null}
        <AppText tone={title ? 'secondary' : appearance.textTone} variant="caption">
          {message}
        </AppText>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing[2],
    minHeight: 44,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  copy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
  },
  containerStacked: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
});
