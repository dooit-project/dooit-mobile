export type MenuAnchor = { x: number; y: number; width: number; height: number };

/** All coordinates are relative to the overlay host, not the window. */
export function getActionMenuPlacement({
  anchor,
  host,
  contentHeight,
  preferredWidth = 208,
  gutter = 8,
  gap = 4,
}: {
  anchor: MenuAnchor;
  host: { width: number; height: number };
  contentHeight: number;
  preferredWidth?: number;
  gutter?: number;
  gap?: number;
}) {
  const width = Math.max(0, Math.min(preferredWidth, host.width - gutter * 2));
  const left = Math.max(
    gutter,
    Math.min(anchor.x + anchor.width - width, host.width - gutter - width),
  );
  const below = Math.max(0, host.height - gutter - anchor.y - anchor.height - gap);
  const above = Math.max(0, anchor.y - gap - gutter);
  const opensAbove = below < contentHeight && above > below;
  const maxHeight = opensAbove ? above : below;
  const top = opensAbove
    ? Math.max(gutter, anchor.y - gap - Math.min(contentHeight, maxHeight))
    : Math.max(gutter, anchor.y + anchor.height + gap);
  return { left, top, width, maxHeight };
}

export function getActionMenuKeyboardIndex(count: number, index: number, key: string) {
  if (count < 1) return null;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'ArrowDown') return index < 0 ? 0 : (index + 1) % count;
  if (key === 'ArrowUp') return index < 0 ? count - 1 : (index - 1 + count) % count;
  return null;
}
