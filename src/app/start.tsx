import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { FirstUseOverview } from '@/features/auth';
import { getAuthSubmissionErrorMessage } from '@/features/auth/auth-submission-error';
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
          .catch((error) => {
            setErrorMessage(getAuthSubmissionErrorMessage(error, false));
            setIsStartingGuest(false);
          });
      }}
    />
  );
}
