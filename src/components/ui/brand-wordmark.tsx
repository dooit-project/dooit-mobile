import type { StyleProp, TextStyle } from 'react-native';
import { StyleSheet } from 'react-native';

import { useAppTheme } from '@/theme';

import { AppText } from './app-text';

/** Shared typography for the existing dooit wordmark. */
export function BrandWordmark({ style }: { style?: StyleProp<TextStyle> }) {
  const theme = useAppTheme();

  return (
    <AppText weight="heavy" style={[styles.wordmark, { color: theme.colors.brand }, style]}>
      dooit
    </AppText>
  );
}

const styles = StyleSheet.create({
  wordmark: { fontSize: 26, lineHeight: 32, letterSpacing: -0.8, flexShrink: 0 },
});
