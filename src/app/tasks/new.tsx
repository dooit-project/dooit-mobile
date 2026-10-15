import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { AppText, Button, IconButton, InlineNotice, PageHeader, Screen } from '@/components/ui';
import { ddayApi } from '@/features/dday/dday-api';
import { ddayQueryKeys } from '@/features/dday/dday-query-keys';
import {
  NotificationPermissionPrompt,
  getNotificationPermissionState,
  requestLocalNotificationPermission,
  shouldPromptForNotificationPermission,
  syncUpcomingTaskNotifications,
} from '@/features/notifications';
import { TaskForm, useCreateTask, useTaskDdayGoal } from '@/features/tasks';
import { leaveNewTaskScreen } from '@/features/tasks/new-task-navigation';
import { isQuickCaptureEntry } from '@/features/tasks/quick-capture-entry';
import {
  initializeAppPreferences,
  markNotificationPermissionPrompted,
} from '@/services/preferences';
import { spacing, useAppTheme } from '@/theme';
import type { TaskResponse, TaskType, TaskUpsertRequest } from '@/types';
import { isLocalDateString } from '@/utils';

export default function NewTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    date?: string;
    quickCapture?: string;
    type?: string;
    goalId?: string;
  }>();
  const theme = useAppTheme();
  const createTask = useCreateTask();
  const linkGoal = useTaskDdayGoal();
  const parsedGoalId = Number(params.goalId);
  const goalId =
    /^\d+$/.test(params.goalId ?? '') && Number.isSafeInteger(parsedGoalId) && parsedGoalId > 0
      ? parsedGoalId
      : null;
  const hasGoalContext = params.goalId !== undefined;
  const goalQuery = useQuery({
    queryKey: ddayQueryKeys.detail(goalId ?? 0),
    queryFn: ({ signal }) => ddayApi.get(goalId!, signal),
    enabled: goalId !== null,
  });
  const [unlinkedTask, setUnlinkedTask] = useState<TaskResponse | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [notificationPromptTask, setNotificationPromptTask] = useState<TaskResponse | null>(null);
  const initialDate = params.date && isLocalDateString(params.date) ? params.date : undefined;
  const initialType: TaskType | undefined =
    params.type === 'SCHEDULE' || params.type === 'TODO' || params.type === 'IDEA'
      ? params.type
      : undefined;
  const autoFocusTitle = isQuickCaptureEntry(params.quickCapture);
  const leaveScreen = () => leaveNewTaskScreen(router);

  const openTask = (task: TaskResponse) => {
    router.replace({ pathname: '/tasks/[taskId]', params: { taskId: String(task.id) } });
  };

  const finishCreation = (task: TaskResponse) => {
    setIsFinishing(true);
    setUnlinkedTask(null);
    void Promise.all([initializeAppPreferences(), getNotificationPermissionState()])
      .then(async ([preferences, permissionState]) => {
        if (
          shouldPromptForNotificationPermission({
            platform: Platform.OS,
            notificationPermissionPrompted: preferences.notificationPermissionPrompted,
            permissionState,
            task,
          })
        ) {
          await markNotificationPermissionPrompted();
          setNotificationPromptTask(task);
          return;
        }

        openTask(task);
      })
      .catch(() => openTask(task));
  };

  const connectTask = (task: TaskResponse) => {
    if (goalId === null) return;
    linkGoal.mutate(
      { taskId: task.id, ddayGoalId: goalId },
      {
        onSuccess: (linkedTask) => {
          finishCreation(linkedTask);
        },
      },
    );
  };

  const handleSubmit = (request: TaskUpsertRequest) => {
    if (hasGoalContext && !goalQuery.data) return;
    if (unlinkedTask || isFinishing || createTask.isPending || linkGoal.isPending) return;
    createTask.mutate(request, {
      onSuccess: (task) => {
        if (goalId !== null) {
          setUnlinkedTask(task);
          connectTask(task);
        } else {
          finishCreation(task);
        }
      },
    });
  };

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        title={
          hasGoalContext
            ? '항목 추가'
            : initialType === 'SCHEDULE'
              ? '새 일정'
              : initialType === 'IDEA'
                ? '새 아이디어'
                : '새 할 일'
        }
        leading={
          <IconButton
            accessibilityLabel="이전 화면으로 돌아가기"
            onPress={leaveScreen}
            style={styles.headerButton}
          >
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={20}
              tintColor={theme.colors.text}
            />
          </IconButton>
        }
      />

      {hasGoalContext && goalId === null ? (
        <InlineNotice
          tone="danger"
          message="목표를 확인할 수 없어요. 계획 화면에서 다시 선택해 주세요."
        />
      ) : hasGoalContext && goalQuery.isPending ? (
        <View accessibilityLabel="연결할 목표를 불러오는 중">
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : hasGoalContext && goalQuery.error && !unlinkedTask ? (
        <InlineNotice
          title="목표를 불러오지 못했어요"
          message={goalQuery.error.message}
          tone="danger"
          action={
            <Button size="compact" variant="ghost" onPress={() => void goalQuery.refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : unlinkedTask ? (
        <View style={styles.recovery} accessibilityLiveRegion="polite">
          <AppText weight="semibold">“{unlinkedTask.title}” 항목은 저장했어요.</AppText>
          {linkGoal.isPending ? (
            <AppText tone="secondary">목표에 연결하고 있어요.</AppText>
          ) : (
            <>
              <InlineNotice
                title="목표에 연결하지 못했어요"
                message={linkGoal.error?.message ?? '다시 연결해 주세요.'}
                tone="danger"
              />
              <Button onPress={() => connectTask(unlinkedTask)}>목표 연결 다시 시도</Button>
              <Button variant="ghost" onPress={() => finishCreation(unlinkedTask)}>
                연결 없이 상세 보기
              </Button>
            </>
          )}
        </View>
      ) : isFinishing ? (
        <AppText accessibilityLiveRegion="polite" tone="secondary">
          저장했어요.
        </AppText>
      ) : (
        <>
          {goalQuery.data && hasGoalContext ? (
            <AppText tone="secondary">“{goalQuery.data.title}”에 연결할 항목이에요.</AppText>
          ) : null}
          <TaskForm
            autoFocusTitle={autoFocusTitle}
            errorMessage={createTask.error?.message}
            initialDate={initialDate}
            initialType={initialType}
            isSubmitting={createTask.isPending}
            submitLabel="저장하기"
            onCancel={leaveScreen}
            onSubmit={handleSubmit}
          />
        </>
      )}

      <NotificationPermissionPrompt
        visible={Boolean(notificationPromptTask)}
        onEnable={async () => {
          const task = notificationPromptTask;
          if (!task) return;

          try {
            const granted = await requestLocalNotificationPermission();
            if (granted) {
              await syncUpcomingTaskNotifications().catch(() => undefined);
            }
          } finally {
            setNotificationPromptTask(null);
            openTask(task);
          }
        }}
        onLater={() => {
          const task = notificationPromptTask;
          if (!task) return;

          setNotificationPromptTask(null);
          openTask(task);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  recovery: { gap: spacing[3] },
  screen: {
    gap: spacing[4],
    paddingTop: spacing[4],
  },
  headerButton: {
    backgroundColor: 'transparent',
  },
});
