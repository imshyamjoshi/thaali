# UX_FLOWS.md — User Experience Flows

## Design Principles
- Every entry flow must complete in under 30 seconds
- No flow should require more than 4 taps for the happy path
- Always show a preview before saving
- Always allow editing after saving
- No dead ends — every error state has a way forward

---

## Flow 1 — Home Screen

```
┌─────────────────────────┐
│        Thaali           │
│                         │
│  Today: 1,240 / 1,800   │
│  ████████░░░░ kcal      │
│                         │
│  ┌───────┐ ┌─────────┐  │
│  │ 📷    │ │   🥘    │  │
│  │ Scan  │ │ Indian  │  │
│  │ Label │ │  Dish   │  │
│  └───────┘ └─────────┘  │
│                         │
│  ┌─────────────────────┐│
│  │  🧑‍🍳 Add Ingredients ││
│  └─────────────────────┘│
│                         │
│  [ View Today's Log ]   │
└─────────────────────────┘
```

**Notes:**
- Running calorie total always visible at top
- Three input modes clearly separated
- "View Today's Log" goes to dashboard

---

## Flow 2 — Photo Label Scan

```
Home Screen
  → Tap "Scan Label"
  → Camera opens (full screen)
  → User points at nutrition label
  → Tap capture button
  → [OCR processing — spinner, ~1-2 seconds]
  
  SUCCESS PATH:
  → Pre-filled form:
      Name: (editable, default = "Scanned item")
      Serving size: 30g  [editable]
      Servings eaten: 1  [stepper: 0.5 / 1 / 1.5 / 2]
      Calories: 148      [editable]
      Protein: 5g        [editable]
      Carbs: 22g         [editable]
      Fat: 4g            [editable]
  → Tap "Add to Today"
  → Confirmation animation
  → Back to Home Screen

  PARTIAL PARSE PATH (some fields missing):
  → Same form but missing fields highlighted in orange
  → "Some values couldn't be read — please fill in"
  → User fills blanks manually
  → Tap "Add to Today"

  FAIL PATH (OCR got nothing):
  → "Couldn't read the label. Try again or enter manually."
  → [Retry Camera] [Enter Manually]
  → "Enter Manually" opens blank form
```

**Key UX decisions:**
- Never discard OCR results even if partial — always show what was read
- Serving multiplier is the most important editable field (1 pack vs half a pack)
- Name defaults to "Scanned item" — user can rename it to "Protein bar" etc.

---

## Flow 3 — Indian Dish Estimator

```
Home Screen
  → Tap "Indian Dish"
  → Dish picker screen:
  
  ┌─────────────────────────┐
  │ 🔍 Search dishes...     │
  ├─────────────────────────┤
  │ Dal                     │
  │   Dal Tadka          >  │
  │   Dal Makhani        >  │
  │   Moong Dal          >  │
  │   Chana Dal          >  │
  ├─────────────────────────┤
  │ Sabzi                   │
  │   Paneer Tikka Masala > │
  │   Aloo Gobi          >  │
  │   Palak Paneer       >  │
  └─────────────────────────┘

  → Tap a dish (e.g. "Dal Tadka")
  → Serving picker:
  
  ┌─────────────────────────┐
  │ Dal Tadka               │
  │                         │
  │ ○ Small bowl  150 kcal  │
  │ ● Medium bowl 220 kcal  │
  │ ○ Large bowl  360 kcal  │
  │                         │
  │ P: 11g  C: 32g  F: 5g   │
  │                         │
  │ [Edit values]           │
  │                         │
  │ [Add to Today]          │
  └─────────────────────────┘

  → Tap "Add to Today"
  → Confirmation animation
  → Back to Home Screen

  EDIT PATH:
  → Tap "Edit values"
  → All four macro fields become editable
  → User changes what they want
  → Tap "Add to Today"
```

**Key UX decisions:**
- Search works across dish names and categories
- Macros shown before confirming — no surprises
- "Edit values" escape hatch for when the estimate feels wrong
- No mandatory editing — happy path is 3 taps

---

## Flow 4 — Ingredient Logger

```
Home Screen
  → Tap "Add Ingredients"
  → Ingredient builder screen:

  ┌─────────────────────────┐
  │ 🔍 Search ingredient... │
  │                         │
  │ Added so far:           │
  │  Paneer    200g  → 280cal│
  │  Onion      80g  →  32cal│
  │  Tomato     60g  →  12cal│
  │  Oil       1 tbsp→ 120cal│
  │             ──────────  │
  │             Total: 444  │
  │             P:18 C:14 F:│
  │                         │
  │ [Save as "Home Meal"]   │
  └─────────────────────────┘

  → Search "paneer"
  → Tap result
  → Weight input: [200] g  (number keyboard)
  → Tap "Add"
  → Returns to builder with paneer added

  OIL QUICK-ADD:
  → Tap "Add Oil"
  → Bottom sheet: 
    [0] [½] [1] [1½] [2] tbsp
  → Tap amount
  → Oil added to list

  SAVE:
  → Tap "Save as..."
  → Name field (e.g. "Paneer Tikka Masala")
  → Tap "Add to Today"
  → Entry saved as single item with combined macros
```

**Key UX decisions:**
- Oil is a separate quick-add, not part of ingredient search (too many oil types)
- Running total always visible as ingredients are added
- Save as a single named entry — not individual ingredients — in the daily log
- No mandatory naming — can save as "Home Meal" default

---

## Flow 5 — End of Day Log / Dashboard

```
┌─────────────────────────┐
│ Today — May 24          │
│                         │
│ Calories  1,440 / 1,800 │
│ ████████████░░░░        │
│ Protein     82 / 120g   │
│ █████████░░░░░░         │
│ Carbs      180 / 200g   │
│ █████████████████░░     │
│ Fat         48 / 60g    │
│ ████████████████░       │
│                         │
├─────────────────────────┤
│ 8:32am  Dal Tadka       │
│         Medium bowl     │
│         220 cal  P:11   │
│                    [✏️] │
├─────────────────────────┤
│ 1:15pm  Protein Bar     │
│         (scanned)       │
│         148 cal  P:5    │
│                    [✏️] │
├─────────────────────────┤
│ 3:40pm  Paneer Tikka    │
│         Masala (home)   │
│         444 cal  P:18   │
│                    [✏️] │
└─────────────────────────┘
```

**Interactions:**
- Tap ✏️ → edit entry (all fields editable)
- Swipe left → delete entry (with confirmation)
- Tap entry row → expand to show full macros
- Pull down to refresh (recalculates totals)

---

## Flow 6 — Edit Entry

```
→ Tap ✏️ on any entry
→ Edit sheet slides up:

  ┌─────────────────────────┐
  │ Edit Entry              │
  │                         │
  │ Name: [Dal Tadka      ] │
  │                         │
  │ Calories: [220        ] │
  │ Protein:  [11         ] g│
  │ Carbs:    [32         ] g│
  │ Fat:      [5          ] g│
  │                         │
  │ [Delete Entry]          │
  │ [Save Changes]          │
  └─────────────────────────┘
```

Simple, flat edit form. No complexity. All fields editable. This is the "correct everything" escape hatch.

---

## Error States

| Situation | What user sees |
|---|---|
| OCR reads nothing | "Couldn't read label. Try better lighting or enter manually." |
| OCR reads partial | Orange highlight on missing fields with prompt to fill |
| Ingredient not found | "Not found. Add manually?" → opens blank entry |
| SQLite load fails | "Loading food data..." retry spinner |
| Day log won't save | Toast: "Couldn't save. Tap to retry." |
