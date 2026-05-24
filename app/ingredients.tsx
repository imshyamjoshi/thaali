import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Ingredient, SavedRecipe } from '@/types';
import {
  searchIngredients, insertEntry, recordIngredientUsed,
  getRecentIngredients, saveRecipe, getAllRecipes, deleteRecipe,
} from '@/utils/database';
import { useAppStore } from '@/store/useAppStore';

interface SelectedItem {
  ingredient: Ingredient;
  grams: string;
  useTabsp: boolean;
}

const TBSP_GRAMS = 13.5;
const OIL_KEYWORDS = ['oil', 'ghee', 'butter'];

function isOilLike(name: string) {
  const lower = name.toLowerCase();
  return OIL_KEYWORDS.some((w) => lower.includes(w));
}

function computeMacros(item: SelectedItem) {
  const raw = parseFloat(item.grams) || 0;
  const grams = item.useTabsp ? raw * TBSP_GRAMS : raw;
  const f = grams / 100;
  const r = (v: number) => Math.round(v * f * 10) / 10;
  return {
    calories: Math.round(item.ingredient.per100g.calories * f),
    protein: r(item.ingredient.per100g.protein),
    carbs: r(item.ingredient.per100g.carbs),
    fat: r(item.ingredient.per100g.fat),
    sugar: r(item.ingredient.per100g.sugar),
    fiber: r(item.ingredient.per100g.fiber),
    sodium: r(item.ingredient.per100g.sodium),
    saturated_fat: r(item.ingredient.per100g.saturated_fat),
  };
}

function sumTotals(selected: SelectedItem[]) {
  return selected.reduce(
    (acc, item) => {
      const m = computeMacros(item);
      const add = (a: number, b: number) => Math.round((a + b) * 10) / 10;
      return {
        calories: acc.calories + m.calories,
        protein: add(acc.protein, m.protein),
        carbs: add(acc.carbs, m.carbs),
        fat: add(acc.fat, m.fat),
        sugar: add(acc.sugar, m.sugar),
        fiber: add(acc.fiber, m.fiber),
        sodium: add(acc.sodium, m.sodium),
        saturated_fat: add(acc.saturated_fat, m.saturated_fat),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0, saturated_fat: 0 }
  );
}

function entryLabel(selected: SelectedItem[]) {
  const names = selected.map((s) => s.ingredient.name);
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
}

export default function IngredientsScreen() {
  const addEntry = useAppStore((s) => s.addEntry);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Ingredient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [recents, setRecents] = useState<Ingredient[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [savingRecipe, setSavingRecipe] = useState(false);

  useEffect(() => {
    async function load() {
      const [r, recs] = await Promise.all([getRecentIngredients(), getAllRecipes()]);
      setRecents(r);
      setSavedRecipes(recs);
    }
    load();
  }, []);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const found = await searchIngredients(query.trim());
      setResults(found);
      setSearching(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const addIngredient = useCallback((ingredient: Ingredient) => {
    recordIngredientUsed(ingredient.id);
    setSelected((prev) => [
      ...prev,
      {
        ingredient,
        grams: isOilLike(ingredient.name) ? '1' : '100',
        useTabsp: isOilLike(ingredient.name),
      },
    ]);
    setQuery('');
    setResults([]);
  }, []);

  const updateItem = useCallback((index: number, patch: Partial<SelectedItem>) => {
    setSelected((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }, []);

  const removeItem = useCallback((index: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  }, []);

  function loadRecipe(recipe: SavedRecipe) {
    setSelected(recipe.items as SelectedItem[]);
  }

  function confirmDeleteRecipe(recipe: SavedRecipe) {
    Alert.alert('Delete Recipe', `Delete "${recipe.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRecipe(recipe.id);
          setSavedRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
        },
      },
    ]);
  }

  async function handleSaveRecipe() {
    const name = recipeName.trim();
    if (!name) {
      Alert.alert('Name required', 'Enter a name for the recipe.');
      return;
    }
    setSavingRecipe(true);
    await saveRecipe(name, selected.map((s) => ({ ingredient: s.ingredient, grams: s.grams, useTabsp: s.useTabsp })));
    const updated = await getAllRecipes();
    setSavedRecipes(updated);
    setSavingRecipe(false);
    setRecipeModalVisible(false);
    setRecipeName('');
  }

  async function handleSave() {
    if (selected.length === 0) return;
    const totals = sumTotals(selected);
    if (totals.calories === 0) {
      Alert.alert('No macros', 'Enter gram amounts before saving.');
      return;
    }
    setSaving(true);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      source: 'ingredient' as const,
      label: entryLabel(selected),
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      sugar: totals.sugar,
      fiber: totals.fiber,
      sodium: totals.sodium,
      saturated_fat: totals.saturated_fat,
      image_uri: null,
      edited: false,
      synced: false,
    };
    try {
      await insertEntry(entry);
      addEntry(entry);
      router.replace('/');
    } catch {
      Alert.alert('Error', "Couldn't save entry. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const totals = sumTotals(selected);
  const showResults = query.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View className="px-5 pt-5 pb-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Text className="text-primary text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Add Ingredients</Text>
        </View>

        {/* Search bar */}
        <View className="px-5 pb-3">
          <View className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex-row items-center">
            <Text className="text-muted mr-2">🔍</Text>
            <TextInput
              className="flex-1 text-gray-800"
              placeholder="Search ingredients..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} className="ml-2 p-1">
                <Text className="text-muted text-lg">×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search results */}
        {showResults ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              searching ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#E85D04" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              !searching ? (
                <View className="py-8 items-center">
                  <Text className="text-muted">No ingredients found for "{query}"</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                className="mx-5 mb-2 bg-white rounded-2xl px-4 py-3 flex-row items-center justify-between"
                onPress={() => addIngredient(item)}
                activeOpacity={0.75}
              >
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium">{item.name}</Text>
                  {item.aliases.length > 0 && (
                    <Text className="text-xs text-muted">{item.aliases[0]}</Text>
                  )}
                </View>
                <Text className="text-muted text-sm ml-3">
                  {item.per100g.calories} kcal/100g
                </Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          /* Selected ingredients list */
          <FlatList
            data={selected}
            keyExtractor={(_, i) => String(i)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
            ListEmptyComponent={
              <View>
                {recents.length > 0 && (
                  <View className="mb-6">
                    <Text className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">Recent</Text>
                    <View className="gap-2">
                      {recents.map((ing) => (
                        <TouchableOpacity
                          key={ing.id}
                          className="bg-white rounded-2xl px-4 py-3 flex-row items-center justify-between"
                          onPress={() => addIngredient(ing)}
                          activeOpacity={0.75}
                        >
                          <Text className="text-gray-800 font-medium flex-1">{ing.name}</Text>
                          <Text className="text-muted text-sm ml-3">{ing.per100g.calories} kcal/100g</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {savedRecipes.length > 0 && (
                  <View className="mb-6">
                    <Text className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">Saved Recipes</Text>
                    <View className="gap-2">
                      {savedRecipes.map((recipe) => (
                        <View key={recipe.id} className="bg-white rounded-2xl px-4 py-3 flex-row items-center">
                          <View className="flex-1">
                            <Text className="text-gray-800 font-semibold">{recipe.name}</Text>
                            <Text className="text-xs text-muted">
                              {recipe.items.length} ingredient{recipe.items.length !== 1 ? 's' : ''}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => loadRecipe(recipe)}
                            className="bg-primary rounded-xl px-3 py-1.5 mr-2"
                            activeOpacity={0.8}
                          >
                            <Text className="text-white text-sm font-semibold">Load</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => confirmDeleteRecipe(recipe)} className="p-1">
                            <Text className="text-red-400 text-xl font-light">×</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {recents.length === 0 && savedRecipes.length === 0 && (
                  <View className="items-center justify-center py-16">
                    <Text className="text-5xl mb-4">🥘</Text>
                    <Text className="text-gray-500 text-center text-base">
                      Search above to add ingredients
                    </Text>
                    <Text className="text-muted text-center text-sm mt-1">
                      Mix and match to log a home-cooked meal
                    </Text>
                  </View>
                )}
              </View>
            }
            renderItem={({ item, index }) => (
              <SelectedRow
                item={item}
                index={index}
                onChange={updateItem}
                onRemove={removeItem}
              />
            )}
          />
        )}

        {/* Bottom totals + save */}
        {selected.length > 0 && !showResults && (
          <View className="px-5 pt-3 pb-4 bg-white border-t border-gray-100">
            <View className="flex-row justify-between mb-2">
              <TotalChip label="kcal" value={String(totals.calories)} big />
              <TotalChip label="Protein" value={`${totals.protein}g`} />
              <TotalChip label="Carbs" value={`${totals.carbs}g`} />
              <TotalChip label="Fat" value={`${totals.fat}g`} />
            </View>
            <View className="flex-row justify-between mb-3">
              <TotalChip label="Sugar" value={`${totals.sugar}g`} color="text-purple-600" />
              <TotalChip label="Fiber" value={`${totals.fiber}g`} color="text-green-600" />
              <TotalChip label="Sodium" value={`${Math.round(totals.sodium)}mg`} color="text-sky-600" />
              <TotalChip label="Sat.Fat" value={`${totals.saturated_fat}g`} color="text-pink-600" />
            </View>
            <TouchableOpacity
              className={`rounded-2xl py-4 items-center mb-2 ${saving ? 'bg-orange-300' : 'bg-primary'}`}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Add to Today</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="py-1 items-center"
              onPress={() => { setRecipeName(''); setRecipeModalVisible(true); }}
            >
              <Text className="text-primary text-sm font-medium">Save as Recipe</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Recipe name modal */}
      <Modal
        visible={recipeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRecipeModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-center px-8">
          <View className="bg-white rounded-3xl p-6">
            <Text className="text-lg font-bold text-gray-800 mb-4">Save Recipe</Text>
            <TextInput
              className="border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 mb-4"
              placeholder="Recipe name…"
              placeholderTextColor="#9CA3AF"
              value={recipeName}
              onChangeText={setRecipeName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveRecipe}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 border border-gray-200 rounded-2xl py-3 items-center"
                onPress={() => setRecipeModalVisible(false)}
              >
                <Text className="text-gray-600 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-2xl py-3 items-center ${savingRecipe ? 'bg-orange-300' : 'bg-primary'}`}
                onPress={handleSaveRecipe}
                disabled={savingRecipe}
                activeOpacity={0.8}
              >
                {savingRecipe ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-bold">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SelectedRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: SelectedItem;
  index: number;
  onChange: (i: number, patch: Partial<SelectedItem>) => void;
  onRemove: (i: number) => void;
}) {
  const isOil = isOilLike(item.ingredient.name);
  const macros = computeMacros(item);

  return (
    <View className="bg-white rounded-2xl mb-2 px-4 py-3 flex-row items-center">
      <View className="flex-1 mr-3">
        <Text className="text-gray-800 font-medium" numberOfLines={1}>
          {item.ingredient.name}
        </Text>
        <Text className="text-xs text-muted">
          {macros.calories} kcal · P:{macros.protein}g · S:{macros.sugar}g · F:{macros.fiber}g
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        <TextInput
          className="border border-gray-200 rounded-xl px-2 py-1.5 w-16 text-center text-gray-800"
          value={item.grams}
          onChangeText={(v) => onChange(index, { grams: v })}
          keyboardType="decimal-pad"
          returnKeyType="done"
          selectTextOnFocus
        />

        {isOil ? (
          <TouchableOpacity
            onPress={() => onChange(index, { useTabsp: !item.useTabsp })}
            className="bg-orange-50 border border-primary rounded-lg px-2 py-1.5"
          >
            <Text className="text-xs font-semibold text-primary w-8 text-center">
              {item.useTabsp ? 'tbsp' : 'g'}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text className="text-xs text-muted w-8 text-center">g</Text>
        )}

        <TouchableOpacity onPress={() => onRemove(index)} className="p-1 ml-1">
          <Text className="text-red-400 text-xl font-light">×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TotalChip({ label, value, big = false, color = 'text-gray-800' }: { label: string; value: string; big?: boolean; color?: string }) {
  return (
    <View className="items-center">
      <Text className={`font-bold ${color} ${big ? 'text-xl' : 'text-base'}`}>{value}</Text>
      <Text className="text-xs text-muted">{label}</Text>
    </View>
  );
}
