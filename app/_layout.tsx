import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDatabase } from '@/db/database';
import { useSettingsStore } from '@/store/settingsStore';

export default function RootLayout() {
  const loadSettings = useSettingsStore((s) => s.load);

  useEffect(() => {
    initDatabase();
    loadSettings();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="invoice/[id]" options={{ headerShown: true, title: 'Invoice', presentation: 'card' }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: true, title: 'Edit Product', presentation: 'card' }} />
        <Stack.Screen name="product/new" options={{ headerShown: true, title: 'Add Product', presentation: 'card' }} />
        <Stack.Screen name="checkout" options={{ headerShown: true, title: 'Checkout', presentation: 'modal' }} />
        <Stack.Screen name="scan" options={{ headerShown: true, title: 'Scan Barcode', presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings', presentation: 'card' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
