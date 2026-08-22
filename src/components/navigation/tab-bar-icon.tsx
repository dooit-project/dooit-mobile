import type { SymbolViewProps } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { Platform, StyleSheet, View } from 'react-native';
import type { ColorValue } from 'react-native';

import { radii, spacing, useAppTheme } from '@/theme';

type TabBarIconProps = {
  color: ColorValue;
  focused?: boolean;
  name: SymbolViewProps['name'];
  size: number;
};

export function TabBarIcon({ color, focused = false, name, size }: TabBarIconProps) {
  const theme = useAppTheme();
  const webName = typeof name === 'object' && name ? name.web : undefined;

  return (
    <View style={[styles.container, focused && { backgroundColor: theme.colors.primarySoft }]}>
      {Platform.OS === 'web' ? (
        <WebTabIcon color={color} name={webName} size={size} />
      ) : (
        <SymbolView
          name={name}
          size={size}
          tintColor={color}
          type="hierarchical"
          weight="semibold"
        />
      )}
      {focused ? (
        <View style={[styles.indicator, { backgroundColor: theme.colors.primary }]} />
      ) : null}
    </View>
  );
}

type WebTabIconProps = {
  color: ColorValue;
  name?: string;
  size: number;
};

function WebTabIcon({ color, name, size }: WebTabIconProps) {
  if (name === 'today') {
    return (
      <View accessible={false} style={[styles.webTodayIcon, { height: size, width: size }]}>
        <View style={[styles.webTodaySun, { borderColor: color }]} />
        <View style={[styles.webTodayRayTop, { backgroundColor: color }]} />
        <View style={[styles.webTodayRayRight, { backgroundColor: color }]} />
        <View style={[styles.webTodayRayBottom, { backgroundColor: color }]} />
        <View style={[styles.webTodayRayLeft, { backgroundColor: color }]} />
      </View>
    );
  }

  if (name === 'more_horiz') {
    return (
      <View accessible={false} style={[styles.webMoreIcon, { height: size, width: size }]}>
        <View style={[styles.webMoreDot, { backgroundColor: color }]} />
        <View style={[styles.webMoreDot, { backgroundColor: color }]} />
        <View style={[styles.webMoreDot, { backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View
      accessible={false}
      style={[styles.webCalendarIcon, { borderColor: color, height: size, width: size }]}
    >
      <View style={[styles.webCalendarBar, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: radii.full,
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 44,
    paddingHorizontal: spacing[2],
    position: 'relative',
  },
  indicator: {
    borderRadius: radii.full,
    bottom: -3,
    height: 2,
    position: 'absolute',
    width: 18,
  },
  webCalendarIcon: {
    borderRadius: radii.sm,
    borderWidth: 2,
    overflow: 'hidden',
  },
  webCalendarBar: {
    height: 4,
    width: '100%',
  },
  webTodayIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  webTodaySun: {
    borderRadius: radii.full,
    borderWidth: 2,
    height: 11,
    width: 11,
  },
  webTodayRayTop: {
    borderRadius: radii.full,
    height: 4,
    left: '50%',
    marginLeft: -1,
    position: 'absolute',
    top: 1,
    width: 2,
  },
  webTodayRayRight: {
    borderRadius: radii.full,
    height: 2,
    position: 'absolute',
    right: 1,
    top: '50%',
    marginTop: -1,
    width: 4,
  },
  webTodayRayBottom: {
    borderRadius: radii.full,
    bottom: 1,
    height: 4,
    left: '50%',
    marginLeft: -1,
    position: 'absolute',
    width: 2,
  },
  webTodayRayLeft: {
    borderRadius: radii.full,
    height: 2,
    left: 1,
    marginTop: -1,
    position: 'absolute',
    top: '50%',
    width: 4,
  },
  webMoreIcon: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
  },
  webMoreDot: {
    borderRadius: radii.full,
    height: 4,
    width: 4,
  },
});
