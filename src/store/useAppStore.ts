import { create } from 'zustand';
import { DailyEntry, MacroGoals, MacroTotals } from '../types';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function sumTotals(entries: DailyEntry[]): MacroTotals {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
      sugar: acc.sugar + (e.sugar ?? 0),
      fiber: acc.fiber + (e.fiber ?? 0),
      sodium: acc.sodium + (e.sodium ?? 0),
      saturated_fat: acc.saturated_fat + (e.saturated_fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0, saturated_fat: 0 }
  );
}

interface AppStore {
  todayEntries: DailyEntry[];
  todayTotals: MacroTotals;
  goals: MacroGoals;
  userId: string | null;
  syncStatus: 'idle' | 'syncing' | 'error';

  setTodayEntries: (entries: DailyEntry[]) => void;
  addEntry: (entry: DailyEntry) => void;
  editEntry: (id: string, updates: Partial<DailyEntry>) => void;
  deleteEntry: (id: string) => void;
  setGoals: (goals: MacroGoals) => void;
  setUserId: (id: string | null) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
}

export const useAppStore = create<AppStore>((set) => ({
  todayEntries: [],
  todayTotals: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0, saturated_fat: 0 },
  goals: { calories: 1800, protein: 120, carbs: 200, fat: 60, sugar: 50, fiber: 30, sodium: 2300, saturated_fat: 20 },
  userId: null,
  syncStatus: 'idle',

  setTodayEntries: (entries) =>
    set({ todayEntries: entries, todayTotals: sumTotals(entries) }),

  addEntry: (entry) =>
    set((state) => {
      const entries = [...state.todayEntries, entry];
      return { todayEntries: entries, todayTotals: sumTotals(entries) };
    }),

  editEntry: (id, updates) =>
    set((state) => {
      const entries = state.todayEntries.map((e) =>
        e.id === id ? { ...e, ...updates, edited: true } : e
      );
      return { todayEntries: entries, todayTotals: sumTotals(entries) };
    }),

  deleteEntry: (id) =>
    set((state) => {
      const entries = state.todayEntries.filter((e) => e.id !== id);
      return { todayEntries: entries, todayTotals: sumTotals(entries) };
    }),

  setGoals: (goals) => set({ goals }),
  setUserId: (userId) => set({ userId }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
}));
