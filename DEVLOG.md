# DEVLOG.md — Development Log

Running log of every build session. Each entry = one commit or one meaningful step.
Format: date, what was done, what commit it maps to, any decisions made or blockers hit.

---

## How to Use This File

After every work session:
1. Add an entry at the top (newest first)
2. Note what was built, what decision was made, or what was figured out
3. Paste the git commit hash once committed
4. Note any open questions or next steps

This file is committed with every PR. It becomes the project memory.

---

## Log

---

### 2026-05-24 — Phase 2 complete: Ingredient Logger
**Commit**: `(uncommitted)`
**Phase**: Phase 2 — Ingredient Logger

**What was built**:
- `searchIngredients(query)` added to `database.ts` — LIKE query on name + aliases columns, returns up to 25 results
- `app/ingredients.tsx` fully rebuilt: search bar with 200ms debounce, results list, selected ingredients list, running macro totals, Add to Today button
- Oil/ghee/butter ingredients auto-default to 1 tbsp with a g/tbsp unit toggle (1 tbsp = 13.5g)
- Entry label auto-generated from ingredient names ("Rice, Dal, Ghee +2 more")
- Saved as source `'ingredient'` daily entry to SQLite + Zustand

**Decisions made**:
- Used simple LIKE query instead of FTS5 join — 100 rows makes FTS unnecessary, and avoids rowid join complexity
- Oil toggle switches between free-text grams and free-text tablespoons (not a fixed stepper) — more flexible for partial spoons
- Macros recomputed on every render from the selected list — no derived state caching needed at this scale

**Blockers / issues hit**:
- Several bundling errors before app launched: missing `react-native-reanimated` (NativeWind transitive dep) and duplicate `indian-dish` screen (both `app/indian-dish.tsx` redirect and `app/indian-dish/` directory registered same route name)
- Fixed by: `npx expo install react-native-reanimated`, adding `react-native-reanimated/plugin` to babel plugins, deleting `app/indian-dish.tsx`

**Next**:
- Phase 3: Photo Label Scan (expo-camera + ML Kit OCR + FSSAI label parser)
- OR Phase 4 subset: Goal setting screen + progress bars

---

### 2026-05-24 — Phase 1 complete: Indian Dish Estimator
**Commit**: `(see below)`
**Phase**: Phase 1 — Indian Dish Estimator

**What was built**:
- Supabase project connected: `.env` created by user, SQL tables run in Supabase dashboard — Phase 0 fully closed
- `src/utils/dishSearch.ts`: in-memory cache of all 50 dishes loaded once from SQLite; `filterDishes` (name/category/tag search) and `groupByCategory` helpers
- `app/indian-dish/index.tsx`: searchable, categorized SectionList of all 50 dishes with calorie range shown per row
- `app/indian-dish/[id].tsx`: serving size picker (radio-style), macro preview (read-only or editable via "Edit values"), "Add to Today" saves to SQLite + Zustand + navigates home
- `app/indian-dish/_layout.tsx`: nested Stack so index → detail has its own navigation stack
- Entry label: `"Dal Tadka — Medium bowl (250ml)"` format, source = `'indian_dish'`, `edited: true` if user changed any macro value
- `app/indian-dish.tsx` redirects to `/indian-dish/` so old direct links still resolve

**Decisions made**:
- Dishes loaded into memory once (only 50 items) and filtered client-side — avoids SQLite query on every keystroke
- Default serving = middle index (medium) rather than always the first — matches how people think ("give me a normal portion")
- `edited: true` flag is set automatically when user changes any macro value, so the entry is marked as approximate

**Next**:
- Phase 2: Ingredient Logger — SQLite FTS5 search, gram input, oil picker, running total, save as daily entry

---

### 2026-05-24 — Phase 0 complete: Foundation built
**Commit**: `0872e53`
**Phase**: Phase 0 — Foundation

**What was built**:
- Expo SDK 56 project initialized with TypeScript, expo-router (file-based navigation), NativeWind v4 + Tailwind CSS
- Zustand store: todayEntries, todayTotals, goals, addEntry/editEntry/deleteEntry actions
- expo-sqlite database with WAL mode, FTS5 virtual table for ingredient search, soft-delete pattern
- `indian_dishes.json`: 50 dishes across Dal, Sabzi, Rice, Bread, Street Food, Snacks, Proteins, Sweets, Beverages
- `ingredients.json`: 100 common Indian ingredients with macros per 100g (sourced from public nutritional data; schema ready for full 500-item set)
- Database seeder: seeds both JSON files into SQLite on first launch (version-gated with `app_meta` table)
- Supabase client with SecureStore adapter; env vars wired via `app.config.ts`
- Home screen: calorie/macro summary card + 3 input buttons (Scan / Indian Dish / Add Ingredients)
- Dashboard: macro progress bars (4 macros vs goals) + scrollable entry list with edit and delete
- Edit-entry screen: full field editing + delete with confirmation
- Auth screen: Google OAuth scaffold + Continue as Guest flow
- Placeholder screens for Phase 1–3 (Indian Dish, Ingredients, Scan Label)

**Decisions made**:
- Used `expo-router/entry` as the main entry point (replaces legacy `index.ts` approach)
- NativeWind v4 requires `jsxImportSource: 'nativewind'` in babel config and `withNativeWind` in metro config
- Ingredients JSON is ~100 items (not the full 500) — sufficient to validate the schema and seeding flow; full dataset sourced from USDA/NIN in a future pass
- Supabase tables are not yet created (SQL is in ARCHITECTURE.md) — waiting on user to create the Supabase project and provide credentials

**Blockers / issues hit**:
- `create-expo-app` refuses to init in a non-empty directory — worked around by creating in a temp `thaali/` subfolder and moving files up
- Dependency conflict between `react-native-url-polyfill` and `react-dom@19` — resolved with `--legacy-peer-deps`

**Next**:
- User creates Supabase project and adds `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `.env`
- Run SQL from ARCHITECTURE.md in Supabase SQL editor to create `daily_entries` and `user_goals` tables with RLS
- Start Phase 1: Indian Dish Estimator (searchable dish list, serving picker, log to dashboard)

---

### [DATE] — Project kickoff
**Commit**: `—`
**Phase**: Pre-build

**What happened**:
- Decided on app concept: Indian-first macro tracker
- Settled on three input modes: photo OCR, ingredient logger, Indian dish estimator
- Chose tech stack: Expo + React Native + TypeScript + SQLite + Supabase + ML Kit
- Decided against external AI APIs for OCR — ML Kit on-device only
- Decided on Supabase for multi-device sync (SQLite primary, Supabase sync layer)
- Confirmed data sources: USDA FoodData + NIN for ingredients, ICMR/NIN for dish estimates
- Platform target: Android + iPhone primary, iPad compatibility mode acceptable for v1.0

**Documents created**:
- CLAUDE.md
- PRD.md
- ARCHITECTURE.md
- AI_RULES.md
- BUILD_PLAN.md
- UX_FLOWS.md
- COST.md
- DEVLOG.md (this file)

**Next**: Start Phase 0 — project init and foundation setup

---

<!-- 
TEMPLATE — copy this block for each new entry, paste at top of Log section

---

### [DATE] — [short title]
**Commit**: `abc1234`
**Phase**: Phase X — [phase name]

**What was built**:
- 

**Decisions made**:
- 

**Blockers / issues hit**:
- 

**Next**:
- 

---
-->
