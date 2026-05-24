import { supabase } from './supabase';
import { getUnsyncedEntries, markEntrySynced } from './database';

export async function syncToSupabase(userId: string): Promise<void> {
  const entries = await getUnsyncedEntries();
  if (entries.length === 0) return;

  for (const entry of entries) {
    const { error } = await supabase.from('daily_entries').upsert({
      id: entry.id,
      user_id: userId,
      date: entry.date,
      timestamp: entry.timestamp,
      source: entry.source,
      label: entry.label,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      sugar: entry.sugar ?? 0,
      fiber: entry.fiber ?? 0,
      sodium: entry.sodium ?? 0,
      saturated_fat: entry.saturated_fat ?? 0,
      edited: entry.edited,
      deleted: false,
    });

    if (!error) {
      await markEntrySynced(entry.id);
    }
  }
}
