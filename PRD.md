# PRD.md — Product Requirements Document

## Product Name
**Thaali** *(working title)* — A practical macro tracker for Indian eating habits

## Problem Statement
Existing macro tracking apps (MyFitnessPal, Cronometer) are built around Western food databases and assume users either weigh every ingredient or eat packaged food with labels. Indian home cooking doesn't work this way. Users cook in bulk, use masalas in small quantities, eat dishes with no standardized recipe, and frequently eat out at local restaurants with no nutrition data online. The result: Indian users either give up on tracking or use highly inaccurate workarounds.

## Target Users
- Indians aged 18–35 with fitness or weight goals
- Mix of home cooking and eating out
- Not professional athletes — everyday people trying to be roughly aware of their nutrition
- Comfortable with smartphones, not necessarily tech-savvy

## Goals
1. Make logging fast enough that users actually do it every day
2. Cover the three real food contexts Indian users face
3. Give a useful end-of-day macro summary without requiring perfect data
4. Allow corrections — users are trusted to edit their own entries

## Non-Goals
- Calorie-perfect accuracy (not possible for home cooking or restaurants)
- Social features
- Meal planning or recipe suggestions
- Integration with fitness wearables (Phase 1)
- Micronutrient tracking (Phase 1)

---

## Platform Support

### v1.0 — Primary
| Platform | Support |
|---|---|
| Android phone | Full — primary target |
| iPhone | Full — primary target |

### v1.0 — Secondary (best effort)
| Platform | Support |
|---|---|
| iPad | Installs and works via iPhone compatibility mode. UI will be phone-sized, not adapted for large screen. Won't crash, won't look native. |
| Android tablet | Same as iPad — functional but not optimised. |

### Post v1.0
Proper responsive layouts for iPad and Android tablet if user demand justifies it. Would require breakpoint-aware layouts (sidebar + main panel) rather than single-column phone design.

### Why phone-first
The core use case — logging food while cooking or eating — is a phone behaviour. Users are unlikely to carry a tablet to the kitchen or restaurant. Sync via Supabase means data logged on phone is visible on iPad anyway, so tablet becomes a passive viewing device if needed.

---

## Core Features

### F1 — Photo Label Scan
**Description**: User takes a photo of a packaged food nutrition label. On-device OCR reads the label and auto-fills macros (calories, protein, carbs, fat). User confirms and can edit before saving.

**Acceptance Criteria**:
- Works on standard Indian packaged food label formats (FSSAI compliant)
- Handles angled / slightly blurry photos reasonably
- Parsed values are editable before saving
- Serving size is extracted and shown; user can adjust multiplier

**Priority**: P0

---

### F2 — Ingredient Logger (Home Cooking)
**Description**: User adds ingredients by name and weight (grams). App looks up macros from a local ingredient database and calculates totals. Oil has a dedicated quick-add field (tablespoon picker). Water is ignored.

**Acceptance Criteria**:
- Search ingredient by name (local DB, no internet required)
- Weight input in grams
- Oil field: 0 / 0.5 / 1 / 1.5 / 2 tablespoon picker (converts to grams internally)
- Running total updates as ingredients are added
- Can save as a named dish for reuse

**Priority**: P0

---

### F3 — Indian Dish Estimator
**Description**: Curated list of ~50 common Indian dishes with pre-set macro estimates per standard serving. User picks a dish, picks a serving size (small / medium / large or unit count for items like roti), and logs it.

**Acceptance Criteria**:
- Covers major categories: dal, sabzi, rice dishes, breads, snacks, street food, sweets
- Three serving size options at minimum per dish
- Macros shown before confirming
- User can override any macro value before saving

**Priority**: P0

---

### F4 — End of Day Dashboard
**Description**: Running total of macros for the current day. Each entry is listed and editable. User can delete or modify any entry. Summary bar shows progress toward protein / carb / fat / calorie goals.

**Acceptance Criteria**:
- Shows all entries for the day in chronological order
- Tap any entry to edit it
- Swipe to delete
- Goal vs actual shown for all four macros
- Goals are set once in settings

**Priority**: P0

---

### F5 — Goal Setting
**Description**: One-time setup where user enters their daily macro targets. Can be edited any time in settings.

**Acceptance Criteria**:
- Fields: daily calories, protein (g), carbs (g), fat (g)
- Optional: bodyweight input to auto-suggest targets (simple formula, not medical advice)
- Stored locally

**Priority**: P1

---

### F6 — History View
**Description**: Past days' summaries. Tap a day to see all entries.

**Priority**: P2

---

## Data Sources

### Raw Ingredients
**Source: USDA FoodData Central + NIN Indian Food Composition Tables**
- USDA FoodData is free, public domain, well-maintained, covers global ingredients
- NIN (National Institute of Nutrition, Hyderabad) publishes India-specific food composition data covering regional ingredients, dals, flours, spices
- Both are downloaded once, cleaned, merged, and bundled as a static SQLite file with the app
- No API calls — fully offline
- Target: ~500 most common ingredients covering everyday Indian cooking

**Why not Open Food Facts?**
Requires internet, data quality is inconsistent for Indian ingredients, community-maintained so values can be wrong or missing.

### Indian Dish Estimates
**Source: ICMR-NIN Dietary Guidelines + manual research**
- ICMR (Indian Council of Medical Research) publishes nutritional guidelines with food composition data
- NIN food tables used as the primary reference for per-dish estimates
- Each dish estimate is hand-verified against multiple sources before being added
- Estimates reflect standard home-cooked portions, not restaurant versions
- ~50 dishes covering the most common categories

### Packaged Food
**Source: The product label itself (via OCR)**
- No database needed
- User photographs the nutrition label
- On-device ML Kit reads the values directly
- Most accurate source possible — straight from the manufacturer

### Summary
| Food type | Data source | Internet required |
|---|---|---|
| Raw ingredients | USDA + NIN (bundled) | No |
| Indian dishes | ICMR/NIN research (bundled) | No |
| Packaged food | Label OCR (on-device) | No |
| Restaurant / readymade | User estimate | No |

### DailyEntry
```
{
  id: string,
  date: string (YYYY-MM-DD),
  timestamp: number,
  source: 'ocr' | 'ingredient' | 'indian_dish' | 'manual',
  label: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  edited: boolean
}
```

### IndianDish
```
{
  id: string,
  name: string,
  category: string,
  servings: [
    { label: 'small' | 'medium' | 'large' | '1 piece' | ..., calories, protein, carbs, fat }
  ]
}
```

### Ingredient
```
{
  id: string,
  name: string,
  aliases: string[],
  per100g: { calories, protein, carbs, fat }
}
```
