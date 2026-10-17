import type { Href, ImperativeRouter } from 'expo-router';

type BackRouter = Pick<ImperativeRouter, 'back' | 'canGoBack' | 'replace'>;

/** Keep normal history navigation, with an in-app destination for direct entry. */
export function getScreenBackAction(
  router: BackRouter,
  fallbackHref: Href = '/',
  fallbackAccessibilityLabel = '오늘로 이동',
) {
  return {
    accessibilityLabel: router.canGoBack() ? '이전 화면으로 돌아가기' : fallbackAccessibilityLabel,
    onPress: () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(fallbackHref);
      }
    },
  };
}
