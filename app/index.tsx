import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';

export default function HomeScreen() {
  const { todayTotals, goals } = useAppStore();

  const caloriePercent = goals.calories > 0
    ? Math.min((todayTotals.calories / goals.calories) * 100, 100)
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-5 pt-8">
        {/* Header */}
        <View className="mb-8 flex-row items-start justify-between">
          <View>
            <Text className="text-3xl font-bold text-gray-800">Thaali</Text>
            <Text className="text-base text-muted mt-1">Track what you eat, simply.</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/goals')} className="p-2 mt-1">
            <Text className="text-2xl">⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Calorie summary */}
        <TouchableOpacity
          className="bg-white rounded-2xl p-5 mb-6 shadow-sm"
          onPress={() => router.push('/dashboard')}
          activeOpacity={0.8}
        >
          <Text className="text-sm text-muted mb-1">Today</Text>
          <Text className="text-2xl font-bold text-gray-800">
            {Math.round(todayTotals.calories)}{' '}
            <Text className="text-base font-normal text-muted">/ {goals.calories} kcal</Text>
          </Text>

          {/* Progress bar */}
          <View className="h-2.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${caloriePercent}%` }}
            />
          </View>

          <View className="flex-row justify-between mt-3">
            <MacroChip label="Protein" value={todayTotals.protein} goal={goals.protein} unit="g" />
            <MacroChip label="Carbs" value={todayTotals.carbs} goal={goals.carbs} unit="g" />
            <MacroChip label="Fat" value={todayTotals.fat} goal={goals.fat} unit="g" />
            <MacroChip label="Sugar" value={todayTotals.sugar} goal={goals.sugar} unit="g" />
          </View>
        </TouchableOpacity>

        {/* Input buttons */}
        <Text className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
          Add food
        </Text>

        <View className="flex-row gap-3 mb-3">
          {/* Scan Label */}
          <TouchableOpacity
            className="flex-1 bg-white rounded-2xl p-5 items-center shadow-sm"
            onPress={() => router.push('/scan-label')}
            activeOpacity={0.8}
          >
            <Text className="text-3xl mb-2">📷</Text>
            <Text className="font-semibold text-gray-800 text-center">Scan Label</Text>
            <Text className="text-xs text-muted text-center mt-1">Packaged food</Text>
          </TouchableOpacity>

          {/* Indian Dish */}
          <TouchableOpacity
            className="flex-1 bg-white rounded-2xl p-5 items-center shadow-sm"
            onPress={() => router.push('/indian-dish/')}
            activeOpacity={0.8}
          >
            <Text className="text-3xl mb-2">🥘</Text>
            <Text className="font-semibold text-gray-800 text-center">Indian Dish</Text>
            <Text className="text-xs text-muted text-center mt-1">Quick estimate</Text>
          </TouchableOpacity>
        </View>

        {/* Ingredients */}
        <TouchableOpacity
          className="bg-primary rounded-2xl p-5 items-center shadow-sm flex-row justify-center gap-2"
          onPress={() => router.push('/ingredients')}
          activeOpacity={0.8}
        >
          <Text className="text-2xl">🧑‍🍳</Text>
          <View>
            <Text className="font-semibold text-white text-base">Add Ingredients</Text>
            <Text className="text-xs text-orange-100">Home cooking</Text>
          </View>
        </TouchableOpacity>

        {/* Footer links */}
        <View className="mt-5 flex-row justify-between">
          <TouchableOpacity className="py-3 flex-1 items-center" onPress={() => router.push('/dashboard')}>
            <Text className="text-primary font-medium">Today's Log →</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-3 flex-1 items-center" onPress={() => router.push('/history')}>
            <Text className="text-primary font-medium">History →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function MacroChip({
  label,
  value,
  goal,
  unit,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
}) {
  return (
    <View className="items-center">
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="text-sm font-semibold text-gray-700">
        {Math.round(value)}
        <Text className="text-xs font-normal text-muted">/{goal}{unit}</Text>
      </Text>
    </View>
  );
}
