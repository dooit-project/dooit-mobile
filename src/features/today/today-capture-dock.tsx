import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { radii, spacing, useAppTheme } from '@/theme';

type TodayCaptureDockProps = {
  onCreateIdea: () => void;
  onCreateSchedule: () => void;
  onCreateTask: () => void;
};

const createActions = [
  {
    key: 'schedule',
    label: '일정',
    icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  },
  {
    key: 'task',
    label: '할 일',
    icon: { ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' },
  },
  {
    key: 'idea',
    label: '아이디어',
    icon: { ios: 'lightbulb', android: 'lightbulb', web: 'lightbulb' },
  },
] as const;

export function TodayCaptureDock({
  onCreateIdea,
  onCreateSchedule,
  onCreateTask,
}: TodayCaptureDockProps) {
  const theme = useAppTheme();
  const handlers = { idea: onCreateIdea, schedule: onCreateSchedule, task: onCreateTask };
  const toneColors = {
    idea: { background: theme.colors.highlightBlue, foreground: theme.colors.primary },
    schedule: { background: theme.colors.highlightAmber, foreground: theme.colors.warning },
    task: { background: theme.colors.highlightSage, foreground: theme.colors.success },
  };

  return (
    <View
      accessibilityLabel="빠른 작성"
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
      ]}
    >
      <AppText variant="bodyLarge" weight="bold">
        무엇을 남길까요?
      </AppText>
      <View style={styles.actions}>
        {createActions.map((action) => {
          const colors = toneColors[action.key];
          return (
            <Pressable
              accessibilityHint={`${action.label} 작성 화면을 엽니다.`}
              accessibilityLabel={`${action.label} 추가`}
              accessibilityRole="button"
              key={action.key}
              onPress={handlers[action.key]}
              style={({ pressed }) => [
                styles.action,
                {
                  backgroundColor: pressed ? colors.background : theme.colors.surfaceMuted,
                  borderColor: pressed ? colors.foreground : theme.colors.surfaceMuted,
                },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: colors.background }]}>
                <SymbolView name={action.icon} size={19} tintColor={colors.foreground} />
              </View>
              <AppText numberOfLines={1} variant="caption" weight="bold">
                {action.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    width: '100%',
  },
  actions: { flexDirection: 'row', gap: spacing[2] },
  action: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    flexDirection: 'row',
    gap: spacing[1],
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 0,
    paddingHorizontal: spacing[1],
  },
  icon: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
});
