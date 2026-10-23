import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { sizes, spacing, typography, useMobileLayout } from '@/theme';

import { AppText } from './app-text';

/** Stable decorative icon slot; the owning row aligns it with its text block. */
export function ItemLeading({ children }: { children: ReactNode }) {
  const { fontScale } = useMobileLayout();
  return (
    <View style={[styles.leading, { height: typography.lineHeight.bodyLarge * fontScale }]}>
      {children}
    </View>
  );
}

/** Shared title/metadata hierarchy for execution and plan items. */
export function ItemCopy({
  title,
  metadata,
  metadataLeading,
  completed = false,
  numberOfLines,
  style,
}: {
  title: string;
  metadata?: string | null;
  metadataLeading?: ReactNode;
  completed?: boolean;
  numberOfLines?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.copy, style]}>
      <AppText
        numberOfLines={numberOfLines}
        variant="bodyLarge"
        tone={completed ? 'muted' : 'default'}
        style={completed && styles.completed}
      >
        {title}
      </AppText>
      {metadata ? (
        <View style={styles.metadata}>
          {metadataLeading}
          <AppText
            numberOfLines={numberOfLines}
            tone="secondary"
            variant="caption"
            style={styles.metadataCopy}
          >
            {metadata}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  leading: { width: sizes.listIcon, alignItems: 'center', justifyContent: 'center' },
  copy: { minWidth: 0, gap: spacing[1] },
  completed: { textDecorationLine: 'line-through' },
  metadata: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  metadataCopy: { flexShrink: 1 },
});
