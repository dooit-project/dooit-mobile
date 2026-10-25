import type { ComponentRef } from 'react';
import { AccessibilityInfo, findNodeHandle, Platform, View } from 'react-native';

/** Restore keyboard focus on Web and accessibility focus on native. */
export function focusControl(control: ComponentRef<typeof View> | null | undefined) {
  if (!control) return;
  if (Platform.OS === 'web') {
    (control as unknown as HTMLElement).focus();
  } else {
    const tag = findNodeHandle(control);
    if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
  }
}
