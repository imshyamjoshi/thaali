# ARCHITECTURE.md — Technical Architecture

## Overview
Offline-first React Native app. All core features work without internet. SQLite is the primary data store on device — fast, always available. Supabase is the sync layer — data pushed to Supabase in the background when online, pulled on new device login. Core tracking never waits on the network.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React Native (Expo) | Cross-platform, fast iteration, good library ecosystem |
| Language | TypeScript | Type safety for data models |
| Local DB | SQLite via expo-sqlite | Primary data store — fast, works offline |
| Sync DB | Supabase (Postgres) | Multi-device sync, auth, free tier sufficient |
| Auth | Supabase Auth | Google / Apple sign-in, ties data to user identity |
| State | Zustand | Lightweight, no boilerplate |
| OCR | ML Kit Text Recognition (via react-native-mlkit) | On-device, no API calls, works offline |
| Navigation | Expo Router | File-based, simple |
| Storage | AsyncStorage | Settings, sync metadata |
| Styling | NativeWind (Tailwind for RN) | Fast UI development |

---

## System Diagram

```
┌─────────────────────────────────────────┐
│              React Native App            │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │  Photo   │  │Ingredient│  │Indian │ │
│  │  Scan    │  │  Logger  │  │ Dish  │ │
│  └────┬─────┘  └────┬─────┘  └───┬───┘ │
│       │              │             │     │
│  ┌────▼─────┐  ┌────▼─────┐       │     │
│  │ ML Kit   │  │ SQLite   │◄──────┘     │
│  │   OCR    │  │(primary) │             │
│  │ (local)  │  │          │             │
│  └────┬─────┘  └────┬─────┘             │
│       │              │                  │
│  ┌────▼─────────────────────────────┐   │
│  │         Zustand Store            │   │
│  │    (daily log, running totals)   │   │
│  └────────────────┬─────────────────┘   │
└───────────────────┼─────────────────────┘
                    │ background sync
                    │ (when online)
          ┌─────────▼──────────┐
          │      Supabase      │
          │  ┌──────────────┐  │
          │  │  Postgres DB │  │
          │  │ (daily_logs) │  │
          │  └──────────────┘  │
          │  ┌──────────────┐  │
          │  │     Auth     │  │
          │  │(Google/Apple)│  │
          │  └──────────────┘  │
          └────────────────────┘
```

---

## Data Layer

### SQLite (Primary — On Device)
The primary store for all user data. Reads and writes always hit SQLite first. Never waits on network.

**Tables:**
- `ingredients` — ~500 common Indian + general ingredients with macros per 100g (read-only, bundled, sourced from USDA FoodData + NIN Indian food composition tables)
- `indian_dishes` — ~50 dishes with serving size options (read-only, bundled, hand-researched from ICMR/NIN data)
- `daily_entries` — user's log entries (read-write, synced to Supabase)

**Why SQLite as primary over Supabase directly?**
App works fully offline. Logging a meal should never require a network call. SQLite is the source of truth on device; Supabase is the source of truth across devices.

### Supabase (Sync Layer — Cloud)
Used for multi-device sync and auth. Data flows: SQLite → Supabase (push after write), Supabase → SQLite (pull on login or new device).

**Tables in Supabase Postgres:**
```sql
-- One row per log entry, tied to a user
create table daily_entries (
  id uuid primary key,
  user_id uuid references auth.users not null,
  date date not null,
  timestamp bigint not null,
  source text not null, -- 'ocr' | 'ingredient' | 'indian_dish' | 'manual'
  label text not null,
  calories numeric not null,
  protein numeric not null,
  carbs numeric not null,
  fat numeric not null,
  edited boolean default false,
  deleted boolean default false, -- soft delete for sync
  synced_at timestamptz default now()
);

-- Row-level security: users can only see their own data
alter table daily_entries enable row level security;
create policy "Users see own entries"
  on daily_entries for all
  using (auth.uid() = user_id);
```

**User goals stored in Supabase too:**
```sql
create table user_goals (
  user_id uuid references auth.users primary key,
  calories numeric,
  protein numeric,
  carbs numeric,
  fat numeric,
  updated_at timestamptz default now()
);
```

### Sync Strategy

```
WRITE:
  User adds entry
    → Write to SQLite immediately (instant)
    → Mark entry as unsynced
    → Push to Supabase in background (best effort)
    → On success: mark as synced

READ on new device / login:
    → Fetch all entries from Supabase for user
    → Write to local SQLite
    → App is ready

CONFLICT RESOLUTION:
    → Last-write-wins based on timestamp
    → Deleted entries use soft delete (deleted: true) so sync propagates deletions
    → Edits carry original entry id — Supabase upserts on id
```

### AsyncStorage
Used only for:
- Auth session token (Supabase manages this via its own storage)
- Last sync timestamp (`last_synced_at`)
- App settings that don't need sync (e.g. local display preferences)

---

## OCR Pipeline

```
User taps "Photo" 
  → Camera opens (expo-camera)
  → Photo captured
  → ML Kit Text Recognition runs on-device
  → Raw text returned
  → Parser (regex + heuristics) extracts:
      - Serving size
      - Calories per serving
      - Protein per serving
      - Carbohydrates per serving
      - Fat per serving
  → Pre-filled form shown to user
  → User edits if needed
  → Entry saved to daily log
```

### OCR Parser Rules
Indian packaged food labels follow FSSAI format. Key patterns:
- "Energy ... kcal" or "Calories ... kcal"
- "Protein ... g"
- "Total Carbohydrate ... g" or "Carbohydrates ... g"
- "Total Fat ... g"
- "Serving size ... g" or "Per ... g"

Parser uses regex with fallbacks. If extraction fails or confidence is low, all fields are left blank for manual entry with a warning shown.

---

## Indian Dish Database

Stored as a bundled JSON file at `/src/data/indian_dishes.json`. Loaded into SQLite on first launch.

### Structure
```json
[
  {
    "id": "dal_tadka",
    "name": "Dal Tadka",
    "category": "Dal",
    "tags": ["vegetarian", "protein", "north-indian"],
    "servings": [
      { "label": "Small bowl (150ml)", "calories": 150, "protein": 7, "carbs": 22, "fat": 3 },
      { "label": "Medium bowl (250ml)", "calories": 220, "protein": 11, "carbs": 32, "fat": 5 },
      { "label": "Large bowl (400ml)", "calories": 360, "protein": 18, "carbs": 52, "fat": 8 }
    ]
  }
]
```

### Categories to cover
- Dal (dal tadka, dal makhani, chana dal, moong dal)
- Sabzi (paneer tikka masala, aloo gobi, bhindi, palak paneer)
- Rice dishes (plain rice, jeera rice, biryani, khichdi, pulao)
- Breads (roti, paratha, puri, naan, bhatura)
- Street food (pav bhaji, chole bhature, samosa, vada pav)
- Snacks (poha, upma, idli, dosa, uttapam)
- Sweets (kheer, gulab jamun, ladoo)
- Proteins (egg curry, chicken curry, dal)
- Beverages (chai with milk, lassi, buttermilk)

---

## State Management (Zustand)

```typescript
interface AppStore {
  // Today's log
  todayEntries: DailyEntry[]
  addEntry: (entry: DailyEntry) => void
  editEntry: (id: string, updates: Partial<DailyEntry>) => void
  deleteEntry: (id: string) => void

  // Totals (derived)
  todayTotals: MacroTotals

  // Goals
  goals: MacroGoals
  setGoals: (goals: MacroGoals) => void

  // Auth
  user: SupabaseUser | null
  setUser: (user: SupabaseUser | null) => void

  // Sync
  syncStatus: 'idle' | 'syncing' | 'error'
  lastSyncedAt: number | null
  syncToSupabase: () => Promise<void>
  pullFromSupabase: () => Promise<void>

  // Persistence
  loadTodayFromSQLite: () => Promise<void>
  saveTodayToSQLite: () => Promise<void>
}
```

---

## Offline Strategy
- All features work without internet connection
- SQLite is always the primary read/write target — zero latency
- Supabase sync runs in background after writes — non-blocking
- Unsynced entries are marked locally and retried when connection returns
- On new device login: full pull from Supabase → seed local SQLite
- Ingredient DB and Indian dish DB are bundled with the app (never synced, same for all users)
- Conflict resolution: last-write-wins by timestamp; deletions use soft delete
