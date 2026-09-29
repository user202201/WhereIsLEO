import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GameFlowProvider } from '../state/GameFlowContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GameFlowProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} />
        </GameFlowProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
