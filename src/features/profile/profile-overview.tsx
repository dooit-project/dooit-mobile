import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, InlineNotice, Screen } from '@/components/ui';
import { getGuestRecoveryMessage, useAuthState } from '@/features/auth';
import { replaceUserQueryCache } from '@/features/auth/auth-query-cache';
import { authApi } from '@/services/api';
import { radii, spacing, useAppTheme } from '@/theme';

import { getProfileAuthPresentation } from './profile-auth-presentation';

export function ProfileOverview() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const theme = useAppTheme();
  const [settingsFocused, setSettingsFocused] = useState(false);
  const [logoutWarning, setLogoutWarning] = useState(false);
  const logoutStarted = useRef(false);
  const authState = useAuthState();
  const isRegistered = authState.status === 'registered';
  const isCheckingAccount = authState.status === 'bootstrapping';
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
    onSuccess: async (session) => {
      await replaceUserQueryCache(queryClient, session.user);
    },
    onSettled: () => {
      logoutStarted.current = false;
    },
  });

  const handleAccountAction = () => {
    if (isCheckingAccount || logout.isPending || logoutStarted.current) return;
    if (isRegistered) {
      logoutStarted.current = true;
      logout.mutate();
    } else {
      router.push('/login');
    }
  };

  return (
    <Screen safeAreaEdges={['left', 'right']} scroll contentContainerStyle={styles.screen}>
      <AppText accessibilityRole="header" tone="secondary" variant="label" weight="semibold">
        계정
      </AppText>

      <View style={styles.account}>
        <View style={styles.identity}>
          <AppText variant="title" weight="bold">
            {logout.isPending ? '계정을 전환하고 있어요' : authPresentation.title}
          </AppText>
          <AppText tone="secondary">
            {logout.isPending ? '잠시만 기다려 주세요.' : authPresentation.description}
          </AppText>
        </View>

        {authPresentation.showGuestRecoveryWarning && !logout.isPending ? (
          <InlineNotice
            tone="warning"
            title="임시 계정으로 사용하고 있어요"
            message={getGuestRecoveryMessage(Platform.OS === 'web')}
            messageVariant="body"
          />
        ) : null}

        {logoutWarning ? (
          <InlineNotice
            tone="warning"
            title="계정 전환을 마치지 못했어요"
            message="네트워크를 확인한 뒤 로그인하거나 앱을 다시 열어 주세요."
            messageVariant="body"
          />
        ) : null}

        <Button
          fullWidth
          size="large"
          labelVariant="bodyLarge"
          accessibilityLabel={
            logout.isPending
              ? '계정 전환 중'
              : isCheckingAccount
                ? '계정 확인 중'
                : authPresentation.actionLabel
          }
          disabled={isCheckingAccount || logout.isPending}
          loading={logout.isPending}
          onPress={handleAccountAction}
          variant={isRegistered ? 'secondary' : 'primary'}
        >
          {isCheckingAccount ? '계정 확인 중' : authPresentation.actionLabel}
        </Button>
      </View>

      <Pressable
        accessibilityLabel="설정, 알림·문구·사용 가이드"
        accessibilityHint="앱 설정 화면으로 이동합니다."
        accessibilityRole="button"
        accessibilityState={{ disabled: logout.isPending }}
        disabled={logout.isPending}
        onBlur={() => setSettingsFocused(false)}
        onFocus={() => setSettingsFocused(true)}
        onPress={() => router.push('/settings')}
        style={({ pressed }) => [
          styles.settings,
          {
            backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent',
            borderColor: settingsFocused ? theme.colors.primary : 'transparent',
            opacity: logout.isPending ? 0.5 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons name="cog-outline" size={22} color={theme.colors.textSecondary} />
        <View style={styles.settingsCopy}>
          <AppText variant="bodyLarge" weight="medium">
            설정
          </AppText>
          <AppText tone="secondary">알림 · 문구 · 사용 가이드</AppText>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing[6],
    paddingTop: spacing[5],
  },
  account: {
    gap: spacing[4],
  },
  identity: {
    gap: spacing[2],
  },
  settings: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: 56,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[3],
  },
  settingsCopy: {
    flex: 1,
    gap: spacing[1],
  },
});
