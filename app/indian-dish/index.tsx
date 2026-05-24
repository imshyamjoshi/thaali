import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { IndianDish } from '@/types';
import { getAllDishes, filterDishes, groupByCategory } from '@/utils/dishSearch';

type Section = { title: string; data: IndianDish[] };

export default function IndianDishScreen() {
  const [dishes, setDishes] = useState<IndianDish[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllDishes().then((d) => {
      setDishes(d);
      setLoading(false);
    });
  }, []);

  const sections: Section[] = useMemo(() => {
    const filtered = filterDishes(dishes, query);
    const grouped = groupByCategory(filtered);
    return Object.entries(grouped).map(([title, data]) => ({ title, data }));
  }, [dishes, query]);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-5 pt-5 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Text className="text-primary text-lg">← Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Indian Dish</Text>
      </View>

      {/* Search */}
      <View className="px-5 mb-3">
        <View className="bg-white border border-gray-200 rounded-xl flex-row items-center px-3">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 py-3 text-gray-800 text-base"
            placeholder="Search dishes..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E85D04" />
          <Text className="text-muted mt-2">Loading dishes...</Text>
        </View>
      ) : sections.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-3">🔍</Text>
          <Text className="text-gray-500 text-center">
            No dishes found for "{query}"
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View className="bg-surface py-2 mt-2">
              <Text className="text-xs font-bold uppercase tracking-widest text-muted">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <DishRow
              dish={item}
              onPress={() => router.push(`/indian-dish/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function DishRow({ dish, onPress }: { dish: IndianDish; onPress: () => void }) {
  const minCal = dish.servings[0]?.calories ?? 0;
  const maxCal = dish.servings[dish.servings.length - 1]?.calories ?? 0;

  return (
    <TouchableOpacity
      className="bg-white rounded-xl mb-2 px-4 py-3.5 flex-row items-center justify-between shadow-sm"
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text className="font-medium text-gray-800 flex-1">{dish.name}</Text>
      <View className="flex-row items-center gap-2">
        <Text className="text-sm text-muted">
          {minCal}–{maxCal} kcal
        </Text>
        <Text className="text-gray-300">›</Text>
      </View>
    </TouchableOpacity>
  );
}
