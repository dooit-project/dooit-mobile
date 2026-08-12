import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
  const [showFeatureTour, setShowFeatureTour] = useState(false);

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
            오늘 할 일부터 시작해요
          </AppText>
          <AppText tone="secondary" variant="body">
            할 일과 일정을 계획하고 완료 흐름을 기록해요.
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
            게스트로 시작하고 나중에 만든 내용을 계정에 연결할 수 있어요.
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
          계정이 있거나 데이터를 동기화하고 싶나요?
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

      <View style={styles.featureTour}>
        <Button
          accessibilityState={{ expanded: showFeatureTour }}
          disabled={isStartingGuest}
          onPress={() => setShowFeatureTour((current) => !current)}
          variant="ghost"
        >
          {showFeatureTour ? '기능 둘러보기 닫기' : '기능 둘러보기'}
        </Button>
        {showFeatureTour ? (
          <View accessibilityLabel="ToDoLab 주요 기능" style={styles.featureList}>
            <FeatureSummary
              description="오늘 일정과 할 일을 확인하고 빠르게 기록해요."
              title="Today"
            />
            <FeatureSummary
              description="날짜별 일정과 반복 계획을 달력에서 살펴봐요."
              title="Calendar"
            />
            <FeatureSummary description="중요한 날짜와 필요한 할 일을 연결해요." title="D-Day" />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function FeatureSummary({ title, description }: { title: string; description: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.featureSummary,
        { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
      ]}
    >
      <AppText variant="label" weight="bold">
        {title}
      </AppText>
      <AppText tone="secondary" variant="body">
        {description}
      </AppText>
    </View>
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
  featureTour: {
    alignItems: 'center',
    gap: spacing[2],
  },
  featureList: {
    gap: spacing[2],
    width: '100%',
  },
  featureSummary: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[1],
    padding: spacing[3],
  },
});
