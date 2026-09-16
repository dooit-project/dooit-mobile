import type { ComponentProps, PropsWithChildren } from 'react';
import type { ScrollViewProps, StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sizes, spacing, useAppTheme, useMobileLayout } from '@/theme';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  contentMaxWidth?: number;
  safeAreaEdges?: ComponentProps<typeof SafeAreaView>['edges'];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollViewProps?: Omit<ScrollViewProps, 'contentContainerStyle'>;
}>;

export function Screen({
  children,
  scroll = false,
  contentMaxWidth = sizes.contentMaxWidth,
  safeAreaEdges,
  style,
  contentContainerStyle,
  scrollViewProps,
}: ScreenProps) {
  const theme = useAppTheme();
  const { screenPadding } = useMobileLayout();
  const responsiveContentStyle = { maxWidth: contentMaxWidth, paddingHorizontal: screenPadding };

  if (scroll) {
    return (
      <SafeAreaView
        edges={safeAreaEdges}
        style={[styles.safeArea, { backgroundColor: theme.colors.background }, style]}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          {...scrollViewProps}
          contentContainerStyle={styles.scrollContent}
        >
          <View
            style={[
              styles.content,
              styles.scrollContentInset,
              responsiveContentStyle,
              contentContainerStyle,
            ]}
          >
            {children}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={safeAreaEdges}
      style={[styles.safeArea, { backgroundColor: theme.colors.background }, style]}
    >
      <View style={[styles.content, styles.flex, responsiveContentStyle, contentContainerStyle]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentInset: {
    paddingBottom: spacing[8],
  },
});
