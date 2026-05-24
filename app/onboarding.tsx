import {
  View, Text, TouchableOpacity, TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { saveGoals, setMetaValue } from '@/utils/database';

const PRESETS = [
  { label: 'Weight Loss', calories: 1500, protein: 120, carbs: 150, fat: 50, sugar: 40, fiber: 30, sodium: 2000, saturated_fat: 15 },
  { label: 'Maintenance', calories: 2000, protein: 120, carbs: 220, fat: 65, sugar: 50, fiber: 30, sodium: 2300, saturated_fat: 20 },
  { label: 'Muscle Gain', calories: 2500, protein: 160, carbs: 280, fat: 75, sugar: 60, fiber: 30, sodium: 2500, saturated_fat: 25 },
];

export default function OnboardingScreen() {
  const setGoals = useAppStore((s) => s.setGoals);
  const [selected, setSelected] = useState(1);
  const [calories, setCalories] = useState('2000');
  const [protein, setProtein] = useState('120');

  function applyPreset(idx: number) {
    setSelected(idx);
    setCalories(String(PRESETS[idx].calories));
    setProtein(String(PRESETS[idx].protein));
  }

  async function handleStart() {
    const preset = PRESETS[selected];
    const goals = {
      ...preset,
      calories: parseInt(calories) || preset.calories,
      protein: parseInt(protein) || preset.protein,
    };
    await saveGoals(goals);
    await setMetaValue('onboarded', '1');
    setGoals(goals);
    router.replace('/');
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <View className="mb-8 mt-4">
          <Text className="text-4xl font-bold text-gray-800 mb-2">Welcome to Thaali</Text>
          <Text className="text-base text-muted">
            Track what you eat — Indian food first, no compromises.
          </Text>
        </View>

        <Text className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
          Choose your goal
        </Text>
        <View className="flex-row gap-2 mb-6">
          {PRESETS.map((p, idx) => (
            <TouchableOpacity
              key={p.label}
              onPress={() => applyPreset(idx)}
              className={`flex-1 rounded-2xl py-3 items-center border ${
                selected === idx ? 'bg-primary border-primary' : 'bg-white border-gray-200'
              }`}
              activeOpacity={0.8}
            >
              <Text className={`text-xs font-semibold ${selected === idx ? 'text-white' : 'text-gray-700'}`}>
                {p.label}
              </Text>
              <Text className={`text-lg font-bold mt-1 ${selected === idx ? 'text-white' : 'text-gray-800'}`}>
                {p.calories}
              </Text>
              <Text className={`text-xs ${selected === idx ? 'text-orange-100' : 'text-muted'}`}>kcal</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
          Fine-tune (optional)
        </Text>
        <View className="bg-white rounded-2xl overflow-hidden mb-8">
          <View className="px-4 py-3 flex-row items-center border-b border-gray-100">
            <Text className="flex-1 text-gray-700">Calories (kcal)</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-3 py-1.5 w-24 text-right text-gray-800"
              value={calories}
              onChangeText={setCalories}
              keyboardType="number-pad"
              selectTextOnFocus
            />
          </View>
          <View className="px-4 py-3 flex-row items-center">
            <Text className="flex-1 text-gray-700">Protein (g)</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-3 py-1.5 w-24 text-right text-gray-800"
              value={protein}
              onChangeText={setProtein}
              keyboardType="number-pad"
              selectTextOnFocus
            />
          </View>
        </View>

        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center"
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-base">Start Tracking</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
