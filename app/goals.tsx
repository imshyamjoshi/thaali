import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { saveGoals } from '@/utils/database';

export default function GoalsScreen() {
  const { goals, setGoals } = useAppStore();

  const [calories, setCalories] = useState(String(goals.calories));
  const [protein, setProtein] = useState(String(goals.protein));
  const [carbs, setCarbs] = useState(String(goals.carbs));
  const [fat, setFat] = useState(String(goals.fat));
  const [sugar, setSugar] = useState(String(goals.sugar ?? 50));
  const [fiber, setFiber] = useState(String(goals.fiber ?? 30));
  const [sodium, setSodium] = useState(String(goals.sodium ?? 2300));
  const [saturatedFat, setSaturatedFat] = useState(String(goals.saturated_fat ?? 20));

  async function handleSave() {
    const updated = {
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
      sugar: parseInt(sugar) || 0,
      fiber: parseInt(fiber) || 0,
      sodium: parseInt(sodium) || 0,
      saturated_fat: parseInt(saturatedFat) || 0,
    };
    if (updated.calories < 100) {
      Alert.alert('Invalid', 'Calorie goal must be at least 100 kcal.');
      return;
    }
    await saveGoals(updated);
    setGoals(updated);
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="px-5 pt-5 pb-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Text className="text-primary text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Daily Goals</Text>
        </View>

        <View className="px-5 mt-2">
          <Text className="text-sm text-muted mb-5">
            Set your daily macro targets. Progress bars on your dashboard will track against these.
          </Text>

          <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <GoalRow
              label="Calories"
              unit="kcal"
              value={calories}
              onChange={setCalories}
              color="bg-primary"
            />
            <GoalRow
              label="Protein"
              unit="g"
              value={protein}
              onChange={setProtein}
              color="bg-blue-500"
              last={false}
            />
            <GoalRow
              label="Carbs"
              unit="g"
              value={carbs}
              onChange={setCarbs}
              color="bg-amber-400"
              last={false}
            />
            <GoalRow
              label="Fat"
              unit="g"
              value={fat}
              onChange={setFat}
              color="bg-rose-400"
            />
            <GoalRow label="Sugar" unit="g" value={sugar} onChange={setSugar} color="bg-purple-400" />
            <GoalRow label="Fiber" unit="g" value={fiber} onChange={setFiber} color="bg-green-500" />
            <GoalRow label="Sodium" unit="mg" value={sodium} onChange={setSodium} color="bg-sky-400" />
            <GoalRow label="Saturated Fat" unit="g" value={saturatedFat} onChange={setSaturatedFat} color="bg-pink-400" last />
          </View>

          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 items-center mt-6"
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-base">Save Goals</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalRow({
  label,
  unit,
  value,
  onChange,
  color,
  last = false,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  color: string;
  last?: boolean;
}) {
  return (
    <View className={`px-4 py-4 flex-row items-center ${!last ? 'border-b border-gray-100' : ''}`}>
      <View className={`w-3 h-3 rounded-full ${color} mr-3`} />
      <Text className="flex-1 text-gray-800 font-medium">{label}</Text>
      <TextInput
        className="border border-gray-200 rounded-xl px-3 py-2 text-gray-800 text-right w-24 mr-2"
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
      />
      <Text className="text-muted text-sm w-8">{unit}</Text>
    </View>
  );
}
