# AI_RULES.md — Rules for AI Assistance in This Project

## Purpose
This file defines constraints and guidelines for any AI assistant (Claude or otherwise) helping build this project. Read this before generating any code or making architectural suggestions.

---

## Hard Rules — Never Violate These

### 1. No External AI APIs
Do not suggest, add, or use any external AI API (OpenAI, Gemini, Claude API, etc.) for any core feature. OCR must use on-device ML Kit only. Food estimation must use the local curated database only.

**Why**: Cost, latency, offline requirement, privacy.

### 2. No Barcode Scanning
The photo input is for nutrition label photos only. Do not add barcode scanning as a feature or suggest it as an "easier" alternative.

**Why**: Product decision. Label OCR is the chosen approach.

### 3. No Meal Timing Structure
Do not add breakfast / lunch / dinner / snack slots. The app tracks daily totals only. Entries are timestamped but not categorized by meal.

**Why**: Reduces friction, matches how users actually eat.

### 4. No Social or Gamification Features
No streaks, no badges, no sharing, no leaderboards, no friend comparisons. This is a private utility tool.

### 5. Core Must Work Offline
Never add a network call to the critical path (adding an entry, viewing totals, loading dish list). Network calls are only acceptable for optional features like backup/sync.

### 6. Do Not Over-Engineer the Indian Dish DB
The Indian dish database is intentionally approximate. Do not try to make it scientifically precise. Do not add per-ingredient breakdowns for each dish. Keep it as flat estimates per serving size. Users know they're getting an estimate.

---

## Style Rules for Code Generation

### TypeScript
- Always use TypeScript, never plain JavaScript
- Define types in `/src/types/` and import them — do not use `any`
- Use interfaces for data models, types for unions/primitives

### Component Structure
```
/src/components/ComponentName/
  index.tsx       — main component
  styles.ts       — if needed (prefer NativeWind classes inline)
  types.ts        — local types if needed
```

### Naming
- Components: PascalCase (`MacroBar`, `DishPicker`)
- Functions/variables: camelCase (`addEntry`, `todayTotals`)
- Constants: UPPER_SNAKE_CASE (`MAX_OIL_TBSP`)
- Files: kebab-case (`indian-dishes.json`, `macro-calculator.ts`)

### State
- Use Zustand for global state
- Keep component state local (useState) when it doesn't need to be shared
- Never use Redux or Context for this project

### Error Handling
- OCR failures must be handled gracefully — always allow manual fallback
- SQLite errors must not crash the app — show a friendly error and allow retry
- Never show raw error messages to users

---

## What AI Assistants Should Ask Before Generating Code

1. Does this require internet access? → If yes, reconsider or make it optional
2. Does this add complexity to the home screen? → If yes, reconsider
3. Does this change the three-input-mode model? → If yes, escalate to product decision
4. Is this in scope for Phase 1? (see BUILD_PLAN.md) → If not, note it and skip

---

## Estimating Indian Dish Macros — Guidelines for AI

When asked to add new dishes to the Indian dish database, use these principles:

**Authoritative sources (in order of preference):**
1. NIN (National Institute of Nutrition) Indian Food Composition Tables
2. ICMR Dietary Guidelines for Indians
3. USDA FoodData Central (for ingredients, not dishes)

**Never use:**
- Restaurant chain nutrition pages (not representative of home cooking)
- Random fitness blogs or recipe sites
- Invented or guessed values

**Estimation principles:**
- Base estimates on standard home-cooked versions, not restaurant versions
- Restaurant versions typically have 20–40% more fat (more oil/butter/cream)
- Use medium serving as the anchor (roughly what fits in a standard katori/bowl)
- Small = ~60% of medium, Large = ~160% of medium
- For breads: 1 unit = standard home-made size (roti ~30g, paratha ~60g)
- When in doubt, lean slightly high on fat and slightly conservative on protein

### Reference anchors (ICMR/NIN verified):
| Dish | Medium serving | Cal | Protein | Carbs | Fat |
|---|---|---|---|---|---|
| Plain roti (1 piece) | 30g | 90 | 3g | 18g | 1g |
| Dal tadka | 250ml bowl | 220 | 11g | 32g | 5g |
| Paneer tikka masala | 200g | 280 | 16g | 12g | 18g |
| Plain rice (cooked) | 150g | 195 | 4g | 43g | 0g |
| Chicken curry | 200g | 260 | 24g | 8g | 14g |
| Idli (1 piece) | 40g | 65 | 2g | 13g | 0g |
| Masala dosa | 1 piece | 280 | 6g | 45g | 9g |
