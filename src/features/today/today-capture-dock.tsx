import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { radii, spacing, useAppTheme } from '@/theme';

type TodayCaptureDockProps = {
  onCreateIdea: () => void;
  onCreateSchedule: () => void;
  onCreateTask: () => void;
};

const createActions = [
  { key: 'schedule', label: '일정', icon: 'calendar-blank-outline' },
  { key: 'task', label: '할 일', icon: 'checkbox-blank-circle-outline' },
  { key: 'idea', label: '아이디어', icon: 'lightbulb-outline' },
] as const;

export function TodayCaptureDock({
  onCreateIdea,
  onCreateSchedule,
  onCreateTask,
}: TodayCaptureDockProps) {
  const theme = useAppTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const handlers = { idea: onCreateIdea, schedule: onCreateSchedule, task: onCreateTask };

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
              onPress={() => {
                setMenuOpen(false);
                handlers[action.key]();
              }}
              style={({ pressed }) => [
                styles.menuAction,
                { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
              ]}
            >
              <MaterialCommunityIcons
                color={theme.colors.textSecondary}
                name={action.icon}
                size={20}
              />
              <AppText numberOfLines={1} weight="medium">
                {action.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable
        accessibilityHint="일정, 할 일 또는 아이디어 추가 메뉴를 엽니다."
        accessibilityLabel={menuOpen ? '추가 메뉴 닫기' : '할 일 추가'}
        accessibilityRole="button"
        accessibilityState={{ expanded: menuOpen }}
        aria-expanded={menuOpen}
        onPress={() => setMenuOpen((current) => !current)}
        style={({ pressed }) => [
          styles.addButton,
          {
            backgroundColor: pressed ? theme.colors.highlightBlue : theme.colors.primarySoft,
          },
        ]}
      >
        <Feather color={theme.colors.primary} name="plus" size={24} />
        <AppText tone="primary" weight="semibold" style={{ fontSize: 16, lineHeight: 24 }}>
          할 일 추가
        </AppText>
      </Pressable>
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
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing[4],
    justifyContent: 'flex-start',
    minHeight: 50,
    width: '100%',
    paddingHorizontal: spacing[5],
  },
});
