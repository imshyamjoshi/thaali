# CLAUDE.md — Project Context for AI Assistance

## What This Project Is
A mobile-first macro tracking app designed for Indian users. It solves the real problem of tracking nutrition across three very different food contexts: home-cooked Indian meals, packaged products, and restaurant/readymade food.

## Core Philosophy
- **Pragmatic accuracy over perfect precision** — estimates are okay, logging should be fast
- **Indian food first** — not an afterthought, the primary use case
- **Three input modes** — photo OCR for labels, ingredient logging for home cooking, dish estimator for eating out
- **End-of-day editing** — users can always correct entries before finalizing

## Tech Stack
- **Frontend**: React Native (iOS + Android)
- **OCR**: On-device OCR library (e.g. ML Kit for React Native) — no external AI API
- **Database**: Local SQLite for food/ingredient data, AsyncStorage for daily logs
- **Backend**: Minimal — optional sync only, core works fully offline
- **Indian dish database**: Curated static JSON of ~50 common dishes with macro estimates

## What Claude Should Always Remember
1. No external AI APIs for OCR — use on-device libraries only
2. Oil and water are separate fields in home cooking — oil matters, water doesn't
3. All entries are editable at end of day
4. Indian meal estimates are intentionally approximate — do not over-engineer them
5. The app must work offline — no network dependency for core features
6. Portion sizes for Indian dishes must be flexible (e.g. number of rotis, bowl size)

## What Claude Should Never Do
- Suggest adding a food social feed or gamification
- Add barcode scanning as a primary feature (OCR label photo is the approach)
- Over-complicate the home screen — it must stay as 3 simple input buttons
- Add meal timing / breakfast-lunch-dinner structure (we track totals, not meals)
- Recommend Firebase or any always-online architecture for core tracking

## Folder Naming Conventions
- `/src/screens/` — app screens
- `/src/components/` — reusable UI components
- `/src/data/` — static JSON databases (ingredients, Indian dishes)
- `/src/utils/` — OCR parsing, macro calculation helpers
- `/src/store/` — local state and daily log management
