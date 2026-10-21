import { PlatformPressable } from 'expo-router/react-navigation';
import type { BottomTabBarButtonProps } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/theme';

/** Keep the navigator's link, selected state and native press handling intact. */
export function TabBarButton({ style, children, ...props }: BottomTabBarButtonProps) {
  const theme = useAppTheme();
  return (
    <PlatformPressable {...props} style={[style, styles.button]}>
      {children}
      {props['aria-selected'] ? (
        <View
          accessible={false}
          style={[styles.indicator, { backgroundColor: theme.colors.primary }]}
        />
      ) : null}
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 0,
    justifyContent: 'center',
  },
  indicator: { position: 'absolute', bottom: 0, alignSelf: 'center', width: 36, height: 3 },
});
