import * as SQLite from 'expo-sqlite';
import { DailyEntry } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('thaali.db');
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS daily_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      source TEXT NOT NULL,
      label TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      sugar REAL DEFAULT 0,
      image_uri TEXT,
      edited INTEGER DEFAULT 0,
      synced INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(date);
  `);

  // Migrate existing installs — ignore errors if columns already exist
  try { await database.execAsync('ALTER TABLE daily_entries ADD COLUMN sugar REAL DEFAULT 0'); } catch {}
  try { await database.execAsync('ALTER TABLE daily_entries ADD COLUMN fiber REAL DEFAULT 0'); } catch {}
  try { await database.execAsync('ALTER TABLE daily_entries ADD COLUMN sodium REAL DEFAULT 0'); } catch {}
  try { await database.execAsync('ALTER TABLE daily_entries ADD COLUMN saturated_fat REAL DEFAULT 0'); } catch {}
  try { await database.execAsync('ALTER TABLE daily_entries ADD COLUMN image_uri TEXT'); } catch {}
  try { await database.execAsync('ALTER TABLE ingredients ADD COLUMN sugar_per100g REAL DEFAULT 0'); } catch {}
  try { await database.execAsync('ALTER TABLE ingredients ADD COLUMN fiber_per100g REAL DEFAULT 0'); } catch {}
  try { await database.execAsync('ALTER TABLE ingredients ADD COLUMN sodium_per100g REAL DEFAULT 0'); } catch {}
  try { await database.execAsync('ALTER TABLE ingredients ADD COLUMN saturated_fat_per100g REAL DEFAULT 0'); } catch {}

  await database.execAsync(`

    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      aliases TEXT DEFAULT '[]',
      calories_per100g REAL NOT NULL,
      protein_per100g REAL NOT NULL,
      carbs_per100g REAL NOT NULL,
      fat_per100g REAL NOT NULL,
      sugar_per100g REAL DEFAULT 0,
      fiber_per100g REAL DEFAULT 0,
      sodium_per100g REAL DEFAULT 0,
      saturated_fat_per100g REAL DEFAULT 0
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS ingredients_fts USING fts5(
      name,
      aliases,
      content='ingredients',
      content_rowid='rowid'
    );

    CREATE TABLE IF NOT EXISTS indian_dishes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      servings TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recent_ingredients (
      ingredient_id TEXT PRIMARY KEY,
      used_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      items TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
}

export async function getTodayEntries(date: string): Promise<DailyEntry[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM daily_entries WHERE date = ? AND deleted = 0 ORDER BY timestamp ASC',
    [date]
  );
  return rows.map(rowToEntry);
}

export async function insertEntry(entry: DailyEntry): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO daily_entries
     (id, date, timestamp, source, label, calories, protein, carbs, fat, sugar, fiber, sodium, saturated_fat, image_uri, edited, synced, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      entry.id, entry.date, entry.timestamp, entry.source, entry.label,
      entry.calories, entry.protein, entry.carbs, entry.fat,
      entry.sugar ?? 0, entry.fiber ?? 0, entry.sodium ?? 0, entry.saturated_fat ?? 0,
      entry.image_uri ?? null,
      entry.edited ? 1 : 0, entry.synced ? 1 : 0,
    ]
  );
}

export async function updateEntry(id: string, updates: Partial<DailyEntry>): Promise<void> {
  const database = await getDatabase();
  const fields = Object.keys(updates)
    .filter((k) => k !== 'id')
    .map((k) => `${k} = ?`)
    .join(', ');
  const values = Object.keys(updates)
    .filter((k) => k !== 'id')
    .map((k) => (updates as any)[k]);
  await database.runAsync(
    `UPDATE daily_entries SET ${fields}, edited = 1 WHERE id = ?`,
    [...values, id]
  );
}

export async function softDeleteEntry(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE daily_entries SET deleted = 1, synced = 0 WHERE id = ?',
    [id]
  );
}

export async function getUnsyncedEntries(): Promise<DailyEntry[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM daily_entries WHERE synced = 0'
  );
  return rows.map(rowToEntry);
}

export async function markEntrySynced(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE daily_entries SET synced = 1 WHERE id = ?', [id]);
}

const DEFAULT_GOALS: import('../types').MacroGoals = {
  calories: 1800, protein: 120, carbs: 200, fat: 60,
  sugar: 50, fiber: 30, sodium: 2300, saturated_fat: 20,
};

export async function loadGoals(): Promise<import('../types').MacroGoals | null> {
  const raw = await getMetaValue('goals');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Merge with defaults so new fields (e.g. sugar) are always present
    return { ...DEFAULT_GOALS, ...parsed };
  } catch {
    return null;
  }
}

export async function saveGoals(goals: import('../types').MacroGoals): Promise<void> {
  await setMetaValue('goals', JSON.stringify(goals));
}

export async function getMetaValue(key: string): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setMetaValue(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    [key, value]
  );
}

export async function searchIngredients(query: string): Promise<import('../types').Ingredient[]> {
  const database = await getDatabase();
  const like = `%${query}%`;
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM ingredients WHERE name LIKE ? OR aliases LIKE ? ORDER BY name LIMIT 25`,
    [like, like]
  );
  return rows.map(rowToIngredient);
}

function rowToIngredient(row: any): import('../types').Ingredient {
  return {
    id: row.id,
    name: row.name,
    aliases: JSON.parse(row.aliases || '[]'),
    per100g: {
      calories: row.calories_per100g,
      protein: row.protein_per100g,
      carbs: row.carbs_per100g,
      fat: row.fat_per100g,
      sugar: row.sugar_per100g ?? 0,
      fiber: row.fiber_per100g ?? 0,
      sodium: row.sodium_per100g ?? 0,
      saturated_fat: row.saturated_fat_per100g ?? 0,
    },
  };
}

export async function recordIngredientUsed(ingredientId: string): Promise<void> {
  const database = await getDatabase();
  const now = Date.now();
  await database.runAsync(
    `INSERT INTO recent_ingredients (ingredient_id, used_at) VALUES (?, ?)
     ON CONFLICT(ingredient_id) DO UPDATE SET used_at = excluded.used_at`,
    [ingredientId, now]
  );
  // Keep only 10 most recent
  await database.runAsync(
    `DELETE FROM recent_ingredients WHERE ingredient_id NOT IN (
      SELECT ingredient_id FROM recent_ingredients ORDER BY used_at DESC LIMIT 10
    )`
  );
}

export async function getRecentIngredients(): Promise<import('../types').Ingredient[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    `SELECT i.* FROM ingredients i
     INNER JOIN recent_ingredients r ON i.id = r.ingredient_id
     ORDER BY r.used_at DESC LIMIT 10`
  );
  return rows.map(rowToIngredient);
}

export async function saveRecipe(name: string, items: import('../types').RecipeItem[]): Promise<void> {
  const database = await getDatabase();
  const id = `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await database.runAsync(
    `INSERT INTO recipes (id, name, items, created_at) VALUES (?, ?, ?, ?)`,
    [id, name, JSON.stringify(items), Date.now()]
  );
}

export async function getAllRecipes(): Promise<import('../types').SavedRecipe[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ id: string; name: string; items: string }>(
    'SELECT id, name, items FROM recipes ORDER BY created_at DESC'
  );
  return rows.map((r) => ({ id: r.id, name: r.name, items: JSON.parse(r.items) }));
}

export async function deleteRecipe(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM recipes WHERE id = ?', [id]);
}

function rowToEntry(row: any): DailyEntry {
  return {
    id: row.id,
    date: row.date,
    timestamp: row.timestamp,
    source: row.source,
    label: row.label,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    sugar: row.sugar ?? 0,
    fiber: row.fiber ?? 0,
    sodium: row.sodium ?? 0,
    saturated_fat: row.saturated_fat ?? 0,
    image_uri: row.image_uri ?? null,
    edited: row.edited === 1,
    synced: row.synced === 1,
  };
}
