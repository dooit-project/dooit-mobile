import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import { spacing, useAppTheme } from '@/theme';

type NotificationPermissionPromptProps = {
  visible: boolean;
  onEnable: () => Promise<void> | void;
  onLater: () => void;
};

export function NotificationPermissionPrompt({
  visible,
  onEnable,
  onLater,
}: NotificationPermissionPromptProps) {
  const theme = useAppTheme();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      await onEnable();
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onLater}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <View
        accessibilityViewIsModal
        style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
      >
        <Card accessibilityLabel="일정 알림 안내" style={styles.card}>
          <AppText variant="title" weight="bold">
            일정 전에 알려드릴까요?
          </AppText>
          <AppText tone="secondary">
            방금 저장한 일정처럼 시작 시간이 있는 항목을 놓치지 않도록 이 기기에서 알림을 보낼 수
            있어요. 권한은 지금 한 번만 요청합니다.
          </AppText>
          <View style={styles.actions}>
            <Button fullWidth loading={isRequesting} onPress={() => void handleEnable()}>
              알림 사용하기
            </Button>
            <Button disabled={isRequesting} fullWidth onPress={onLater} variant="ghost">
              지금은 사용하지 않기
            </Button>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing[4],
  },
  card: {
    gap: spacing[3],
    maxWidth: 420,
    width: '100%',
  },
  actions: {
    gap: spacing[1],
    marginTop: spacing[2],
  },
});
