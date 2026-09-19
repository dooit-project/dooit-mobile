import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { spacing } from '@/theme';
import type { LocalDateString } from '@/types';
import { formatDateLabel } from '@/utils';

type TodayHeaderProps = {
  date: LocalDateString;
};
export function TodayHeader({ date }: TodayHeaderProps) {
  return (
    <View style={styles.container}>
      <AppText tone="secondary" variant="bodyLarge">
        {formatDateLabel(date, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        })}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing[1] },
});
