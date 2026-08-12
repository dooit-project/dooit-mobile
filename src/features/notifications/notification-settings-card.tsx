import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, InlineNotice } from '@/components/ui';
import { markNotificationPermissionPrompted } from '@/services/preferences';
import { radii, spacing, useAppTheme } from '@/theme';

import { getNotificationPermissionState, openNotificationSettings } from './notification-settings';
import { requestLocalNotificationPermission } from './request-notification-permission';
import { syncUpcomingTaskNotifications } from './sync-task-notifications';

type ActionStatus = 'idle' | 'pending' | 'success' | 'error';

const permissionLabels = {
  loading: '확인 중',
  granted: '허용됨',
  denied: '기기 설정에서 꺼짐',
  undetermined: '아직 선택하지 않음',
  unsupported: '모바일 앱에서 사용 가능',
} as const;

export function NotificationSettingsCard() {
  const theme = useAppTheme();
  const [permission, setPermission] = useState<keyof typeof permissionLabels>('loading');
  const [actionStatus, setActionStatus] = useState<ActionStatus>('idle');

  const refreshPermission = useCallback(() => {
    void getNotificationPermissionState()
      .then(setPermission)
      .catch(() => setPermission('unsupported'));
  }, []);

  useEffect(() => {
    refreshPermission();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshPermission();
      }
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  const handleEnable = async () => {
    setActionStatus('pending');
    try {
      await markNotificationPermissionPrompted();
      const granted = await requestLocalNotificationPermission();
      setPermission(granted ? 'granted' : 'denied');
      if (granted) {
        await syncUpcomingTaskNotifications();
        setActionStatus('success');
      } else {
        setActionStatus('idle');
      }
    } catch {
      setActionStatus('error');
    }
  };

  const handleSync = async () => {
    setActionStatus('pending');
    try {
      await syncUpcomingTaskNotifications();
      setActionStatus('success');
    } catch {
      setActionStatus('error');
    }
  };

  return (
    <Card variant="outlined" style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.icon, { backgroundColor: theme.colors.highlightSage }]}>
          <SymbolView
            name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
            size={18}
            tintColor={theme.colors.primary}
          />
        </View>
        <View style={styles.sectionCopy}>
          <AppText variant="bodyLarge" weight="bold">
            일정 알림
          </AppText>
          <AppText tone="secondary" variant="caption">
            시작 시간이 있는 일정의 로컬 알림을 이 기기에서 관리합니다.
          </AppText>
        </View>
      </View>

      <View
        accessibilityLabel={`일정 알림 권한 상태, ${permissionLabels[permission]}`}
        accessibilityLiveRegion="polite"
        style={styles.statusRow}
      >
        <AppText tone="secondary" variant="caption">
          권한 상태
        </AppText>
        <AppText align="right" weight="medium">
          {permissionLabels[permission]}
        </AppText>
      </View>

      {actionStatus === 'success' ? (
        <InlineNotice message="가까운 미래의 일정 알림을 최신 상태로 맞췄어요." tone="success" />
      ) : null}
      {actionStatus === 'error' ? (
        <InlineNotice
          message="알림 설정을 처리하지 못했어요. 잠시 후 다시 시도해 주세요."
          tone="danger"
        />
      ) : null}

      {permission === 'granted' ? (
        <Button
          fullWidth
          loading={actionStatus === 'pending'}
          onPress={() => void handleSync()}
          variant="secondary"
        >
          알림 예약 다시 맞추기
        </Button>
      ) : null}
      {permission === 'undetermined' ? (
        <Button
          fullWidth
          loading={actionStatus === 'pending'}
          onPress={() => void handleEnable()}
          variant="secondary"
        >
          알림 사용하기
        </Button>
      ) : null}
      {permission === 'denied' ? (
        <Button fullWidth onPress={() => void openNotificationSettings()} variant="secondary">
          기기 설정 열기
        </Button>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing[4],
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
  },
  icon: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sectionCopy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'space-between',
    minHeight: 36,
  },
});
