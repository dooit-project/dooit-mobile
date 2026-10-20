import { PlatformPressable } from 'expo-router/react-navigation';
import type { BottomTabBarButtonProps } from 'expo-router/js-tabs';
import { StyleSheet } from 'react-native';

/** Keep the navigator's link, selected state and native press handling intact. */
export function TabBarButton({ style, ...props }: BottomTabBarButtonProps) {
  return <PlatformPressable {...props} style={[style, styles.button]} />;
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
    borderCurve: 'continuous',
    justifyContent: 'center',
  },
});
