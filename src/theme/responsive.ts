import { useWindowDimensions } from 'react-native';

import { spacing } from './tokens';

export type ViewportWidthClass = 'compact' | 'regular' | 'wide' | 'tablet' | 'desktop';

export function getViewportWidthClass(width: number): ViewportWidthClass {
  if (width < 360) return 'compact';
  if (width < 400) return 'regular';
  if (width < 600) return 'wide';
  if (width < 840) return 'tablet';
  return 'desktop';
}

export function shouldUseDesktopLayout(width: number, height: number) {
  return getViewportWidthClass(width) === 'desktop' && height >= 600;
}

export function shouldUseDenseCalendarGrid(width: number, height: number, fontScale = 1) {
  return width < 360 || height < 600 || fontScale >= 1.3;
}

export function useMobileLayout() {
  const { fontScale, height, width } = useWindowDimensions();
  const widthClass = getViewportWidthClass(width);
  const isShortViewport = height < 600;

  return {
    fontScale,
    isCompact: widthClass === 'compact',
    isLargeFont: fontScale >= 1.3,
    isDenseCalendar: shouldUseDenseCalendarGrid(width, height, fontScale),
    isDesktop: shouldUseDesktopLayout(width, height),
    isLandscape: width > height,
    isShortViewport,
    isTablet: widthClass === 'tablet',
    screenPadding: widthClass === 'compact' ? spacing[4] : spacing[5],
    width,
    widthClass,
  };
}
