import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { updateEntry, softDeleteEntry } from '@/utils/database';

export default function EditEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { todayEntries, editEntry, deleteEntry } = useAppStore();

  const entry = todayEntries.find((e) => e.id === id);

  const [label, setLabel] = useState(entry?.label ?? '');
  const [calories, setCalories] = useState(String(Math.round(entry?.calories ?? 0)));
  const [protein, setProtein] = useState(String(Math.round(entry?.protein ?? 0)));
  const [carbs, setCarbs] = useState(String(Math.round(entry?.carbs ?? 0)));
  const [fat, setFat] = useState(String(Math.round(entry?.fat ?? 0)));
  const [sugar, setSugar] = useState(String(Math.round(entry?.sugar ?? 0)));
  const [fiber, setFiber] = useState(String(Math.round(entry?.fiber ?? 0)));
  const [sodium, setSodium] = useState(String(Math.round(entry?.sodium ?? 0)));
  const [saturatedFat, setSaturatedFat] = useState(String(Math.round(entry?.saturated_fat ?? 0)));

  if (!entry) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <Text className="text-muted">Entry not found.</Text>
      </SafeAreaView>
    );
  }

  async function handleSave() {
    const updates = {
      label,
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      sugar: parseFloat(sugar) || 0,
      fiber: parseFloat(fiber) || 0,
      sodium: parseFloat(sodium) || 0,
      saturated_fat: parseFloat(saturatedFat) || 0,
    };
    await updateEntry(entry!.id, updates);
    editEntry(entry!.id, updates);
    router.back();
  }

  async function handleDelete() {
    Alert.alert('Delete Entry', `Remove "${entry!.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await softDeleteEntry(entry!.id);
          deleteEntry(entry!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="px-5 pt-5 pb-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Text className="text-primary text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Edit Entry</Text>
        </View>

        <View className="px-5 mt-2">
          <Field label="Name" value={label} onChangeText={setLabel} />
          <Field
            label="Calories (kcal)"
            value={calories}
            onChangeText={setCalories}
            numeric
          />
          <Field label="Protein (g)" value={protein} onChangeText={setProtein} numeric />
          <Field label="Carbs (g)" value={carbs} onChangeText={setCarbs} numeric />
          <Field label="Sugar (g)" value={sugar} onChangeText={setSugar} numeric />
          <Field label="Fiber (g)" value={fiber} onChangeText={setFiber} numeric />
          <Field label="Sodium (mg)" value={sodium} onChangeText={setSodium} numeric />
          <Field label="Saturated Fat (g)" value={saturatedFat} onChangeText={setSaturatedFat} numeric />
          <Field label="Fat (g)" value={fat} onChangeText={setFat} numeric />

          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 items-center mt-4"
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-base">Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-2xl py-4 items-center mt-3 border border-rose-200"
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Text className="text-rose-500 font-semibold text-base">Delete Entry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  numeric = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  numeric?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-600 mb-1">{label}</Text>
      <TextInput
        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-base"
        value={value}
        onChangeText={onChangeText}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        returnKeyType="done"
      />
    </View>
  );
}
