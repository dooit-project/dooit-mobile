import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';

import { IconButton, PageHeader, Screen } from '@/components/ui';
import {
  NotificationPermissionPrompt,
  getNotificationPermissionState,
  requestLocalNotificationPermission,
  shouldPromptForNotificationPermission,
  syncUpcomingTaskNotifications,
} from '@/features/notifications';
import { TaskForm, useCreateTask } from '@/features/tasks';
import {
  initializeAppPreferences,
  markNotificationPermissionPrompted,
} from '@/services/preferences';
import { spacing, useAppTheme } from '@/theme';
import type { TaskResponse, TaskUpsertRequest } from '@/types';

export default function NewTaskScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const createTask = useCreateTask();
  const [notificationPromptTask, setNotificationPromptTask] = useState<TaskResponse | null>(null);

  const openTask = (task: TaskResponse) => {
    router.replace({ pathname: '/tasks/[taskId]', params: { taskId: String(task.id) } });
  };

  const handleSubmit = (request: TaskUpsertRequest) => {
    createTask.mutate(request, {
      onSuccess: (task) => {
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
      },
    });
  };

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        title="새 할 일"
        leading={
          <IconButton
            accessibilityLabel="이전 화면으로 돌아가기"
            onPress={router.back}
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

      <TaskForm
        errorMessage={createTask.error?.message}
        isSubmitting={createTask.isPending}
        submitLabel="저장하기"
        onCancel={() => router.back()}
        onSubmit={handleSubmit}
      />

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
  screen: {
    gap: spacing[4],
    paddingTop: spacing[4],
  },
  headerButton: {
    backgroundColor: 'transparent',
  },
});
