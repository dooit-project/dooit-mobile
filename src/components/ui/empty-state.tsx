import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './app-text';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
};

export function EmptyState({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon}
      <View style={styles.copy}>
        <AppText align="center" variant="label" weight="bold">
          {title}
        </AppText>
        {description ? (
          <AppText align="center" tone="secondary" variant="caption">
            {description}
          </AppText>
        ) : null}
      </View>
      {primaryAction || secondaryAction ? (
        <View style={styles.actions}>
          {primaryAction}
          {secondaryAction}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing[3],
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[5],
  },
  copy: {
    alignItems: 'center',
    gap: spacing[2],
    maxWidth: 320,
  },
  actions: {
    alignItems: 'center',
    gap: spacing[1],
  },
});
