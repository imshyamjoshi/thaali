import {
  View, Text, TouchableOpacity, TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { saveGoals, setMetaValue } from '@/utils/database';
import { MacroGoals } from '@/types';

type Gender = 'male' | 'female';
type ActivityKey = 'sedentary' | 'light' | 'moderate' | 'active';
type GoalKey = 'lose' | 'maintain' | 'gain';

const ACTIVITIES: { key: ActivityKey; label: string; desc: string; mult: number }[] = [
  { key: 'sedentary', label: 'Sedentary',         desc: 'Office job, little or no exercise', mult: 1.2 },
  { key: 'light',     label: 'Lightly active',    desc: '1–2 workouts per week',             mult: 1.375 },
  { key: 'moderate',  label: 'Moderately active', desc: '3–4 workouts per week',             mult: 1.55 },
  { key: 'active',    label: 'Very active',        desc: '5+ workouts / physical job',        mult: 1.725 },
];

const GOAL_OPTS: { key: GoalKey; label: string; emoji: string; adj: number; pMult: number }[] = [
  { key: 'lose',     label: 'Lose Weight',  emoji: '🎯', adj: -500, pMult: 1.8 },
  { key: 'maintain', label: 'Stay Fit',     emoji: '⚖️', adj: 0,    pMult: 1.5 },
  { key: 'gain',     label: 'Build Muscle', emoji: '💪', adj: 300,  pMult: 2.0 },
];

function computeGoals(
  gender: Gender, age: number, weightKg: number, heightCm: number,
  actMult: number, calAdj: number, pMult: number,
): MacroGoals {
  const bmr = gender === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const calories = Math.max(1200, Math.round(bmr * actMult) + calAdj);
  const protein = Math.round(weightKg * pMult);
  const fat = Math.round((calories * 0.28) / 9);
  const carbs = Math.max(50, Math.round((calories - protein * 4 - fat * 9) / 4));
  return {
    calories, protein, carbs, fat,
    sugar: Math.round(calories * 0.05),
    fiber: 30,
    sodium: 2300,
    saturated_fat: Math.round((calories * 0.07) / 9),
  };
}

export default function OnboardingScreen() {
  const setGoals = useAppStore((s) => s.setGoals);
  const [step, setStep] = useState(1);

  // Step 1 — body stats
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // Step 2 — activity
  const [activityKey, setActivityKey] = useState<ActivityKey>('light');

  // Step 3 — goal
  const [goalKey, setGoalKey] = useState<GoalKey>('maintain');

  // Step 4 — review & fine-tune
  const [calculated, setCalculated] = useState<MacroGoals | null>(null);
  const [editCal, setEditCal] = useState('');
  const [editProt, setEditProt] = useState('');

  function goStep2() {
    const a = parseInt(age), w = parseFloat(weight), h = parseFloat(height);
    if (!a || a < 10 || a > 100) { Alert.alert('Invalid', 'Enter your age (10–100).'); return; }
    if (!w || w < 20 || w > 300) { Alert.alert('Invalid', 'Enter your weight in kg.'); return; }
    if (!h || h < 100 || h > 250) { Alert.alert('Invalid', 'Enter your height in cm.'); return; }
    setStep(2);
  }

  function goStep4() {
    const act = ACTIVITIES.find((a) => a.key === activityKey)!;
    const goal = GOAL_OPTS.find((g) => g.key === goalKey)!;
    const goals = computeGoals(gender, parseInt(age), parseFloat(weight), parseFloat(height),
      act.mult, goal.adj, goal.pMult);
    setCalculated(goals);
    setEditCal(String(goals.calories));
    setEditProt(String(goals.protein));
    setStep(4);
  }

  async function handleStart() {
    if (!calculated) return;
    const final: MacroGoals = {
      ...calculated,
      calories: Math.max(1000, parseInt(editCal) || calculated.calories),
      protein: Math.max(40, parseInt(editProt) || calculated.protein),
    };
    await saveGoals(final);
    await setMetaValue('onboarded', '1');
    setGoals(final);
    router.replace('/');
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        {/* Progress dots */}
        <View className="flex-row gap-2 mb-8 mt-2">
          {[1, 2, 3, 4].map((s) => (
            <View key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-gray-200'}`} />
          ))}
        </View>

        {/* ── Step 1: Body stats ── */}
        {step === 1 && (
          <View>
            <Text className="text-3xl font-bold text-gray-800 mb-1">Welcome to Thaali</Text>
            <Text className="text-muted mb-8">Tell us a bit about yourself to set smart targets.</Text>

            {/* Gender */}
            <Label text="Gender" />
            <View className="flex-row gap-3 mb-6">
              {(['male', 'female'] as Gender[]).map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  className={`flex-1 py-3 rounded-2xl items-center border ${
                    gender === g ? 'bg-primary border-primary' : 'bg-white border-gray-200'
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className={`font-semibold ${gender === g ? 'text-white' : 'text-gray-700'}`}>
                    {g === 'male' ? '♂ Male' : '♀ Female'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stats */}
            <Label text="Age" />
            <StatInput value={age} onChange={setAge} unit="years" placeholder="25" />
            <Label text="Weight" />
            <StatInput value={weight} onChange={setWeight} unit="kg" placeholder="65" decimal />
            <Label text="Height" />
            <StatInput value={height} onChange={setHeight} unit="cm" placeholder="170" decimal />

            <TouchableOpacity className="bg-primary rounded-2xl py-4 items-center mt-6" onPress={goStep2} activeOpacity={0.8}>
              <Text className="text-white font-bold text-base">Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Activity ── */}
        {step === 2 && (
          <View>
            <Text className="text-2xl font-bold text-gray-800 mb-1">Activity level</Text>
            <Text className="text-muted mb-6">How active are you on a typical week?</Text>
            <View className="gap-3 mb-8">
              {ACTIVITIES.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  onPress={() => setActivityKey(a.key)}
                  className={`bg-white rounded-2xl px-4 py-4 flex-row items-center border ${
                    activityKey === a.key ? 'border-primary' : 'border-gray-100'
                  }`}
                  activeOpacity={0.8}
                >
                  <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                    activityKey === a.key ? 'border-primary bg-primary' : 'border-gray-300'
                  }`}>
                    {activityKey === a.key && <View className="w-2 h-2 rounded-full bg-white" />}
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{a.label}</Text>
                    <Text className="text-xs text-muted mt-0.5">{a.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 border border-gray-200 rounded-2xl py-4 items-center" onPress={() => setStep(1)} activeOpacity={0.8}>
                <Text className="text-gray-600 font-semibold">← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-primary rounded-2xl py-4 items-center" onPress={() => setStep(3)} activeOpacity={0.8}>
                <Text className="text-white font-bold">Next →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Step 3: Goal ── */}
        {step === 3 && (
          <View>
            <Text className="text-2xl font-bold text-gray-800 mb-1">Your goal</Text>
            <Text className="text-muted mb-6">We'll adjust your calorie and protein targets accordingly.</Text>
            <View className="gap-3 mb-8">
              {GOAL_OPTS.map((g) => {
                const act = ACTIVITIES.find((a) => a.key === activityKey)!;
                const preview = computeGoals(gender, parseInt(age) || 25, parseFloat(weight) || 65,
                  parseFloat(height) || 165, act.mult, g.adj, g.pMult);
                return (
                  <TouchableOpacity
                    key={g.key}
                    onPress={() => setGoalKey(g.key)}
                    className={`bg-white rounded-2xl px-4 py-4 flex-row items-center border ${
                      goalKey === g.key ? 'border-primary' : 'border-gray-100'
                    }`}
                    activeOpacity={0.8}
                  >
                    <Text className="text-2xl mr-3">{g.emoji}</Text>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-800">{g.label}</Text>
                      <Text className="text-xs text-muted mt-0.5">~{preview.calories} kcal · {preview.protein}g protein</Text>
                    </View>
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                      goalKey === g.key ? 'border-primary bg-primary' : 'border-gray-300'
                    }`}>
                      {goalKey === g.key && <View className="w-2 h-2 rounded-full bg-white" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 border border-gray-200 rounded-2xl py-4 items-center" onPress={() => setStep(2)} activeOpacity={0.8}>
                <Text className="text-gray-600 font-semibold">← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-primary rounded-2xl py-4 items-center" onPress={goStep4} activeOpacity={0.8}>
                <Text className="text-white font-bold">Calculate →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && calculated && (
          <View>
            <Text className="text-2xl font-bold text-gray-800 mb-1">Your targets</Text>
            <Text className="text-muted mb-6">Fine-tune if needed, then start tracking.</Text>

            <View className="bg-white rounded-2xl overflow-hidden mb-6 shadow-sm">
              <TargetRow label="Calories" unit="kcal" value={editCal} onChange={setEditCal} editable color="bg-primary" />
              <TargetRow label="Protein" unit="g" value={editProt} onChange={setEditProt} editable color="bg-blue-500" />
              <TargetRow label="Carbs" unit="g" value={String(calculated.carbs)} color="bg-amber-400" />
              <TargetRow label="Fat" unit="g" value={String(calculated.fat)} color="bg-rose-400" />
              <TargetRow label="Sugar" unit="g" value={String(calculated.sugar)} color="bg-purple-400" />
              <TargetRow label="Fiber" unit="g" value={String(calculated.fiber)} color="bg-green-500" />
              <TargetRow label="Sodium" unit="mg" value={String(calculated.sodium)} color="bg-sky-400" />
              <TargetRow label="Sat. Fat" unit="g" value={String(calculated.saturated_fat)} color="bg-pink-400" last />
            </View>

            <Text className="text-xs text-muted text-center mb-6">
              Carbs, fat and micronutrient targets are calculated automatically and can be adjusted later in Goals.
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 border border-gray-200 rounded-2xl py-4 items-center" onPress={() => setStep(3)} activeOpacity={0.8}>
                <Text className="text-gray-600 font-semibold">← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-primary rounded-2xl py-4 items-center" onPress={handleStart} activeOpacity={0.8}>
                <Text className="text-white font-bold">Start Tracking</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return (
    <Text className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">{text}</Text>
  );
}

function StatInput({ value, onChange, unit, placeholder, decimal = false }: {
  value: string; onChange: (v: string) => void; unit: string; placeholder: string; decimal?: boolean;
}) {
  return (
    <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-4">
      <TextInput
        className="flex-1 text-gray-800 text-base"
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        returnKeyType="next"
        selectTextOnFocus
      />
      <Text className="text-muted ml-2">{unit}</Text>
    </View>
  );
}

function TargetRow({ label, unit, value, onChange, editable = false, color, last = false }: {
  label: string; unit: string; value: string; onChange?: (v: string) => void;
  editable?: boolean; color: string; last?: boolean;
}) {
  return (
    <View className={`px-4 py-3.5 flex-row items-center ${!last ? 'border-b border-gray-100' : ''}`}>
      <View className={`w-3 h-3 rounded-full ${color} mr-3`} />
      <Text className="flex-1 text-gray-700 font-medium">{label}</Text>
      {editable ? (
        <TextInput
          className="border border-gray-200 rounded-xl px-3 py-1.5 w-20 text-right text-gray-800 mr-2"
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          returnKeyType="done"
          selectTextOnFocus
        />
      ) : (
        <Text className="text-gray-800 font-semibold mr-2">{value}</Text>
      )}
      <Text className="text-muted text-sm w-8">{unit}</Text>
    </View>
  );
}
