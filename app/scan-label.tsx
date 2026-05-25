import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { parseLabel, scaleToServings, ParsedLabel } from '@/utils/ocrParser';
import { insertEntry } from '@/utils/database';
import { useAppStore } from '@/store/useAppStore';

type Screen = 'capture' | 'form';

const EMPTY_LABEL: ParsedLabel = {
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
  servingGrams: null,
  confidence: 'low',
};

export default function ScanLabelScreen() {
  const addEntry = useAppStore((s) => s.addEntry);

  const [screen, setScreen] = useState<Screen>('capture');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [parsed, setParsed] = useState<ParsedLabel>(EMPTY_LABEL);
  const [servings, setServings] = useState('1');
  const [productName, setProductName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [sugar, setSugar] = useState('');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');
  const [saturatedFat, setSaturatedFat] = useState('');
  const [saving, setSaving] = useState(false);

  function applyParsed(label: ParsedLabel, srv: number) {
    const scaled = scaleToServings(label, srv);
    setCalories(label.calories !== null ? String(scaled.calories) : '');
    setProtein(label.protein !== null ? String(scaled.protein) : '');
    setCarbs(label.carbs !== null ? String(scaled.carbs) : '');
    setFat(label.fat !== null ? String(scaled.fat) : '');
    setSugar('');
  }

  function handleServingsChange(val: string) {
    setServings(val);
    const srv = parseFloat(val) || 1;
    applyParsed(parsed, srv);
  }

  async function handleCapture(fromGallery = false) {
    const perm = fromGallery
      ? await ImagePicker.requestMediaLibraryPermissionsAsync()
      : await ImagePicker.requestCameraPermissionsAsync();

    if (!perm.granted) {
      Alert.alert('Permission needed', fromGallery ? 'Allow photo library access in settings.' : 'Allow camera access in settings.');
      return;
    }

    const result = fromGallery
      ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setPhotoUri(uri);
    setProcessing(true);
    setScreen('form');

    const label = EMPTY_LABEL;

    setParsed(label);
    applyParsed(label, parseFloat(servings) || 1);
    setProcessing(false);
  }

  function handleEnterManually() {
    setParsed(EMPTY_LABEL);
    setScreen('form');
  }

  async function handleSave() {
    const cal = parseFloat(calories) || 0;
    if (cal === 0) {
      Alert.alert('Missing calories', 'Enter at least the calorie value.');
      return;
    }
    setSaving(true);
    const entryId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Copy photo to persistent storage
    let persistedUri: string | null = null;
    if (photoUri) {
      const dir = FileSystem.documentDirectory + 'entry_images/';
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      const ext = photoUri.split('.').pop() || 'jpg';
      const dest = `${dir}${entryId}.${ext}`;
      await FileSystem.copyAsync({ from: photoUri, to: dest }).catch(() => {});
      persistedUri = dest;
    }

    const entryLabel = productName.trim() || 'Packaged food';
    const entry = {
      id: entryId,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      source: 'ocr' as const,
      label: entryLabel,
      calories: cal,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      sugar: parseFloat(sugar) || 0,
      fiber: parseFloat(fiber) || 0,
      sodium: parseFloat(sodium) || 0,
      saturated_fat: parseFloat(saturatedFat) || 0,
      image_uri: persistedUri,
      edited: parsed.confidence !== 'high',
      synced: false,
    };
    try {
      await insertEntry(entry);
      addEntry(entry);
      router.replace('/');
    } catch {
      Alert.alert('Error', "Couldn't save entry.");
    } finally {
      setSaving(false);
    }
  }

  if (screen === 'capture') {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="px-5 pt-5 pb-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Text className="text-primary text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Scan Label</Text>
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-6xl mb-6">📷</Text>
          <Text className="text-lg font-bold text-gray-800 mb-2 text-center">
            Point at a nutrition label
          </Text>
          <Text className="text-muted text-center mb-10 text-sm">
            Take a photo of a packaged food label and fill in the macros.
          </Text>

          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 px-8 items-center w-full mb-3"
            onPress={() => handleCapture(false)}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-base">📷  Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white border border-gray-200 rounded-2xl py-4 px-8 items-center w-full mb-3"
            onPress={() => handleCapture(true)}
            activeOpacity={0.8}
          >
            <Text className="text-gray-700 font-semibold text-base">🖼️  Choose from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-3 items-center w-full"
            onPress={handleEnterManually}
          >
            <Text className="text-primary font-medium">Enter values manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-5 pb-3 flex-row items-center">
          <TouchableOpacity onPress={() => setScreen('capture')} className="mr-3 p-1">
            <Text className="text-primary text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Label Details</Text>
        </View>

        {/* Photo preview */}
        {photoUri && (
          <View className="mx-5 mb-4 rounded-2xl overflow-hidden h-44">
            <Image source={{ uri: photoUri }} className="w-full h-full" resizeMode="cover" />
          </View>
        )}

        {processing && (
          <View className="mx-5 mb-4 bg-white rounded-2xl py-4 items-center">
            <ActivityIndicator color="#E85D04" />
            <Text className="text-muted text-sm mt-2">Reading label…</Text>
          </View>
        )}

        {/* Confidence banner */}
        {!processing && parsed.confidence === 'low' && (
          <View className="mx-5 mb-4 bg-blue-50 rounded-2xl px-4 py-3 flex-row items-center">
            <Text className="mr-2">ℹ️</Text>
            <Text className="text-sm text-blue-700 flex-1">
              Couldn't read the label automatically. Enter the values below.
            </Text>
          </View>
        )}
        {!processing && parsed.confidence === 'medium' && (
          <View className="mx-5 mb-4 bg-amber-50 rounded-2xl px-4 py-3 flex-row items-center">
            <Text className="mr-2">⚠️</Text>
            <Text className="text-sm text-amber-700 flex-1">Some fields missing — check and fill in</Text>
          </View>
        )}
        {!processing && parsed.confidence === 'high' && (
          <View className="mx-5 mb-4 bg-green-50 rounded-2xl px-4 py-3 flex-row items-center">
            <Text className="mr-2">✅</Text>
            <Text className="text-sm text-green-700 flex-1">All fields read — please confirm</Text>
          </View>
        )}

        {/* Product name */}
        <View className="px-5 mb-4">
          <Text className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
            Product name
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-gray-800"
            placeholder="e.g. Protein bar, Biscuits…"
            placeholderTextColor="#9CA3AF"
            value={productName}
            onChangeText={setProductName}
            returnKeyType="next"
          />
        </View>

        {/* Servings */}
        <View className="px-5 mb-4">
          <Text className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
            Servings eaten
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden">
            <View className="px-4 py-3 flex-row items-center justify-between">
              <Text className="text-gray-700">Number of servings</Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => {
                    const v = Math.max(0.5, (parseFloat(servings) || 1) - 0.5);
                    handleServingsChange(String(v));
                  }}
                  className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                >
                  <Text className="text-gray-700 text-lg font-medium">−</Text>
                </TouchableOpacity>
                <TextInput
                  className="border border-gray-200 rounded-xl px-3 py-1.5 w-16 text-center text-gray-800"
                  value={servings}
                  onChangeText={handleServingsChange}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  selectTextOnFocus
                />
                <TouchableOpacity
                  onPress={() => {
                    const v = (parseFloat(servings) || 1) + 0.5;
                    handleServingsChange(String(v));
                  }}
                  className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                >
                  <Text className="text-gray-700 text-lg font-medium">+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Macro fields */}
        <View className="px-5 mb-6">
          <Text className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
            Macros per {parseFloat(servings) !== 1 ? `${servings} servings` : 'serving'}
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden">
            <MacroField label="Calories" unit="kcal" value={calories} onChange={setCalories} color="bg-primary" required />
            <MacroField label="Protein" unit="g" value={protein} onChange={setProtein} color="bg-blue-500" />
            <MacroField label="Carbs" unit="g" value={carbs} onChange={setCarbs} color="bg-amber-400" />
            <MacroField label="Fat" unit="g" value={fat} onChange={setFat} color="bg-rose-400" />
            <MacroField label="Sugar" unit="g" value={sugar} onChange={setSugar} color="bg-purple-400" />
            <MacroField label="Fiber" unit="g" value={fiber} onChange={setFiber} color="bg-green-500" />
            <MacroField label="Sodium" unit="mg" value={sodium} onChange={setSodium} color="bg-sky-400" />
            <MacroField label="Saturated Fat" unit="g" value={saturatedFat} onChange={setSaturatedFat} color="bg-pink-400" last />
          </View>
        </View>

        {/* Save */}
        <View className="px-5">
          <TouchableOpacity
            className={`rounded-2xl py-4 items-center ${saving ? 'bg-orange-300' : 'bg-primary'}`}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroField({
  label,
  unit,
  value,
  onChange,
  color,
  required = false,
  last = false,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  color: string;
  required?: boolean;
  last?: boolean;
}) {
  return (
    <View className={`px-4 py-3 flex-row items-center ${!last ? 'border-b border-gray-100' : ''}`}>
      <View className={`w-3 h-3 rounded-full ${color} mr-3`} />
      <Text className="flex-1 text-gray-700">
        {label}
        {required && <Text className="text-primary"> *</Text>}
      </Text>
      <TextInput
        className="border border-gray-200 rounded-xl px-3 py-1.5 w-24 text-right text-gray-800 mr-2"
        value={value}
        onChangeText={onChange}
        placeholder="—"
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
        returnKeyType="done"
        selectTextOnFocus
      />
      <Text className="text-muted text-sm w-8">{unit}</Text>
    </View>
  );
}
