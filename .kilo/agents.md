# OBD2Free — Agent Handoff

## Project
Cross-platform OBD2 datalogger: React Native mobile app + Cloudflare API + Web dashboard.

## Current State (2026-04-29)

### ✅ Completed
- Full CI/CD pipeline (Tests, Android, iOS) — **all passing**
- Cloudflare Worker deployed with JWT auth, sessions, admin, docs APIs
- D1 database (4 tables: users, sessions, devices, password_resets)
- R2 buckets (obd2free-logs, obd2free-docs) with docs content uploaded
- Web dashboard with shadcn/ui: auth, dashboard, sessions list, datalog viewer, admin panel, settings, docs viewer
- Dark/light theme toggle
- APK release workflow on git tags
- Complete documentation (6 pages in R2 as markdown)

### 🔴 Blockers (User Must Do)
1. **Generate release keystore**: `keytool -genkeypair -v -keystore obd2free-release.keystore -alias obd2free -keyalg RSA -keysize 2048 -validity 10000`
2. **Add GitHub Secrets**: REPO_KEYSTORE, REPO_KEYSTORE_PASS, REPO_KEY_ALIAS, REPO_KEY_PASS
3. **Purchase OBDLink LX ($70)** for BLE connection testing
4. **Change admin password** from `changeme123`

### 🟡 Phase 3 Features (Not Started)
- Stripe payment integration
- Session comparison (overlay trips on web charts)
- GPS map view on session detail
- Push notifications
- Mobile dashboard builder

## Architecture Decisions (Sacrosanct)
- **BLE**: react-native-ble-plx v3.5.1 singleton pattern
- **Auth**: JWT via Web Crypto API (zero npm dependencies)
- **Password hashing**: PBKDF2 (100k iterations, SHA-256)
- **Storage**: MMKV (local), R2 (cloud, CSV format)
- **Backend**: Cloudflare Workers (no servers)
- **Web**: Vite + React + shadcn/ui + Tailwind
- **Polling**: 10Hz default, 50ms min command spacing

## Key Files
| File | Lines | Purpose |
|------|-------|---------|
| `cloudflare/worker/src/index.ts` | ~80 | Worker entry, route dispatch |
| `cloudflare/worker/src/routes/auth.ts` | ~180 | Register, login, forgot/reset |
| `cloudflare/worker/src/routes/admin.ts` | ~200 | User CRUD, stats |
| `cloudflare/worker/src/routes/sessions.ts` | ~160 | Session CRUD, CSV download |
| `cloudflare/worker/src/routes/upload.ts` | ~130 | CSV import |
| `cloudflare/worker/src/utils/jwt.ts` | ~60 | JWT create/verify |
| `cloudflare/worker/src/utils/password.ts` | ~70 | PBKDF2 hash/verify |
| `cloudflare/worker/migrations/0000_init.sql` | ~60 | D1 schema |
| `web/src/App.tsx` | ~80 | Router setup |
| `web/src/hooks/use-auth.tsx` | ~115 | Auth context |
| `web/src/layouts/RootLayout.tsx` | ~130 | Sidebar nav + theme toggle |
| `.github/workflows/release.yml` | ~55 | Signed APK release |

## Infrastructure
- **Account**: curtislamasters@gmail.com (CF acct ID: `0e528c886015cce349076fb7db222a88`)
- **D1 db**: `76271565-7abd-44af-b3cc-f34130f2a7e4`
- **R2 logs**: `obd2free-logs`
- **R2 docs**: `obd2free-docs`
- **KV**: `057d99c6087e49889cd9e57a66364401`
- **Worker**: `obd2free-worker.curtislamasters.workers.dev`
- **Admin**: admin@obd2free.com / changeme123

## Commands
```bash
# Deploy worker
cd cloudflare/worker && npm run deploy

# Check CI
gh run list --repo bangsmackpow/OBD2free --limit 3

# Release
npm run release

# Local web
cd web && npm run dev
```

## Continuation Checklist
- [ ] Read `NEXT_STEPS.md`
- [ ] Generate keystore + add GitHub secrets
- [ ] Push a tag to trigger release
- [ ] Deploy web to Cloudflare Pages
- [ ] Purchase OBDLink LX
- [ ] Test mobile app on device
- [ ] Connect Resend/SendGrid for emails
- [ ] Implement Stripe integration

**Ready for continuation.**
