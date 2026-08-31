import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { usePathname, useRouter } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { radii, sizes, spacing, useAppTheme } from '@/theme';

type DrawerItem = {
  href: Href;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  match?: string;
};

export const plannerDrawerGroups: DrawerItem[][] = [
  [
    { href: '/', icon: 'white-balance-sunny', label: '오늘', match: '/' },
    { href: '/calendar', icon: 'calendar-blank-outline', label: '달력' },
    { href: '/today/review', icon: 'inbox-outline', label: '기록함', match: '/inbox' },
    { href: '/today/review', icon: 'history', label: '오래 미룬 일', match: '/overdue' },
    { href: '/completed', icon: 'checkbox-marked-circle-outline', label: '완료 기록' },
  ],
  [
    { href: '/dday', icon: 'flag-outline', label: '목표' },
    { href: '/workspaces', icon: 'account-multiple-outline', label: '공유 공간' },
  ],
  [
    { href: '/search', icon: 'magnify', label: '검색' },
    { href: '/templates', icon: 'checkbox-multiple-marked-outline', label: 'Task 템플릿' },
    { href: '/settings', icon: 'tune-variant', label: '설정' },
  ],
];

type PlannerHeaderProps = {
  onMenuPress: () => void;
};

export function PlannerHeader({ onMenuPress }: PlannerHeaderProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          paddingTop: insets.top,
        },
      ]}
    >
      <Pressable
        accessibilityHint="전체 탐색 메뉴를 엽니다."
        accessibilityLabel="나의 플래너 메뉴 열기"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onMenuPress}
        style={({ pressed }) => [
          styles.headerButton,
          { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
        ]}
      >
        <MaterialCommunityIcons color={theme.colors.text} name="menu" size={26} />
      </Pressable>
      <AppText weight="bold">dooit</AppText>
    </View>
  );
}

type PlannerDrawerProps = {
  onClose: () => void;
  visible: boolean;
};

export function PlannerDrawer({ onClose, visible }: PlannerDrawerProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  const open = (href: Href) => {
    onClose();
    router.navigate(href);
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View accessibilityViewIsModal style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="메뉴 닫기"
          accessibilityRole="button"
          onPress={onClose}
          style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
        />
        <View
          style={[
            styles.drawer,
            {
              backgroundColor: theme.colors.surface,
              paddingBottom: Math.max(insets.bottom, spacing[4]),
              paddingTop: Math.max(insets.top, spacing[5]),
            },
          ]}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandCopy}>
              <View style={styles.wordmarkRow}>
                <AppText style={{ color: theme.colors.primary }} variant="title" weight="heavy">
                  dooit
                </AppText>
                <View style={[styles.wordmarkDot, { backgroundColor: theme.colors.warning }]} />
              </View>
              <AppText variant="display" weight="heavy">
                나의 플래너
              </AppText>
            </View>
            <Pressable
              accessibilityLabel="나의 플래너 메뉴 닫기"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
              ]}
            >
              <MaterialCommunityIcons color={theme.colors.text} name="close" size={28} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.menuContent}
            showsVerticalScrollIndicator={false}
          >
            {plannerDrawerGroups.map((group, groupIndex) => (
              <View
                key={groupIndex}
                style={[
                  styles.menuGroup,
                  groupIndex > 0 && {
                    borderTopColor: theme.colors.border,
                    borderTopWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                {group.map((item) => {
                  const active = item.match
                    ? item.match === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.match)
                    : pathname.startsWith(String(item.href));

                  return (
                    <Pressable
                      key={`${groupIndex}-${item.label}`}
                      accessibilityHint={`${item.label} 화면으로 이동합니다.`}
                      accessibilityLabel={item.label}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => open(item.href)}
                      style={({ pressed }) => [
                        styles.menuRow,
                        active && { backgroundColor: theme.colors.primarySoft },
                        pressed && { backgroundColor: theme.colors.surfaceMuted },
                      ]}
                    >
                      <View
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor: active
                              ? theme.colors.highlightBlue
                              : theme.colors.surfaceMuted,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          color={active ? theme.colors.primary : theme.colors.textSecondary}
                          name={item.icon}
                          size={24}
                        />
                      </View>
                      <AppText
                        style={styles.menuLabel}
                        variant="bodyLarge"
                        weight={active ? 'bold' : 'medium'}
                      >
                        {item.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  backdrop: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  drawer: {
    borderBottomRightRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    bottom: 0,
    left: 0,
    maxWidth: 380,
    position: 'absolute',
    top: 0,
    width: '86%',
  },
  brandRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[6],
  },
  brandCopy: { flex: 1, gap: spacing[2] },
  wordmarkRow: { alignItems: 'flex-start', flexDirection: 'row' },
  wordmarkDot: { borderRadius: radii.full, height: 6, marginLeft: 2, marginTop: 3, width: 6 },
  closeButton: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: sizes.touchTarget,
    justifyContent: 'center',
    width: sizes.touchTarget,
  },
  menuContent: { paddingBottom: spacing[8], paddingHorizontal: spacing[4], paddingTop: spacing[8] },
  menuGroup: { paddingVertical: spacing[4] },
  menuRow: {
    alignItems: 'center',
    borderRadius: radii.xl,
    flexDirection: 'row',
    gap: spacing[4],
    minHeight: 60,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  menuLabel: { flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing[2],
    minHeight: 56,
    paddingHorizontal: spacing[3],
  },
  headerButton: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: sizes.touchTarget,
    justifyContent: 'center',
    width: sizes.touchTarget,
  },
});
