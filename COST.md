# COST.md — Cost Analysis

## Philosophy
This app is intentionally designed to have near-zero running costs. All core features are offline-first. There is no backend to maintain, no API bills, no database servers.

---

## Development Costs

### Tools & Services
| Item | Cost | Notes |
|---|---|---|
| Expo account | Free | Expo Go for development, EAS for builds |
| EAS Build (Expo) | Free tier: 30 builds/month | Enough for development phase |
| Apple Developer Account | $99/year | Required for iOS TestFlight + App Store |
| Google Play Developer Account | $25 one-time | Required for Android Play Store |
| **Total setup cost** | **~$124** | First year |

### Development Time (estimated)
| Phase | Estimated time |
|---|---|
| Phase 0 — Foundation | 1 week |
| Phase 1 — Indian Dish Estimator | 1 week |
| Phase 2 — Ingredient Logger | 1 week |
| Phase 3 — Photo Label Scan | 1 week |
| Phase 4 — Polish & Goals | 1 week |
| **Total** | **~5 weeks** |

---

## Running Costs (Per Month)

### v1.0 with Supabase Free Tier — ₹0/month
Supabase free tier is generous enough for personal use and early users:
- 500MB database storage
- 50,000 monthly active users
- 2GB bandwidth
- Auth included

For a personal app or small early user base, this is more than enough. No cost until you scale.

### When Free Tier Runs Out (Supabase Pro)
| Service | Cost |
|---|---|
| Supabase Pro | $25/month (~₹2,100) |
| Includes: 8GB DB, 250GB bandwidth, daily backups | |

This threshold is only reached at meaningful scale — thousands of active users.

---

## Monetization Options (Future)

| Model | Notes |
|---|---|
| Free forever | Build audience, no revenue |
| One-time purchase | ₹199–499 on App Store / Play Store |
| Freemium | Core free, history/export as paid |
| No ads | Explicitly out of scope — see CLAUDE.md |

**Recommendation for v1.0**: Release free, gather feedback, decide on monetization after validating the app has real users.

---

## Cost Comparison vs Alternatives

| Approach | Monthly cost |
|---|---|
| **This app (SQLite + Supabase free tier)** | **₹0** |
| Using OpenAI Vision API for OCR | ~$0.01 per photo scan |
| Using a food DB API (Nutritionix, Edamam) | $0–$50/month depending on calls |
| Maintaining a custom backend server | $5–$20/month |
| Firebase instead of Supabase | Free tier similar, then pay-as-you-go |

On-device ML Kit + bundled food DB + Supabase free tier = zero running cost for v1.0.

---

## If the App Scales

At 10,000 active users, with optional cloud sync enabled:

| Item | Cost |
|---|---|
| Supabase Pro | $25/month |
| Cloudflare R2 (backups) | ~$1/month |
| EAS Build (more builds) | $29/month |
| **Total** | **~$55/month (~₹4,500/month)** |

This is very manageable and would be covered by even modest one-time purchase revenue from a fraction of users.

---

## Summary

| Scenario | Cost |
|---|---|
| Building v1.0 | ~₹10,000 (Apple dev account + time) |
| Running v1.0 (Supabase free tier) | ₹0/month |
| Running at scale (Supabase Pro, thousands of users) | ~₹2,100/month |
| If AI APIs were used instead of on-device OCR | Would add ₹500–5,000/month at scale |

**The architectural choice to use on-device ML Kit + Supabase free tier keeps v1.0 costs at zero while still delivering multi-device sync.**
