import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProviders } from '@/providers';
import { useDetailSheetTriggerTracking } from '@/components/ui';
import '@/widgets/quick-capture-widget';

export default function RootLayout() {
  useDetailSheetTriggerTracking();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="tasks/[taskId]"
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
              gestureEnabled: false,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </AppProviders>
    </GestureHandlerRootView>
  );
}
