import { Tabs } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { PlannerDrawer, PlannerHeader, TabBarIcon, TabBarLabel } from '@/components/navigation';
import { sizes, spacing, useAppTheme } from '@/theme';

export default function TabLayout() {
  const theme = useAppTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.container}>
      <PlannerHeader onMenuPress={() => setMenuOpen(true)} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primaryPressed,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            height: Platform.OS === 'web' ? sizes.bottomTabHeight : undefined,
            paddingBottom: Platform.OS === 'web' ? spacing[1] : undefined,
            paddingTop: Platform.OS === 'web' ? spacing[1] : undefined,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '오늘',
            tabBarAccessibilityLabel: '오늘',
            tabBarLabel: ({ focused }) => <TabBarLabel focused={focused} label="오늘" />,
            tabBarIcon: ({ color, focused, size }) => (
              <TabBarIcon
                color={color}
                focused={focused}
                size={size}
                name={{
                  ios: focused ? 'sun.max.fill' : 'sun.max',
                  android: 'wb_sunny',
                  web: 'today',
                }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: '달력',
            tabBarAccessibilityLabel: '캘린더',
            tabBarLabel: ({ focused }) => <TabBarLabel focused={focused} label="달력" />,
            tabBarIcon: ({ color, focused, size }) => (
              <TabBarIcon
                color={color}
                focused={focused}
                size={size}
                name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '더보기',
            tabBarAccessibilityLabel: '더보기',
            tabBarLabel: ({ focused }) => <TabBarLabel focused={focused} label="더보기" />,
            tabBarIcon: ({ color, focused, size }) => (
              <TabBarIcon
                color={color}
                focused={focused}
                size={size}
                name={{ ios: 'ellipsis.circle', android: 'more_horiz', web: 'more_horiz' }}
              />
            ),
          }}
        />
      </Tabs>
      <PlannerDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
