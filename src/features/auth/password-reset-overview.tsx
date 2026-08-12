import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Screen } from '@/components/ui';
import { radii, spacing, useAppTheme } from '@/theme';

export function PasswordResetOverview() {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={[styles.brandMark, { backgroundColor: theme.colors.primarySoft }]}
          >
            <AppText tone="primary" variant="bodyLarge" weight="heavy">
              T
            </AppText>
          </View>
          <AppText variant="label" weight="bold">
            ToDoLab
          </AppText>
        </View>
        <View style={styles.heroCopy}>
          <AppText accessibilityRole="header" variant="display" weight="heavy">
            비밀번호 재설정을
            {'\n'}준비하고 있어요
          </AppText>
          <AppText tone="secondary" variant="body">
            아직 앱에서 비밀번호를 재설정할 수 없어요. 기존 비밀번호를 알고 있다면 로그인으로 돌아가
            주세요.
          </AppText>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <AppText tone="secondary" variant="body">
          계정 복구 기능이 준비되면 로그인 화면에서 바로 안내할게요.
        </AppText>
        <Button fullWidth onPress={() => router.replace('/login' as Href)} size="large">
          로그인으로 돌아가기
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing[5],
    justifyContent: 'center',
    paddingBottom: spacing[8],
    paddingTop: spacing[8],
  },
  hero: {
    gap: spacing[5],
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  brandMark: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  heroCopy: {
    gap: spacing[2],
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing[4],
    padding: spacing[4],
  },
});
