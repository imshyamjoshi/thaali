import '../global.css';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { seedDatabaseIfNeeded } from '@/utils/seedDatabase';
import { useAppStore } from '@/store/useAppStore';
import { getTodayEntries, loadGoals, getMetaValue } from '@/utils/database';

export default function RootLayout() {
  const setTodayEntries = useAppStore((s) => s.setTodayEntries);
  const setGoals = useAppStore((s) => s.setGoals);

  useEffect(() => {
    async function init() {
      await seedDatabaseIfNeeded();
      const today = new Date().toISOString().split('T')[0];
      const [entries, savedGoals, onboarded] = await Promise.all([
        getTodayEntries(today),
        loadGoals(),
        getMetaValue('onboarded'),
      ]);
      setTodayEntries(entries);
      if (savedGoals) setGoals(savedGoals);
      if (!onboarded && !savedGoals) router.replace('/onboarding');
    }
    init();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="indian-dish" />
        <Stack.Screen name="ingredients" />
        <Stack.Screen name="scan-label" />
        <Stack.Screen name="edit-entry" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="history" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </>
  );
}
