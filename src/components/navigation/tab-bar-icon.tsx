import { Feather, Ionicons } from '@expo/vector-icons';
import type { SymbolViewProps } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { Platform, StyleSheet, View, type ColorValue } from 'react-native';

import { sizes } from '@/theme';

type PlatformSymbolNames = Exclude<SymbolViewProps['name'], string>;
type TabBarIconProps = {
  color: ColorValue;
  focused?: boolean;
  name:
    | Exclude<SymbolViewProps['name'], PlatformSymbolNames>
    | (Omit<PlatformSymbolNames, 'web'> & { web?: string });
  size: number;
};
const icons = {
  today: 'sun',
  calendar_month: 'calendar',
  'format-list-bulleted': 'list',
  history: 'clock',
} as const;

export function TabBarIcon({ color, name, focused }: TabBarIconProps) {
  const webName = typeof name === 'object' && name ? name.web : undefined;
  return (
    <View style={styles.container} accessible={false}>
      {Platform.OS === 'ios' ? (
        <SymbolView
          name={
            focused && webName === 'today'
              ? { ios: 'sun.max.fill' }
              : typeof name === 'object'
                ? { ios: name.ios, android: name.android }
                : name
          }
          size={sizes.navigationIcon}
          tintColor={color}
          type="monochrome"
          weight="regular"
        />
      ) : focused && webName === 'today' ? (
        <Ionicons color={color as string} name="sunny" size={sizes.navigationIcon} />
      ) : (
        <Feather
          color={color as string}
          name={icons[webName as keyof typeof icons] ?? 'list'}
          size={sizes.navigationIcon}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', minHeight: 24, minWidth: 44 },
});
