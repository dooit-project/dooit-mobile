import { Tabs } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  PlannerDrawer,
  PlannerHeader,
  TabBarButton,
  TabBarIcon,
  TabBarLabel,
} from '@/components/navigation';
import { sizes, spacing, typography, useAppTheme } from '@/theme';

export default function TabLayout() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const labelExtraHeight = Math.ceil(typography.lineHeight.label * Math.max(0, fontScale - 1));
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<ComponentRef<typeof Pressable>>(null);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    requestAnimationFrame(() => {
      const target = menuTriggerRef.current;
      if (!target) return;
      if (Platform.OS === 'web') {
        (target as unknown as { focus?: () => void }).focus?.();
        return;
      }

      const reactTag = findNodeHandle(target);
      if (reactTag) AccessibilityInfo.setAccessibilityFocus(reactTag);
    });
  }, []);

  return (
    <View style={styles.container}>
      <PlannerHeader ref={menuTriggerRef} onMenuPress={() => setMenuOpen(true)} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarActiveBackgroundColor: 'transparent',
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarHideOnKeyboard: true,
          tabBarLabelPosition: 'below-icon',
          tabBarButton: (props) => <TabBarButton {...props} />,
          tabBarIconStyle: { height: sizes.navigationIcon },
          tabBarItemStyle: {
            marginHorizontal: spacing[1],
          },
          tabBarStyle: {
            alignSelf: 'center',
            maxWidth: sizes.contentMaxWidth,
            width: '100%',
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            // Custom height replaces the navigator default, including its safe-area height.
            height: sizes.bottomTabHeight + labelExtraHeight + insets.bottom,
            paddingBottom: spacing[4] + insets.bottom,
            paddingTop: spacing[1],
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
                  ios: 'sun.max',
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
            tabBarAccessibilityLabel: '달력',
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
          name="plan"
          options={{
            title: '계획',
            tabBarAccessibilityLabel: '계획',
            tabBarLabel: ({ focused }) => <TabBarLabel focused={focused} label="계획" />,
            tabBarIcon: ({ color, focused, size }) => (
              <TabBarIcon
                color={color}
                focused={focused}
                size={size}
                name={{
                  ios: 'list.bullet',
                  android: 'format_list_bulleted',
                  web: 'format-list-bulleted',
                }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="review"
          options={{
            title: '돌아보기',
            tabBarAccessibilityLabel: '돌아보기',
            tabBarLabel: ({ focused }) => <TabBarLabel focused={focused} label="돌아보기" />,
            tabBarIcon: ({ color, focused, size }) => (
              <TabBarIcon
                color={color}
                focused={focused}
                size={size}
                name={{ ios: 'clock', android: 'schedule', web: 'history' }}
              />
            ),
          }}
        />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
      <PlannerDrawer visible={menuOpen} onClose={closeMenu} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
