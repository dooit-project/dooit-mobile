export type GoalTabLayout = { x: number; width: number };

/** Wait for measurements; reveal the whole tab with breathing room where possible. */
export function getGoalTabScrollOffset({
  tab,
  viewportWidth,
  contentWidth,
  offset,
}: {
  tab?: GoalTabLayout;
  viewportWidth: number;
  contentWidth: number;
  offset: number;
}): number | undefined {
  if (!tab || viewportWidth <= 0 || contentWidth <= 0) return undefined;
  const maxOffset = Math.max(0, contentWidth - viewportWidth);
  const padding = Math.max(0, Math.min(8, (viewportWidth - tab.width) / 2));
  let next = offset;
  if (tab.width >= viewportWidth || tab.x - padding < offset) next = tab.x - padding;
  else if (tab.x + tab.width + padding > offset + viewportWidth)
    next = tab.x + tab.width + padding - viewportWidth;
  return Math.max(0, Math.min(maxOffset, next));
}

export function getGoalTabKeyboardTarget<Key extends string>(
  keys: readonly Key[],
  current: Key,
  key: string,
): Key | undefined {
  const index = keys.indexOf(current);
  if (index < 0 || !keys.length) return undefined;
  if (key === 'Home') return keys[0];
  if (key === 'End') return keys[keys.length - 1];
  if (key === 'ArrowLeft') return keys[(index + keys.length - 1) % keys.length];
  if (key === 'ArrowRight') return keys[(index + 1) % keys.length];
  return undefined;
}
