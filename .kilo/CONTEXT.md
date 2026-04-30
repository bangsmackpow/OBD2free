# OBD2Free — Context for Continuation

## Quick Start

1. **Read `NEXT_STEPS.md`** — Immediate actions
2. **Read `STOPPING_POINT.md`** — What was done, what's left
3. **Check CI**: `https://github.com/bangsmackpow/OBD2free/actions`

## Current State

### ✅ Working
- Full CI/CD pipeline passing (Tests, Android Build, iOS Build)
- Cloudflare Worker deployed with auth, sessions, admin, docs APIs
- D1 database migrated (users, sessions, devices, password_resets)
- R2 buckets created (logs + docs) with docs content uploaded
- JWT auth system (Web Crypto API, zero dependencies)
- Web dashboard with shadcn/ui, login/register, admin panel, datalog viewer
- Dark/light theme toggle
- APK release workflow on git tags

### 🔴 Needs Manual Setup
- **Keystore + GitHub Secrets** — generate, encode, add to repo
- **OBDLink LX** — purchase for BLE testing ($70)
- **Password reset emails** — connect SendGrid/Resend

### 🟡 Not Started
- Stripe payment integration
- Session comparison (web charts)
- GPS map view
- Mobile dashboard builder

## Architecture

```
Mobile App (RN) → BLE OBD2 Adapter → Local CSV + MMKV
              → Cloudflare Worker API → D1 (metadata) + R2 (CSV files)
Web Dashboard ← Cloudflare Worker API ← D1 + R2 + KV
```

### Key Files
| File | Purpose |
|------|---------|
| `cloudflare/worker/src/index.ts` | Worker entry point with route dispatching |
| `cloudflare/worker/src/routes/auth.ts` | Register, login, forgot/reset password |
| `cloudflare/worker/src/routes/admin.ts` | User CRUD, stats (admin only) |
| `cloudflare/worker/src/routes/sessions.ts` | Session CRUD, CSV download |
| `cloudflare/worker/src/routes/upload.ts` | CSV import (multipart + JSON) |
| `cloudflare/worker/src/utils/jwt.ts` | JWT create/verify via Web Crypto API |
| `cloudflare/worker/src/utils/password.ts` | PBKDF2 password hashing |
| `cloudflare/worker/migrations/0000_init.sql` | D1 schema (4 tables + indexes) |
| `web/src/App.tsx` | Web app entry with router |
| `web/src/hooks/use-auth.tsx` | Auth context (login, register, logout) |
| `web/src/layouts/RootLayout.tsx` | Sidebar nav + theme toggle |
| `.github/workflows/release.yml` | Signed APK release on git tag |

### Worker API Routes
```
POST /api/auth/register      POST /api/auth/login
POST /api/auth/forgot-password   POST /api/auth/reset-password
GET  /api/auth/me            POST /api/auth/refresh
GET  /api/sessions           POST /api/sessions
GET  /api/sessions/:id       DELETE /api/sessions/:id
GET  /api/sessions/:id/data  POST /api/upload
GET  /api/devices            POST /api/devices
GET  /api/admin/users        PUT  /api/admin/users/:id
GET  /api/admin/stats        GET  /api/docs/:slug
```

### Cloudflare Resources
| Resource | ID/Name |
|----------|---------|
| Account ID | `0e528c886015cce349076fb7db222a88` |
| D1 DB | `76271565-7abd-44af-b3cc-f34130f2a7e4` |
| R2 Logs | `obd2free-logs` |
| R2 Docs | `obd2free-docs` |
| KV Cache | `057d99c6087e49889cd9e57a66364401` |
| Worker | `obd2free-worker` at `obd2free-worker.curtislamasters.workers.dev` |

### Config Values
- Admin email: `admin@obd2free.com`
- Admin password: `changeme123` (**change immediately**)
- JWT secret: `change-me-in-production-obd2free-2024` (**change in production**)

## Commands

```bash
# CI status
gh run list --repo bangsmackpow/OBD2free --limit 5

# Deploy worker
cd cloudflare/worker && npm run deploy

# Build web
cd web && npm run build

# TM check
npm run typecheck && npm test && npm run lint
```

## Do NOT Change
- BLE singleton pattern (BleService)
- OBD2 PID parsing without validation data
- Cloudflare Workers architecture (it's the backend)
- JWT auth flow (it's zero-dependency and production-ready)

---

**Last Updated**: 2026-04-29
**Next Agent**: Read NEXT_STEPS.md → Execute release workflow → Purchase OBDLink LX → Test mobile app
