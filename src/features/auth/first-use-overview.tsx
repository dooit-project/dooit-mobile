import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, InlineNotice, Screen } from '@/components/ui';
import { radii, spacing, useAppTheme } from '@/theme';

type FirstUseOverviewProps = {
  errorMessage?: string | null;
  isStartingGuest: boolean;
  onStartGuest: () => void;
};

export function FirstUseOverview({
  errorMessage,
  isStartingGuest,
  onStartGuest,
}: FirstUseOverviewProps) {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.brandMark, { backgroundColor: theme.colors.primarySoft }]}
        >
          <AppText tone="primary" variant="display" weight="heavy">
            T
          </AppText>
        </View>
        <View style={styles.copy}>
          <AppText accessibilityRole="header" variant="display" weight="heavy">
            오늘 할 일부터{`\n`}가볍게 시작해요
          </AppText>
          <AppText tone="secondary" variant="body">
            Task, 일정, D-Day를 한곳에서 계획하고 완료 흐름을 기록할 수 있어요.
          </AppText>
        </View>
      </View>

      <View
        style={[
          styles.choiceCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.copy}>
          <AppText variant="bodyLarge" weight="bold">
            로그인 없이 시작
          </AppText>
          <AppText tone="secondary" variant="body">
            이 기기에서 게스트로 시작하고, 나중에 로그인하면 지금 만든 내용을 계정에 연결할 수
            있어요.
          </AppText>
        </View>
        <Button fullWidth loading={isStartingGuest} onPress={onStartGuest} size="large">
          로그인 없이 시작
        </Button>
      </View>

      {errorMessage ? (
        <InlineNotice
          tone="danger"
          title="지금은 게스트로 시작할 수 없어요"
          message={errorMessage}
        />
      ) : null}

      <View style={styles.accountAction}>
        <AppText tone="secondary" variant="label">
          이미 계정이 있거나 데이터를 안전하게 동기화하고 싶나요?
        </AppText>
        <Button
          disabled={isStartingGuest}
          fullWidth
          onPress={() => router.push('/login' as Href)}
          size="large"
          variant="secondary"
        >
          로그인 또는 계정 만들기
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing[5],
    justifyContent: 'center',
    paddingBottom: spacing[8],
    paddingTop: spacing[8],
  },
  hero: {
    gap: spacing[4],
  },
  brandMark: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  copy: {
    gap: spacing[2],
  },
  choiceCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing[4],
    padding: spacing[4],
  },
  accountAction: {
    alignItems: 'center',
    gap: spacing[3],
  },
});
