type TaskNotificationSyncListener = () => void;

const listeners = new Set<TaskNotificationSyncListener>();

export function requestTaskNotificationSync() {
  listeners.forEach((listener) => listener());
}

export function subscribeTaskNotificationSync(listener: TaskNotificationSyncListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
