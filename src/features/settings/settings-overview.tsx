import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  IconButton,
  InlineNotice,
  PageHeader,
  Screen,
} from '@/components/ui';
import { env } from '@/config';
import { NotificationSettingsCard } from '@/features/notifications';
import { getAccessToken, subscribeAccessToken } from '@/services/api';
import { resetFeatureTips } from '@/services/preferences';
import { radii, spacing, useAppTheme } from '@/theme';

type SettingsRowProps = {
  label: string;
  value: string;
  tone?: 'default' | 'secondary' | 'warning' | 'success';
};

export function SettingsOverview() {
  const router = useRouter();
  const theme = useAppTheme();
  const [accessToken, setAccessToken] = useState(() => getAccessToken());
  const [guideResetStatus, setGuideResetStatus] = useState<
    'idle' | 'pending' | 'success' | 'error'
  >('idle');
  const apiModeLabel = env.apiMode === 'real' ? 'real' : 'mock';
  const apiModeTone = env.apiMode === 'real' ? 'success' : 'warning';
  const connectionDescription =
    env.apiMode === 'real'
      ? '실제 백엔드와 연결해 데이터를 확인합니다.'
      : '백엔드 없이 더미 데이터로 화면을 확인합니다.';
  const hasAccessToken = Boolean(accessToken);

  useEffect(() => subscribeAccessToken(setAccessToken), []);

  return (
    <Screen contentContainerStyle={styles.screen}>
      <PageHeader
        title="설정"
        leading={
          <IconButton accessibilityLabel="프로필 화면으로 돌아가기" onPress={router.back}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={20}
              tintColor={theme.colors.text}
            />
          </IconButton>
        }
      />

      <Card variant="outlined" style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.icon, { backgroundColor: theme.colors.highlightBlue }]}>
            <SymbolView
              name={{ ios: 'network', android: 'settings_ethernet', web: 'settings_ethernet' }}
              size={18}
              tintColor={theme.colors.primary}
            />
          </View>
          <View style={styles.sectionCopy}>
            <AppText variant="bodyLarge" weight="bold">
              API 연결
            </AppText>
            <AppText tone="secondary" variant="caption">
              {connectionDescription}
            </AppText>
          </View>
        </View>

        <View style={styles.rows}>
          <SettingsRow label="모드" tone={apiModeTone} value={apiModeLabel} />
          <SettingsRow
            label="API URL"
            tone={env.apiMode === 'real' ? 'default' : 'secondary'}
            value={env.apiMode === 'real' ? (env.apiUrl ?? '미설정') : 'mock에서는 사용 안 함'}
          />
          <SettingsRow label="Access Token" value={hasAccessToken ? '저장됨' : '없음'} />
        </View>
      </Card>

      <NotificationSettingsCard />

      <Card variant="outlined" style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.icon, { backgroundColor: theme.colors.primarySoft }]}>
            <SymbolView
              name={{ ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' }}
              size={18}
              tintColor={theme.colors.primary}
            />
          </View>
          <View style={styles.sectionCopy}>
            <AppText variant="bodyLarge" weight="bold">
              앱 사용 가이드
            </AppText>
            <AppText tone="secondary" variant="caption">
              Today, Calendar, D-Day 화면의 짧은 안내를 다시 표시합니다.
            </AppText>
          </View>
        </View>

        {guideResetStatus === 'success' ? (
          <InlineNotice
            message="각 화면을 다시 열면 사용 가이드가 표시됩니다."
            title="가이드를 다시 볼 수 있어요"
            tone="success"
          />
        ) : null}
        {guideResetStatus === 'error' ? (
          <InlineNotice
            message="가이드 상태를 초기화하지 못했어요. 다시 시도해 주세요."
            tone="danger"
          />
        ) : null}

        <Button
          fullWidth
          loading={guideResetStatus === 'pending'}
          onPress={() => {
            setGuideResetStatus('pending');
            void resetFeatureTips()
              .then(() => setGuideResetStatus('success'))
              .catch(() => setGuideResetStatus('error'));
          }}
          variant="secondary"
        >
          앱 사용 가이드 다시 보기
        </Button>
      </Card>
    </Screen>
  );
}

function SettingsRow({ label, value, tone = 'default' }: SettingsRowProps) {
  return (
    <View style={styles.row}>
      <AppText tone="secondary" variant="caption">
        {label}
      </AppText>
      <AppText align="right" numberOfLines={2} tone={tone} weight="medium" style={styles.value}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing[5],
    paddingTop: spacing[3],
  },
  section: {
    gap: spacing[4],
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
  },
  icon: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sectionCopy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
  },
  rows: {
    gap: spacing[2],
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'space-between',
    minHeight: 36,
  },
  value: {
    flex: 1,
  },
});
