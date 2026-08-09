import { useEffect, useState } from 'react';

import { Button, InlineNotice } from '@/components/ui';
import {
  initializeAppPreferences,
  markFeatureTipCompleted,
  type AppPreferences,
  type FeatureTipId,
} from '@/services/preferences';

type ContextualFeatureTipProps = {
  message: string;
  tipIds: FeatureTipId[];
  title: string;
};

export function getPendingFeatureTipIds(preferences: AppPreferences, tipIds: FeatureTipId[]) {
  return tipIds.filter((tipId) => !preferences.completedFeatureTips.includes(tipId));
}

export function ContextualFeatureTip({ message, tipIds, title }: ContextualFeatureTipProps) {
  const [pendingTipIds, setPendingTipIds] = useState<FeatureTipId[]>([]);
  const tipIdsKey = tipIds.join('|');

  useEffect(() => {
    let active = true;
    const requestedTipIds = tipIdsKey.split('|') as FeatureTipId[];

    void initializeAppPreferences().then((preferences) => {
      if (active) {
        setPendingTipIds(getPendingFeatureTipIds(preferences, requestedTipIds));
      }
    });

    return () => {
      active = false;
    };
  }, [tipIdsKey]);

  if (pendingTipIds.length === 0) {
    return null;
  }

  return (
    <InlineNotice
      message={message}
      title={title}
      action={
        <Button
          accessibilityLabel={`${title} 안내 확인`}
          size="compact"
          variant="ghost"
          onPress={() => {
            const completedTipIds = [...pendingTipIds];
            setPendingTipIds([]);
            void Promise.all(completedTipIds.map((tipId) => markFeatureTipCompleted(tipId)));
          }}
        >
          확인
        </Button>
      }
    />
  );
}
