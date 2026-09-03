import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProviders } from '@/providers';
import '@/widgets/quick-capture-widget';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </AppProviders>
    </GestureHandlerRootView>
  );
}
