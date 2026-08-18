type NotificationResponseDependencies = {
  setHandler: (
    handler: {
      handleNotification: () => Promise<{
        shouldShowBanner: boolean;
        shouldShowList: boolean;
        shouldPlaySound: boolean;
        shouldSetBadge: boolean;
      }>;
    } | null,
  ) => void;
  addResponseListener: (listener: (response: NotificationResponseLike) => void) => {
    remove: () => void;
  };
  getLastResponse: () => Promise<NotificationResponseLike | null>;
  clearLastResponse: () => void;
};

type NotificationResponseLike = {
  notification: {
    request: {
      identifier: string;
      content: {
        data?: Record<string, unknown>;
      };
    };
  };
};

export function getTaskIdFromNotificationData(data: unknown) {
  if (!data || typeof data !== 'object' || !('taskId' in data)) {
    return null;
  }

  const value = (data as { taskId?: unknown }).taskId;
  const taskId = typeof value === 'string' && value.trim() ? Number(value) : value;
  return typeof taskId === 'number' && Number.isInteger(taskId) && taskId > 0 ? taskId : null;
}

export function getWorkspaceIdFromNotificationData(data: unknown) {
  if (!data || typeof data !== 'object' || !('workspaceId' in data)) return null;

  const value = (data as { workspaceId?: unknown }).workspaceId;
  const workspaceId = typeof value === 'string' && value.trim() ? Number(value) : value;
  return typeof workspaceId === 'number' && Number.isInteger(workspaceId) && workspaceId > 0
    ? workspaceId
    : null;
}

export async function configureTaskNotificationResponses(
  onOpenTask: (taskId: number) => void,
  dependencies: NotificationResponseDependencies,
  onOpenWorkspace?: (workspaceId: number) => void,
) {
  const handledIdentifiers = new Set<string>();
  const handleResponse = (response: NotificationResponseLike) => {
    const request = response.notification.request;
    if (handledIdentifiers.has(request.identifier)) {
      return;
    }

    const workspaceId = getWorkspaceIdFromNotificationData(request.content.data);
    const taskId = getTaskIdFromNotificationData(request.content.data);
    if (workspaceId && onOpenWorkspace) {
      handledIdentifiers.add(request.identifier);
      onOpenWorkspace(workspaceId);
      return;
    }
    if (!taskId) {
      return;
    }

    handledIdentifiers.add(request.identifier);
    onOpenTask(taskId);
  };

  dependencies.setHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const subscription = dependencies.addResponseListener(handleResponse);
  try {
    const lastResponse = await dependencies.getLastResponse();
    if (lastResponse) {
      dependencies.clearLastResponse();
      handleResponse(lastResponse);
    }
  } catch {
    // 마지막 응답 복원 실패가 실행 중 알림 처리까지 막지 않게 한다.
  }

  return () => {
    subscription.remove();
    dependencies.setHandler(null);
  };
}

export async function initializeTaskNotificationResponses(
  onOpenTask: (taskId: number) => void,
  onOpenWorkspace?: (workspaceId: number) => void,
) {
  const Notifications = await import('expo-notifications');

  return configureTaskNotificationResponses(
    onOpenTask,
    {
      setHandler: (handler) => Notifications.setNotificationHandler(handler),
      addResponseListener: (listener) =>
        Notifications.addNotificationResponseReceivedListener(listener),
      getLastResponse: () => Notifications.getLastNotificationResponseAsync(),
      clearLastResponse: () => Notifications.clearLastNotificationResponse(),
    },
    onOpenWorkspace,
  );
}
