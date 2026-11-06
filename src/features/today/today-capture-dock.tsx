import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppIcon, AppText, Button } from '@/components/ui';
import { radii, spacing, useAppTheme } from '@/theme';

type TodayCaptureDockProps = {
  onCreateIdea: () => void;
  onCreateSchedule: () => void;
  onCreateTask: () => void;
};

const createActions = [
  { key: 'schedule', label: '일정', icon: 'calendar' },
  { key: 'task', label: '할 일', icon: 'circle' },
  { key: 'idea', label: '아이디어', icon: 'idea' },
] as const;

export function TodayCaptureDock({
  onCreateIdea,
  onCreateSchedule,
  onCreateTask,
}: TodayCaptureDockProps) {
  const theme = useAppTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const addButtonRef = useRef<ComponentRef<typeof Button>>(null);
  const firstActionRef = useRef<ComponentRef<typeof Pressable>>(null);
  const handlers = { idea: onCreateIdea, schedule: onCreateSchedule, task: onCreateTask };

  useEffect(() => {
    if (Platform.OS !== 'web' || !menuOpen) return;
    firstActionRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setMenuOpen(false);
      requestAnimationFrame(() => addButtonRef.current?.focus());
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <View accessibilityLabel="빠른 작성" pointerEvents="box-none" style={styles.container}>
      {menuOpen ? (
        <View
          style={[
            styles.menu,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          {createActions.map((action) => (
            <Pressable
              accessibilityHint={`${action.label} 작성 화면을 엽니다.`}
              accessibilityLabel={`${action.label} 추가`}
              accessibilityRole="button"
              key={action.key}
              ref={action.key === 'schedule' ? firstActionRef : undefined}
              onPress={() => {
                setMenuOpen(false);
                handlers[action.key]();
              }}
              style={({ pressed }) => [
                styles.menuAction,
                { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
              ]}
            >
              <AppIcon color={theme.colors.textSecondary} name={action.icon} />
              <AppText numberOfLines={1} weight="medium">
                {action.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Button
        ref={addButtonRef}
        accessibilityHint="일정, 할 일 또는 아이디어 추가 메뉴를 엽니다."
        accessibilityLabel={menuOpen ? '추가 메뉴 닫기' : '할 일 추가'}
        accessibilityState={{ expanded: menuOpen }}
        aria-expanded={menuOpen}
        focusAppearance="ring"
        leading={<AppIcon color={theme.colors.textOnPrimary} name="plus" size="list" />}
        onPress={() => setMenuOpen((current) => !current)}
        style={styles.addButton}
      >
        할 일 추가
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    alignSelf: 'center',
    maxWidth: 720,
    gap: spacing[2],
    paddingBottom: spacing[5],
    paddingHorizontal: spacing[4],
    width: '100%',
  },
  menu: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 5,
    minWidth: 156,
    padding: spacing[1],
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  menuAction: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: 44,
    paddingHorizontal: spacing[3],
  },
  addButton: {
    alignSelf: 'flex-end',
    borderRadius: radii.full,
    minHeight: 50,
    paddingHorizontal: spacing[5],
  },
});
