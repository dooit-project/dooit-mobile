import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { forwardRef, useEffect, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  findNodeHandle,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { useTaskCategories } from '@/features/tasks';
import { radii, sizes, spacing, useAppTheme } from '@/theme';

import {
  getPlannerCategoryNavigationItems,
  type PlannerCategoryValue,
} from './planner-category-navigation';

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
    {
      href: { pathname: '/today/review', params: { focus: 'inbox' } },
      icon: 'inbox-outline',
      label: '기록함',
      match: '/inbox',
    },
    {
      href: { pathname: '/today/review', params: { focus: 'stale' } },
      icon: 'history',
      label: '오래 미룬 일',
      match: '/overdue',
    },
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

export const PlannerHeader = forwardRef<ComponentRef<typeof Pressable>, PlannerHeaderProps>(
  function PlannerHeader({ onMenuPress }, ref) {
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
          ref={ref}
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
  },
);

type PlannerDrawerProps = {
  onClose: () => void;
  visible: boolean;
};

export function PlannerDrawer({ onClose, visible }: PlannerDrawerProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const params = useGlobalSearchParams<{ browse?: string; category?: string }>();
  const closeButtonRef = useRef<ComponentRef<typeof Pressable>>(null);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const categories = useTaskCategories();
  const categorySummaries = categories.data ?? [];
  const categoryItems = getPlannerCategoryNavigationItems(categorySummaries);
  const totalTaskCount = categoryItems[0]?.count ?? 0;
  const categoryBrowseActive = pathname.startsWith('/search') && params.browse === 'categories';
  const selectedCategory = categoryBrowseActive ? (params.category ?? 'ALL') : null;

  useEffect(() => {
    if (!visible) return;

    requestAnimationFrame(() => {
      const target = closeButtonRef.current;
      if (Platform.OS === 'web') {
        (target as unknown as { focus?: () => void })?.focus?.();
        return;
      }

      const reactTag = target ? findNodeHandle(target) : null;
      if (reactTag) AccessibilityInfo.setAccessibilityFocus(reactTag);
    });
  }, [visible]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, visible]);

  const open = (href: Href) => {
    onClose();
    router.navigate(href);
  };

  const openCategory = (category: PlannerCategoryValue) => {
    if (category === null) return;

    open({
      pathname: '/search',
      params: {
        browse: 'categories',
        ...(category === 'ALL' ? {} : { category }),
      },
    });
  };

  const renderItem = (item: DrawerItem, groupIndex: number) => {
    const matchesPath = item.match
      ? item.match === '/'
        ? pathname === '/'
        : pathname.startsWith(item.match)
      : pathname.startsWith(String(item.href));
    const active = item.href === '/search' && categoryBrowseActive ? false : matchesPath;

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
              backgroundColor: active ? theme.colors.highlightBlue : theme.colors.surfaceMuted,
            },
          ]}
        >
          <MaterialCommunityIcons
            color={active ? theme.colors.primary : theme.colors.textSecondary}
            name={item.icon}
            size={24}
          />
        </View>
        <AppText style={styles.menuLabel} variant="bodyLarge" weight={active ? 'bold' : 'medium'}>
          {item.label}
        </AppText>
      </Pressable>
    );
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
              ref={closeButtonRef}
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
            style={styles.menuScroll}
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
                {groupIndex === 0 ? (
                  <>
                    {group.slice(0, 2).map((item) => renderItem(item, groupIndex))}
                    <Pressable
                      accessibilityHint="개인 Task 카테고리 목록을 펼치거나 접습니다."
                      accessibilityLabel="카테고리"
                      accessibilityRole="button"
                      accessibilityState={{ expanded: categoriesExpanded }}
                      onPress={() => setCategoriesExpanded((current) => !current)}
                      style={({ pressed }) => [
                        styles.menuRow,
                        categoryBrowseActive && { backgroundColor: theme.colors.primarySoft },
                        pressed && { backgroundColor: theme.colors.surfaceMuted },
                      ]}
                    >
                      <View
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor: categoryBrowseActive
                              ? theme.colors.highlightBlue
                              : theme.colors.surfaceMuted,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          color={
                            categoryBrowseActive ? theme.colors.primary : theme.colors.textSecondary
                          }
                          name="folder-outline"
                          size={24}
                        />
                      </View>
                      <View style={styles.categoryHeadingCopy}>
                        <AppText
                          variant="bodyLarge"
                          weight={categoryBrowseActive ? 'bold' : 'medium'}
                        >
                          카테고리
                        </AppText>
                        <AppText tone="secondary" variant="caption">
                          {categories.isPending
                            ? '불러오는 중'
                            : categories.error
                              ? '불러오지 못함'
                              : `전체 ${totalTaskCount}`}
                        </AppText>
                      </View>
                      <MaterialCommunityIcons
                        color={theme.colors.textMuted}
                        name={categoriesExpanded ? 'chevron-up' : 'chevron-down'}
                        size={22}
                      />
                    </Pressable>

                    {categoriesExpanded ? (
                      <View
                        accessibilityLabel="개인 Task 카테고리"
                        style={[styles.categoryList, { borderLeftColor: theme.colors.border }]}
                      >
                        {categories.isPending ? (
                          <View style={styles.categoryState}>
                            <ActivityIndicator color={theme.colors.primary} size="small" />
                            <AppText tone="secondary" variant="caption">
                              카테고리를 불러오고 있어요.
                            </AppText>
                          </View>
                        ) : categories.error ? (
                          <Pressable
                            accessibilityLabel="카테고리 다시 불러오기"
                            accessibilityRole="button"
                            onPress={() => void categories.refetch()}
                            style={({ pressed }) => [
                              styles.categoryState,
                              pressed && { backgroundColor: theme.colors.surfaceMuted },
                            ]}
                          >
                            <AppText tone="danger" variant="caption" weight="semibold">
                              다시 시도
                            </AppText>
                          </Pressable>
                        ) : (
                          <>
                            {categoryItems.map((item) => (
                              <CategoryRow
                                key={item.key}
                                active={selectedCategory === item.category}
                                count={item.count}
                                disabled={item.disabled}
                                label={item.label}
                                onPress={() => openCategory(item.category)}
                              />
                            ))}
                          </>
                        )}
                      </View>
                    ) : null}
                    {group.slice(2).map((item) => renderItem(item, groupIndex))}
                  </>
                ) : (
                  group.map((item) => renderItem(item, groupIndex))
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function CategoryRow({
  active,
  count,
  disabled = false,
  label,
  onPress,
}: {
  active: boolean;
  count: number;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityHint={
        disabled
          ? '미분류 Task 탐색은 서버 필터가 준비된 뒤 사용할 수 있습니다.'
          : `${label} 카테고리 Task를 보여줍니다.`
      }
      accessibilityLabel={`${label}, ${count}개`}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryRow,
        active && { backgroundColor: theme.colors.primarySoft },
        pressed && { backgroundColor: theme.colors.surfaceMuted },
        disabled && styles.categoryRowDisabled,
      ]}
    >
      <AppText tone={active ? 'primary' : 'default'} weight={active ? 'bold' : 'medium'}>
        {label}
      </AppText>
      <AppText tone="secondary">{count}</AppText>
    </Pressable>
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
    overflow: 'hidden',
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
  menuScroll: { flex: 1 },
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
  categoryHeadingCopy: { flex: 1, gap: 2 },
  categoryList: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing[2],
    marginLeft: 36,
    paddingLeft: spacing[4],
  },
  categoryRow: {
    alignItems: 'center',
    borderRadius: radii.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing[4],
  },
  categoryRowDisabled: { opacity: 0.58 },
  categoryState: {
    alignItems: 'center',
    borderRadius: radii.lg,
    flexDirection: 'row',
    gap: spacing[2],
    minHeight: 48,
    paddingHorizontal: spacing[4],
  },
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
