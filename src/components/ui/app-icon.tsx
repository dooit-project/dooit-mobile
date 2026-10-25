import { Feather, Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { sizes } from '@/theme';
import { uiAuditProps } from './ui-audit-props';

export type AppIconName = ComponentProps<typeof Feather>['name'] | 'idea';
type AppIconSize = 'navigation' | 'list' | 'action' | 'menu' | 'meta';

const iconSizes: Record<AppIconSize, number> = {
  navigation: sizes.navigationIcon,
  list: sizes.listIcon,
  action: sizes.actionIcon,
  menu: sizes.menuItemIcon,
  meta: sizes.metaIcon,
};

/** Decorative glyphs; the owning button/tab supplies its accessible name and state. */
export function AppIcon({
  name,
  color,
  size = 'action',
}: {
  name: AppIconName;
  color: string;
  size?: AppIconSize;
}) {
  const decorativeProps = {
    ...uiAuditProps({ uiIcon: 'glyph' }),
    allowFontScaling: false,
    accessible: false,
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no' as const,
    'aria-hidden': true,
  };
  // Menu glyphs share a square line box instead of the icon font's implicit leading.
  const menuStyle =
    size === 'menu' ? { lineHeight: iconSizes.menu, includeFontPadding: false } : undefined;

  return name === 'idea' ? (
    <Ionicons
      {...decorativeProps}
      name="bulb-outline"
      color={color}
      size={iconSizes[size]}
      style={menuStyle}
    />
  ) : (
    <Feather
      {...decorativeProps}
      name={name}
      color={color}
      size={iconSizes[size]}
      style={menuStyle}
    />
  );
}
