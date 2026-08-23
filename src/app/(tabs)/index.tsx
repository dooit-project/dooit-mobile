import { useLocalSearchParams, useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';

import { InlineNotice, Screen } from '@/components/ui';
import { getGuestMergeNoticeMessage } from '@/features/auth';
import { QuickCapture, TodayOverview, TodayWeekStrip, useTodayOverview } from '@/features/today';
import { spacing, useAppTheme } from '@/theme';
import { toApiLocalDate } from '@/utils';

export default function TodayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    linked?: string;
    linkedTasks?: string;
    linkedSchedules?: string;
    linkedDdayGoals?: string;
    linkedRecurrenceSeries?: string;
  }>();
  const theme = useAppTheme();
  const now = new Date();
  const today = toApiLocalDate(now);
  const overview = useTodayOverview(today);
  const [isQuickCaptureExpanded, setIsQuickCaptureExpanded] = useState(false);
  const [recentCapturedTaskId, setRecentCapturedTaskId] = useState<number | null>(null);
  const [linkedNoticeMessage] = useState(() =>
    params.linked === '1' ? getGuestMergeNoticeMessage(params) : null,
  );

  useEffect(() => {
    if (params.linked === '1') {
      router.setParams({
        linked: '',
        linkedTasks: '',
        linkedSchedules: '',
        linkedDdayGoals: '',
        linkedRecurrenceSeries: '',
      });
    }
  }, [params.linked, router]);

  return (
    <View style={styles.container}>
      <Screen
        scroll
        contentContainerStyle={styles.screen}
        scrollViewProps={{
          keyboardShouldPersistTaps: 'handled',
          refreshControl: (
            <RefreshControl
              colors={[theme.colors.primary]}
              progressBackgroundColor={theme.colors.surface}
              refreshing={!overview.isPending && overview.isRefreshing}
              tintColor={theme.colors.primary}
              onRefresh={() => void overview.refetch()}
            />
          ),
        }}
      >
        {linkedNoticeMessage ? (
          <InlineNotice tone="success" title="계정 연결 완료" message={linkedNoticeMessage} />
        ) : null}
        <TodayWeekStrip today={today} />
        <TodayOverview
          date={today}
          overview={overview}
          recentCapturedTaskId={recentCapturedTaskId}
          onOpenQuickCapture={() => setIsQuickCaptureExpanded(true)}
        />
      </Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.quickCaptureLayer}
      >
        <QuickCapture
          isExpanded={isQuickCaptureExpanded}
          onCaptured={(response) => setRecentCapturedTaskId(response.task.id)}
          onExpandedChange={setIsQuickCaptureExpanded}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    gap: spacing[4],
    paddingBottom: 104,
    paddingTop: spacing[4],
  },
  quickCaptureLayer: {
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
