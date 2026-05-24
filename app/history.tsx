import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { getDatabase } from '@/utils/database';
import { DailyEntry } from '@/types';

interface DaySummary {
  date: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  sodium: number;
  saturated_fat: number;
  entryCount: number;
}

async function getLast30Days(): Promise<DaySummary[]> {
  const db = await getDatabase();
  const days: DaySummary[] = [];

  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];

    const rows = await db.getAllAsync<DailyEntry>(
      'SELECT * FROM daily_entries WHERE date = ? AND deleted = 0',
      [date]
    );

    const totals = rows.reduce(
      (acc, e: any) => ({
        calories: acc.calories + (e.calories || 0),
        protein: acc.protein + (e.protein || 0),
        carbs: acc.carbs + (e.carbs || 0),
        fat: acc.fat + (e.fat || 0),
        sugar: acc.sugar + (e.sugar || 0),
        fiber: acc.fiber + (e.fiber || 0),
        sodium: acc.sodium + (e.sodium || 0),
        saturated_fat: acc.saturated_fat + (e.saturated_fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0, saturated_fat: 0 }
    );

    const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday'
      : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    days.push({ date, label, ...totals, entryCount: rows.length });
  }

  return days;
}

export default function HistoryScreen() {
  const [days, setDays] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLast30Days().then((data) => {
      setDays(data);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-5 pt-5 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Text className="text-primary text-lg">← Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">History</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E85D04" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {days.map((day) => (
            <View key={day.date} className="bg-white rounded-2xl mb-3 p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <View>
                  <Text className="font-bold text-gray-800 text-base">{day.label}</Text>
                  <Text className="text-xs text-muted">{day.date}</Text>
                </View>
                {day.entryCount === 0 ? (
                  <Text className="text-muted text-sm">No entries</Text>
                ) : (
                  <Text className="text-2xl font-bold text-primary">
                    {Math.round(day.calories)}
                    <Text className="text-sm font-normal text-muted"> kcal</Text>
                  </Text>
                )}
              </View>

              {day.entryCount > 0 && (
                <View className="flex-row flex-wrap gap-2 mt-1">
                  <StatChip label="Protein" value={`${Math.round(day.protein)}g`} color="bg-blue-100 text-blue-700" />
                  <StatChip label="Carbs" value={`${Math.round(day.carbs)}g`} color="bg-amber-100 text-amber-700" />
                  <StatChip label="Fat" value={`${Math.round(day.fat)}g`} color="bg-rose-100 text-rose-700" />
                  <StatChip label="Sugar" value={`${Math.round(day.sugar)}g`} color="bg-purple-100 text-purple-700" />
                  <StatChip label="Fiber" value={`${Math.round(day.fiber)}g`} color="bg-green-100 text-green-700" />
                  <StatChip label="Sodium" value={`${Math.round(day.sodium)}mg`} color="bg-sky-100 text-sky-700" />
                  <StatChip label="Sat.Fat" value={`${Math.round(day.saturated_fat)}g`} color="bg-pink-100 text-pink-700" />
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  const [bg, text] = color.split(' ');
  return (
    <View className={`${bg} rounded-lg px-2 py-1 flex-row gap-1 items-center`}>
      <Text className={`text-xs font-medium ${text}`}>{label}: {value}</Text>
    </View>
  );
}
