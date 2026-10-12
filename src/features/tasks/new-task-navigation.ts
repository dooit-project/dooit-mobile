import type { ImperativeRouter } from 'expo-router';

type NewTaskRouter = Pick<ImperativeRouter, 'back' | 'canGoBack' | 'replace'>;

export function leaveNewTaskScreen(router: NewTaskRouter) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace('/');
}
