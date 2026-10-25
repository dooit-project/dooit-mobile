import { Platform } from 'react-native';

type UiAuditMarkers = {
  uiRow?: string;
  uiAlign?: 'text-block' | 'title-line';
  uiIcon?: 'glyph' | 'slot' | 'control';
  uiText?: 'block' | 'title';
  uiTouch?: '44';
};

/** Development Web geometry only; no native props or runtime layout changes. */
export function uiAuditProps(markers: UiAuditMarkers) {
  return Platform.OS === 'web' && __DEV__ ? { dataSet: markers } : {};
}
