import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { FirstUseOverview } from '@/features/auth';
import { createGuestSession } from '@/providers/auth-token-bootstrap';

export default function StartScreen() {
  const router = useRouter();
  const [isStartingGuest, setIsStartingGuest] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <FirstUseOverview
      errorMessage={errorMessage}
      isStartingGuest={isStartingGuest}
      onStartGuest={() => {
        setErrorMessage(null);
        setIsStartingGuest(true);
        void createGuestSession()
          .then(() => router.replace('/' as Href))
          .catch(() => {
            setErrorMessage(
              '인터넷 연결을 확인하고 다시 시도하거나, 기존 계정으로 로그인해 주세요.',
            );
            setIsStartingGuest(false);
          });
      }}
    />
  );
}
