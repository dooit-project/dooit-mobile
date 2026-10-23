import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { AppIcon } from '@/components/ui';
import { sizes } from '@/theme';

type TabBarIconProps = {
  color: ColorValue;
  focused?: boolean;
  name: 'today' | 'calendar' | 'plan' | 'review';
};
const icons = {
  today: 'sun',
  calendar: 'calendar',
  plan: 'list',
  review: 'clock',
} as const;

export function TabBarIcon({ color, name, focused }: TabBarIconProps) {
  return (
    <View style={styles.container} accessible={false}>
      {focused && name === 'today' ? (
        <Ionicons
          allowFontScaling={false}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no"
          aria-hidden
          color={color as string}
          name="sunny"
          size={sizes.navigationIcon}
        />
      ) : (
        <AppIcon color={color as string} name={icons[name]} size="navigation" />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', minHeight: 24, minWidth: 44 },
});
