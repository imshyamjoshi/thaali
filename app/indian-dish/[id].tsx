import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { IndianDish, IndianDishServing, DailyEntry } from '@/types';
import { getAllDishes } from '@/utils/dishSearch';
import { insertEntry } from '@/utils/database';
import { useAppStore } from '@/store/useAppStore';

export default function DishDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const addEntry = useAppStore((s) => s.addEntry);

  const [dish, setDish] = useState<IndianDish | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(1); // default to medium
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable macro fields
  const [editCalories, setEditCalories] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editCarbs, setEditCarbs] = useState('');
  const [editFat, setEditFat] = useState('');
  const [editSugar, setEditSugar] = useState('');
  const [editFiber, setEditFiber] = useState('');
  const [editSodium, setEditSodium] = useState('');
  const [editSatFat, setEditSatFat] = useState('');

  useEffect(() => {
    getAllDishes().then((dishes) => {
      const found = dishes.find((d) => d.id === id);
      if (found) {
        setDish(found);
        const midIdx = Math.min(1, found.servings.length - 1);
        setSelectedIndex(midIdx);
        populateEditFields(found.servings[midIdx]);
      }
    });
  }, [id]);

  function populateEditFields(serving: IndianDishServing) {
    setEditCalories(String(serving.calories));
    setEditProtein(String(serving.protein));
    setEditCarbs(String(serving.carbs));
    setEditFat(String(serving.fat));
    setEditSugar(String(serving.sugar ?? 0));
    setEditFiber(String(serving.fiber ?? 0));
    setEditSodium(String(serving.sodium ?? 0));
    setEditSatFat(String(serving.saturated_fat ?? 0));
  }

  function handleSelectServing(index: number) {
    setSelectedIndex(index);
    setEditing(false);
    if (dish) populateEditFields(dish.servings[index]);
  }

  async function handleAddToToday() {
    if (!dish) return;
    setSaving(true);

    const entry: DailyEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      source: 'indian_dish',
      label: `${dish.name} — ${dish.servings[selectedIndex].label}`,
      calories: parseFloat(editCalories) || 0,
      protein: parseFloat(editProtein) || 0,
      carbs: parseFloat(editCarbs) || 0,
      fat: parseFloat(editFat) || 0,
      sugar: parseFloat(editSugar) || 0,
      fiber: parseFloat(editFiber) || 0,
      sodium: parseFloat(editSodium) || 0,
      saturated_fat: parseFloat(editSatFat) || 0,
      image_uri: null,
      edited: editing,
      synced: false,
    };

    try {
      await insertEntry(entry);
      addEntry(entry);
      router.replace('/');
    } catch (e) {
      Alert.alert('Error', "Couldn't save entry. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!dish) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#E85D04" />
      </SafeAreaView>
    );
  }

  const selectedServing = dish.servings[selectedIndex];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="px-5 pt-5 pb-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Text className="text-primary text-lg">← Back</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-800">{dish.name}</Text>
            <Text className="text-xs text-muted">{dish.category}</Text>
          </View>
        </View>

        {/* Serving size selector */}
        <View className="px-5 mt-2">
          <Text className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
            Serving size
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {dish.servings.map((serving, index) => (
              <TouchableOpacity
                key={index}
                className={`px-4 py-4 flex-row items-center justify-between ${
                  index < dish.servings.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onPress={() => handleSelectServing(index)}
                activeOpacity={0.75}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                      selectedIndex === index
                        ? 'border-primary bg-primary'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedIndex === index && (
                      <View className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </View>
                  <Text className="text-gray-800 font-medium">{serving.label}</Text>
                </View>
                <Text className="text-muted text-sm">{serving.calories} kcal</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Macro preview */}
        <View className="px-5 mt-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted">
              Macros
            </Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Text className="text-primary text-sm font-medium">
                {editing ? 'Done editing' : 'Edit values'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm">
            {editing ? (
              <View className="gap-3">
                <EditMacroRow label="Calories" unit="kcal" value={editCalories} onChange={setEditCalories} />
                <EditMacroRow label="Protein" unit="g" value={editProtein} onChange={setEditProtein} />
                <EditMacroRow label="Carbs" unit="g" value={editCarbs} onChange={setEditCarbs} />
                <EditMacroRow label="Fat" unit="g" value={editFat} onChange={setEditFat} />
                <EditMacroRow label="Sugar" unit="g" value={editSugar} onChange={setEditSugar} />
                <EditMacroRow label="Fiber" unit="g" value={editFiber} onChange={setEditFiber} />
                <EditMacroRow label="Sodium" unit="mg" value={editSodium} onChange={setEditSodium} />
                <EditMacroRow label="Sat. Fat" unit="g" value={editSatFat} onChange={setEditSatFat} />
              </View>
            ) : (
              <View>
                <View className="flex-row justify-between mb-3">
                  <MacroDisplay label="Calories" value={editCalories} unit="kcal" big />
                  <MacroDisplay label="Protein" value={editProtein} unit="g" />
                  <MacroDisplay label="Carbs" value={editCarbs} unit="g" />
                  <MacroDisplay label="Fat" value={editFat} unit="g" />
                </View>
                {(parseFloat(editSugar) > 0 || parseFloat(editFiber) > 0 || parseFloat(editSodium) > 0 || parseFloat(editSatFat) > 0) && (
                  <View className="flex-row flex-wrap gap-2 pt-2 border-t border-gray-100">
                    <MiniChip label="Sugar" value={`${editSugar}g`} color="text-purple-600" />
                    <MiniChip label="Fiber" value={`${editFiber}g`} color="text-green-600" />
                    <MiniChip label="Sodium" value={`${editSodium}mg`} color="text-sky-600" />
                    <MiniChip label="Sat.Fat" value={`${editSatFat}g`} color="text-pink-600" />
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Add to today button */}
        <View className="px-5 mt-5">
          <TouchableOpacity
            className={`rounded-2xl py-4 items-center ${
              saving ? 'bg-orange-300' : 'bg-primary'
            }`}
            onPress={handleAddToToday}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Add to Today</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Text className={`text-xs font-semibold ${color}`}>{label}:</Text>
      <Text className="text-xs text-gray-600">{value}</Text>
    </View>
  );
}

function MacroDisplay({
  label,
  value,
  unit,
  big = false,
}: {
  label: string;
  value: string;
  unit: string;
  big?: boolean;
}) {
  return (
    <View className="items-center">
      <Text className={big ? 'text-2xl font-bold text-gray-800' : 'text-lg font-bold text-gray-800'}>
        {value}
      </Text>
      <Text className="text-xs text-muted">{unit}</Text>
      <Text className="text-xs text-muted mt-0.5">{label}</Text>
    </View>
  );
}

function EditMacroRow({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-gray-700 w-24">
        {label} ({unit})
      </Text>
      <TextInput
        className="border border-gray-200 rounded-xl px-3 py-2 text-gray-800 text-right w-28"
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        returnKeyType="done"
      />
    </View>
  );
}
