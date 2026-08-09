import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import type { SymbolViewProps } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import type { ColorValue } from 'react-native';

import { AppText, Button, InlineNotice, Screen } from '@/components/ui';
import { useAuthState } from '@/features/auth';
import { authApi } from '@/services/api';
import { radii, spacing, useAppTheme } from '@/theme';

import { getProfileAuthPresentation } from './profile-auth-presentation';

type ProfileItem = {
  accent: 'amber' | 'sage' | 'blue';
  title: string;
  description: string;
  href: '/dday' | '/search' | '/completed' | '/settings';
  icon: SymbolViewProps['name'];
  webIcon: 'flag' | 'search' | 'task_alt' | 'settings';
};

const profileItems: ProfileItem[] = [
  {
    accent: 'amber',
    title: '목표',
    description: 'D-Day와 연결된 실행 항목',
    href: '/dday',
    icon: { ios: 'flag.fill', android: 'flag', web: 'flag' },
    webIcon: 'flag',
  },
  {
    accent: 'blue',
    title: '검색',
    description: '과거 Task와 일정 찾기',
    href: '/search',
    icon: { ios: 'magnifyingglass', android: 'search', web: 'search' },
    webIcon: 'search',
  },
  {
    accent: 'sage',
    title: '완료 기록',
    description: '끝낸 일과 주간 흐름',
    href: '/completed',
    icon: { ios: 'checkmark.circle.fill', android: 'task_alt', web: 'task_alt' },
    webIcon: 'task_alt',
  },
  {
    accent: 'blue',
    title: '설정',
    description: '테마, 알림, 개인 설정',
    href: '/settings',
    icon: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
    webIcon: 'settings',
  },
];

export function ProfileOverview() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const theme = useAppTheme();
  const [focusedItem, setFocusedItem] = useState<ProfileItem['href'] | null>(null);
  const [logoutWarning, setLogoutWarning] = useState(false);
  const authState = useAuthState();
  const isRegistered = authState.status === 'registered';
  const authPresentation = getProfileAuthPresentation(authState);

  const logout = useMutation({
    mutationFn: () => authApi.logoutToGuest(),
    onMutate: () => {
      setLogoutWarning(false);
    },
    onError: () => {
      queryClient.clear();
      setLogoutWarning(true);
    },
    onSuccess: (session) => {
      queryClient.clear();
      queryClient.setQueryData(['auth', 'me'], session.user);
    },
  });

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <View
        style={[
          styles.identityCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.highlightSage }]}>
            <AppText variant="bodyLarge" weight="bold">
              나
            </AppText>
          </View>
          <View style={styles.identityCopy}>
            <AppText tone="primary" variant="caption" weight="bold">
              나의 플래너 공간
            </AppText>
            <AppText numberOfLines={1} variant="bodyLarge" weight="bold">
              {authPresentation.title}
            </AppText>
            <AppText numberOfLines={2} tone="secondary" variant="caption">
              {authPresentation.description}
            </AppText>
          </View>
        </View>
        <Button
          loading={logout.isPending}
          onPress={isRegistered ? () => logout.mutate() : () => router.push('/login' as Href)}
          size="compact"
          variant={isRegistered ? 'ghost' : 'secondary'}
        >
          {authPresentation.actionLabel}
        </Button>
      </View>

      {authPresentation.showGuestRecoveryWarning ? (
        <InlineNotice
          tone="warning"
          title="임시 계정으로 사용하고 있어요"
          message="로그인하기 전에 앱을 삭제하거나 앱 데이터를 지우면 현재 내용을 복구할 수 없어요."
        />
      ) : null}

      {logoutWarning ? (
        <InlineNotice
          tone="warning"
          message="로그아웃은 완료했지만 새 게스트 계정을 시작하지 못했어요. 네트워크를 확인한 뒤 로그인하거나 앱을 다시 열어 주세요."
        />
      ) : null}

      <View accessibilityRole="list" style={styles.menu}>
        {profileItems.map((item) => {
          const accents = {
            amber: {
              backgroundColor: theme.colors.highlightAmber,
              color: theme.colors.warning,
            },
            sage: {
              backgroundColor: theme.colors.highlightSage,
              color: theme.colors.success,
            },
            blue: {
              backgroundColor: theme.colors.highlightBlue,
              color: theme.colors.primary,
            },
          };
          const accent = accents[item.accent];

          return (
            <Pressable
              key={item.href}
              accessibilityHint={`${item.title} 화면으로 이동합니다.`}
              accessibilityLabel={`${item.title}, ${item.description}`}
              accessibilityRole="button"
              onBlur={() => setFocusedItem(null)}
              onFocus={() => setFocusedItem(item.href)}
              onPress={() => router.push(item.href as Href)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surface,
                  borderColor:
                    focusedItem === item.href ? theme.colors.primarySoft : theme.colors.border,
                },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: accent.backgroundColor }]}>
                {Platform.OS === 'web' ? (
                  <WebShortcutIcon color={accent.color} name={item.webIcon} />
                ) : (
                  <SymbolView name={item.icon} size={18} tintColor={accent.color} />
                )}
              </View>
              <View style={styles.copy}>
                <AppText weight="medium">{item.title}</AppText>
                <AppText numberOfLines={1} tone="secondary" variant="caption">
                  {item.description}
                </AppText>
              </View>
              <AppText tone="muted" variant="bodyLarge">
                ›
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

function WebShortcutIcon({ color, name }: { color: ColorValue; name: ProfileItem['webIcon'] }) {
  if (name === 'flag') {
    return (
      <View accessible={false} style={styles.webShortcutIcon}>
        <View style={[styles.webFlagPole, { backgroundColor: color }]} />
        <View style={[styles.webFlagBody, { borderColor: color }]} />
      </View>
    );
  }

  if (name === 'search') {
    return (
      <View accessible={false} style={styles.webShortcutIcon}>
        <View style={[styles.webSearchCircle, { borderColor: color }]} />
        <View style={[styles.webSearchHandle, { backgroundColor: color }]} />
      </View>
    );
  }

  if (name === 'task_alt') {
    return (
      <View accessible={false} style={styles.webShortcutIcon}>
        <View style={[styles.webDoneCircle, { borderColor: color }]} />
        <View style={[styles.webDoneCheckShort, { backgroundColor: color }]} />
        <View style={[styles.webDoneCheckLong, { backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View accessible={false} style={styles.webShortcutIcon}>
      <View style={[styles.webSliderLineTop, { backgroundColor: color }]} />
      <View style={[styles.webSliderLineBottom, { backgroundColor: color }]} />
      <View style={[styles.webSliderKnobTop, { borderColor: color }]} />
      <View style={[styles.webSliderKnobBottom, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing[5],
    paddingBottom: 104,
    paddingTop: spacing[8],
  },
  identityCard: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  identity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing[3],
    minWidth: 0,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  identityCopy: {
    flex: 1,
    gap: spacing[1],
  },
  menu: {
    backgroundColor: 'transparent',
    gap: spacing[3],
  },
  row: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing[4],
    minHeight: 68,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  icon: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  webShortcutIcon: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    position: 'relative',
    width: 20,
  },
  webFlagBody: {
    borderBottomRightRadius: 3,
    borderTopRightRadius: 5,
    borderWidth: 2,
    height: 10,
    left: 8,
    position: 'absolute',
    top: 3,
    width: 9,
  },
  webFlagPole: {
    borderRadius: radii.full,
    height: 16,
    left: 4,
    position: 'absolute',
    top: 2,
    width: 2,
  },
  webSearchCircle: {
    borderRadius: radii.full,
    borderWidth: 2,
    height: 12,
    left: 2,
    position: 'absolute',
    top: 2,
    width: 12,
  },
  webSearchHandle: {
    borderRadius: radii.full,
    height: 2,
    position: 'absolute',
    right: 3,
    top: 14,
    transform: [{ rotate: '45deg' }],
    width: 7,
  },
  webDoneCircle: {
    borderRadius: radii.full,
    borderWidth: 2,
    height: 17,
    position: 'absolute',
    width: 17,
  },
  webDoneCheckShort: {
    borderRadius: radii.full,
    height: 2,
    left: 5,
    position: 'absolute',
    top: 10,
    transform: [{ rotate: '45deg' }],
    width: 5,
  },
  webDoneCheckLong: {
    borderRadius: radii.full,
    height: 2,
    left: 8,
    position: 'absolute',
    top: 8,
    transform: [{ rotate: '-45deg' }],
    width: 8,
  },
  webSliderKnobBottom: {
    backgroundColor: 'transparent',
    borderRadius: radii.full,
    borderWidth: 2,
    height: 7,
    left: 4,
    position: 'absolute',
    top: 11,
    width: 7,
  },
  webSliderKnobTop: {
    backgroundColor: 'transparent',
    borderRadius: radii.full,
    borderWidth: 2,
    height: 7,
    position: 'absolute',
    right: 4,
    top: 2,
    width: 7,
  },
  webSliderLineBottom: {
    borderRadius: radii.full,
    height: 2,
    position: 'absolute',
    top: 14,
    width: 16,
  },
  webSliderLineTop: {
    borderRadius: radii.full,
    height: 2,
    position: 'absolute',
    top: 5,
    width: 16,
  },
  copy: {
    flex: 1,
    gap: spacing[1],
  },
});
