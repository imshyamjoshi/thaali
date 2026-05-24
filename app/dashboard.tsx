import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { softDeleteEntry } from '@/utils/database';
import { DailyEntry } from '@/types';

export default function DashboardScreen() {
  const { todayEntries, todayTotals, goals, deleteEntry } = useAppStore();

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  async function handleDelete(entry: DailyEntry) {
    Alert.alert('Delete Entry', `Remove "${entry.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await softDeleteEntry(entry.id);
          deleteEntry(entry.id);
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-5 pt-5 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Text className="text-primary text-lg">← Back</Text>
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-gray-800">Today's Log</Text>
          <Text className="text-xs text-muted">{today}</Text>
        </View>
      </View>

      {/* Macro summary */}
      <View className="mx-5 mb-4 bg-white rounded-2xl p-4 shadow-sm">
        <MacroBar
          label="Calories"
          value={todayTotals.calories}
          goal={goals.calories}
          unit="kcal"
          color="bg-primary"
        />
        <MacroBar
          label="Protein"
          value={todayTotals.protein}
          goal={goals.protein}
          unit="g"
          color="bg-blue-500"
        />
        <MacroBar
          label="Carbs"
          value={todayTotals.carbs}
          goal={goals.carbs}
          unit="g"
          color="bg-amber-400"
        />
        <MacroBar
          label="Fat"
          value={todayTotals.fat}
          goal={goals.fat}
          unit="g"
          color="bg-rose-400"
        />
        <MacroBar label="Sugar" value={todayTotals.sugar} goal={goals.sugar} unit="g" color="bg-purple-400" />
        <MacroBar label="Fiber" value={todayTotals.fiber} goal={goals.fiber} unit="g" color="bg-green-500" />
        <MacroBar label="Sodium" value={Math.round(todayTotals.sodium)} goal={goals.sodium} unit="mg" color="bg-sky-400" />
        <MacroBar label="Sat. Fat" value={todayTotals.saturated_fat} goal={goals.saturated_fat} unit="g" color="bg-pink-400" />
      </View>

      {/* Entries list */}
      <FlatList
        data={todayEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="items-center mt-16">
            <Text className="text-4xl mb-3">🍽️</Text>
            <Text className="text-gray-500 text-base">Nothing logged yet today.</Text>
            <TouchableOpacity
              className="mt-4 bg-primary rounded-xl px-6 py-3"
              onPress={() => router.back()}
            >
              <Text className="text-white font-semibold">Add your first meal</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <EntryRow
            entry={item}
            onEdit={() => router.push({ pathname: '/edit-entry', params: { id: item.id } })}
            onDelete={() => handleDelete(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function MacroBar({
  label,
  value,
  goal,
  unit,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-gray-700">{label}</Text>
        <Text className="text-sm font-semibold text-gray-800">
          {Math.round(value)} / {goal} {unit}
        </Text>
      </View>
      <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <View className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}

function EntryRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: DailyEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const time = new Date(entry.timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const sourceLabel: Record<DailyEntry['source'], string> = {
    ocr: 'scanned',
    ingredient: 'home',
    indian_dish: 'estimate',
    manual: 'manual',
  };

  return (
    <View className="bg-white rounded-xl mb-3 px-4 py-3 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-xs text-muted mb-0.5">
            {time} · {sourceLabel[entry.source]}
          </Text>
          <Text className="font-semibold text-gray-800">{entry.label}</Text>
          <Text className="text-sm text-muted mt-1">
            {Math.round(entry.calories)} kcal · P:{Math.round(entry.protein)}g · C:{Math.round(entry.carbs)}g · F:{Math.round(entry.fat)}g{entry.sugar > 0 ? ` · Sugar:${Math.round(entry.sugar)}g` : ''}
          </Text>
        </View>
        <View className="flex-row items-center gap-1 ml-2">
          {entry.image_uri ? (
            <Image
              source={{ uri: entry.image_uri }}
              className="w-10 h-10 rounded-lg mr-1"
              resizeMode="cover"
            />
          ) : null}
          <TouchableOpacity onPress={onEdit} className="p-2">
            <Text className="text-lg">✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} className="p-2">
            <Text className="text-lg">🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
