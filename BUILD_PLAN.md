# BUILD_PLAN.md — Phased Build Plan

## Philosophy
Build the smallest working version first. Each phase must be independently usable. No phase should depend on a future phase being complete.

---

## Phase 0 — Foundation (Week 1)
*Goal: Project runs on device with navigation and data layer wired up*

### Tasks
- [x] Init Expo project with TypeScript
- [x] Set up Expo Router (file-based navigation)
- [x] Install and configure NativeWind
- [x] Set up Zustand store with basic DailyEntry model
- [x] Set up expo-sqlite (primary data store)
- [x] Set up Supabase project + configure anon key in env (env vars wired; user must create project)
- [x] Set up Supabase Auth (Google + Apple sign-in) (client configured; OAuth provider setup needed in Supabase dashboard)
- [x] Build auth screen (sign in / continue as guest)
- [x] Create Supabase tables (daily_entries, user_goals) with RLS policies
- [x] Bundle ingredient JSON (~100 items starter, schema ready for 500) and seed SQLite on first launch
- [x] Bundle indian_dishes.json (50 dishes across 9 categories) and seed SQLite on first launch
- [x] Build home screen shell (3 buttons: Photo / Ingredient / Indian Dish)
- [x] Build basic end-of-day dashboard (list of entries + totals bar)

### Deliverable
App opens, shows home screen, shows empty dashboard. No entries yet.

---

## Phase 1 — Indian Dish Estimator (Week 2)
*Goal: Users can log Indian meals. This is the fastest path to daily usability.*

### Tasks
- [x] Build dish picker screen (searchable list, categorized)
- [x] Build serving size selector (small / medium / large or unit count)
- [x] Show macro preview before confirming
- [x] Save entry to daily log
- [x] Display entry in dashboard
- [x] Allow edit and delete from dashboard
- [x] Populate full indian_dishes.json with 50 dishes across all categories

### Deliverable
User can log "Dal Tadka, medium bowl" and see it reflected in daily totals. Can edit it. This alone is usable.

---

## Phase 2 — Ingredient Logger (Week 3)
*Goal: Home cooking is fully trackable*

### Tasks
- [x] Build ingredient search screen (SQLite full-text search)
- [x] Gram input field per ingredient
- [x] Oil quick-add picker (tbsp toggle — free-text input with g/tbsp unit switch)
- [x] Running macro total as ingredients are added
- [x] Save as daily entry with combined label ("Rice, Dal, Ghee +2 more")
- [ ] Optional: Save as named dish for reuse later

### Deliverable
User can log a home-cooked meal by its ingredients. Macros calculated automatically.

---

## Phase 3 — Photo Label Scan (Week 4)
*Goal: Packaged food logging is frictionless*

### Tasks
- [ ] Integrate react-native-mlkit (text recognition)
- [ ] Build camera screen (expo-camera)
- [ ] Build OCR parser (regex-based, FSSAI label format)
- [ ] Pre-fill macro form from parsed result
- [ ] Show confidence indicator (all fields filled vs partial)
- [ ] Manual fallback if OCR fails
- [ ] Serving size multiplier (e.g. "I ate 1.5 servings")

### Deliverable
User takes photo of protein bar label, macros auto-fill, they confirm and log it.

---

## Phase 4 — Sync & Polish (Week 5)
*Goal: Multi-device sync works + app feels complete for daily use*

### Tasks
- [ ] Implement background sync: SQLite → Supabase after every write
- [ ] Implement pull on login: Supabase → SQLite on new device
- [ ] Sync indicator in UI (subtle, non-blocking)
- [ ] Handle offline gracefully — queue unsynced entries, retry on reconnect
- [ ] Goal setting screen (daily cal / protein / carbs / fat targets)
- [ ] Sync goals to Supabase user_goals table
- [ ] Progress bars in dashboard (goal vs actual)
- [ ] History view (past 7 days)
- [ ] Empty state design for first-time users
- [ ] Onboarding flow (sign in + set goals on first launch)
- [ ] App icon and splash screen
- [ ] Performance audit (SQLite query times, OCR speed, sync latency)

### Deliverable
Fully polished v1.0. Log on phone, open on tablet — data is there.

---

## Phase 5 — Future (Post v1.0)
*Not in scope for initial build — document here to avoid scope creep*

- Weekly macro trends chart
- Custom dish saving and sharing across users
- Wearable sync (Apple Health, Google Fit)
- Export data as CSV
- Water intake tracking

---

## Definition of Done (for each feature)
- Works on iOS and Android
- Works fully offline
- No unhandled crashes
- Entry appears correctly in dashboard
- Entry is editable and deletable
- Data persists across app restarts
