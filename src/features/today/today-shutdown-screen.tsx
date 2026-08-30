import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  EmptyState,
  IconButton,
  InlineNotice,
  ListSkeleton,
  PageHeader,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { TaskCard, useChangeTaskDate } from '@/features/tasks';
import { radii, spacing, useAppTheme } from '@/theme';
import type { LocalDateString } from '@/types';
import { shiftLocalDate, toApiLocalDate } from '@/utils';

import { getDailyShutdownTasks } from './today-review-items';
import { useTodayOverview } from './use-today-overview';

type ShutdownDestination = 'tomorrow' | 'inbox';

export function TodayShutdownScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const today = toApiLocalDate();
  const tomorrow = shiftLocalDate(today, 1) ?? today;
  const overview = useTodayOverview(today);
  const changeDate = useChangeTaskDate();
  const [resolvedTaskIds, setResolvedTaskIds] = useState<number[]>([]);
  const [movedTomorrowCount, setMovedTomorrowCount] = useState(0);
  const [movedInboxCount, setMovedInboxCount] = useState(0);
  const shutdownTasks = getDailyShutdownTasks(overview.todayTasks).filter(
    (task) => !resolvedTaskIds.includes(task.id),
  );

  const moveTask = (
    taskId: number,
    targetDate: LocalDateString | null,
    destination: ShutdownDestination,
  ) => {
    changeDate.mutate(
      { taskId, targetDate },
      {
        onSuccess: () => {
          setResolvedTaskIds((ids) => [...ids, taskId]);
          if (destination === 'tomorrow') {
            setMovedTomorrowCount((count) => count + 1);
          } else {
            setMovedInboxCount((count) => count + 1);
          }
        },
      },
    );
  };

  const summary = `내일 ${movedTomorrowCount}개 · 기록함 ${movedInboxCount}개`;

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        title="하루 마감"
        description="끝내지 못한 일을 내일로 옮기거나 기록함에 내려놓아요."
        leading={
          <IconButton accessibilityLabel="Today 화면으로 돌아가기" onPress={router.back}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={20}
              tintColor={theme.colors.text}
            />
          </IconButton>
        }
      />

      {changeDate.error ? (
        <InlineNotice
          tone="danger"
          title="이 항목을 옮기지 못했어요"
          message={changeDate.error.message}
        />
      ) : resolvedTaskIds.length > 0 ? (
        <InlineNotice tone="success" message={summary} />
      ) : null}

      {overview.isPending ? (
        <ListSkeleton accessibilityLabel="마감할 항목을 불러오는 중" count={4} />
      ) : overview.error ? (
        <InlineNotice
          tone="danger"
          title="오늘 할 일을 불러오지 못했어요"
          message={overview.error.message}
          action={
            <Button size="compact" variant="ghost" onPress={() => void overview.refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : shutdownTasks.length === 0 ? (
        <EmptyState
          icon={
            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primarySoft }]}>
              <SymbolView
                name={{ ios: 'moon.stars.fill', android: 'bedtime', web: 'bedtime' }}
                size={22}
                tintColor={theme.colors.primary}
              />
            </View>
          }
          title="오늘 정리가 끝났어요"
          description={resolvedTaskIds.length > 0 ? summary : '옮길 미완료 항목이 없어요.'}
          primaryAction={<Button onPress={() => router.replace('/')}>Today로 돌아가기</Button>}
        />
      ) : (
        <View style={styles.section}>
          <SectionHeader
            title="미완료 할 일"
            description="처리한 항목은 목록에서 바로 사라져요."
            count={shutdownTasks.length}
          />
          <View style={styles.list}>
            {shutdownTasks.map((task) => {
              const loading = changeDate.isPending && changeDate.variables?.taskId === task.id;

              return (
                <TaskCard
                  compact
                  key={task.id}
                  task={task}
                  showCompletionControl={false}
                  onOpen={() =>
                    router.push({
                      pathname: '/tasks/[taskId]',
                      params: { taskId: String(task.id) },
                    })
                  }
                  action={
                    <View style={styles.actions}>
                      <Button
                        size="compact"
                        variant="ghost"
                        disabled={changeDate.isPending}
                        onPress={() => moveTask(task.id, null, 'inbox')}
                      >
                        기록함
                      </Button>
                      <Button
                        size="compact"
                        loading={loading}
                        disabled={changeDate.isPending}
                        onPress={() => moveTask(task.id, tomorrow, 'tomorrow')}
                      >
                        내일로
                      </Button>
                    </View>
                  }
                />
              );
            })}
          </View>
          <AppText tone="secondary" variant="caption">
            그대로 둘 항목은 처리하지 않고 Today로 돌아가도 돼요.
          </AppText>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing[3], paddingTop: spacing[4] },
  section: { gap: spacing[2] },
  list: { gap: spacing[2] },
  actions: { alignItems: 'center', flexDirection: 'row', gap: spacing[1] },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
