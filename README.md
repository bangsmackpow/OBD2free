# OBD2Free

**Cross-platform OBD2 datalogging platform — Android, iOS, Web**

Record, visualize, and analyze your vehicle's OBD2 data with a professional-grade tool that pairs with any BLE OBD2 adapter.

## Quick Start

```bash
npm install
# iOS: cd ios && pod install
npm run ios       # or npm run android
```

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Mobile App       │────▶│  Cloudflare API  │────▶│  D1 (SQLite) │
│  (React Native)   │     │  (Worker)        │     │  + R2 (CSV)  │
└──────────────────┘     └──────────────────┘     └──────────────┘
         │                                                    │
         ▼                                                    ▼
┌──────────────────┐                              ┌──────────────────┐
│  OBD2 Adapter    │                              │  Web Dashboard   │
│  (BLE)           │                              │  (Vite + React)  │
└──────────────────┘                              └──────────────────┘
```

Two Cloudflare deployments:
- **Worker** — REST API (auth, sessions, uploads, admin, docs)
- **Pages** — Web dashboard app

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Framework | React Native 0.73.4 + TypeScript |
| BLE | react-native-ble-plx v3.5.1 |
| Local Storage | MMKV |
| Charts (mobile) | react-native-svg |
| API Backend | Cloudflare Workers (Hono-style, raw Web Crypto) |
| Database | Cloudflare D1 (SQLite) |
| File Storage | Cloudflare R2 |
| Cache | Cloudflare KV |
| Web UI | React + Vite + shadcn/ui + Tailwind CSS |
| Charts (web) | Recharts |
| Auth | JWT (HMAC-SHA256 via Web Crypto API) |
| CI/CD | GitHub Actions |
| Password Hashing | PBKDF2 (100k iterations, SHA-256) |

## Project Structure

```
obd2free/
├── src/                      # Mobile app source
│   ├── components/           # Reusable UI components
│   ├── contexts/             # React contexts (BleContext, SessionContext)
│   ├── navigation/           # React Navigation setup
│   ├── screens/              # App screens
│   ├── services/             # Core business logic
│   │   ├── BleService.ts     # BLE singleton manager
│   │   ├── OBD2Service.ts    # ELM327 command queue & PID parser
│   │   ├── DataLogger.ts     # CSV logging + session management
│   │   └── GPSService.ts     # Location tracking
│   ├── types/                # TypeScript interfaces
│   └── constants/            # OBD2 PIDs, config, colors
├── android/                  # Android native build files
├── ios/                      # iOS native files
├── cloudflare/
│   ├── worker/               # Cloudflare Workers API
│   │   ├── src/
│   │   │   ├── index.ts      # Entry point
│   │   │   ├── routes/       # auth, sessions, upload, admin, docs, devices
│   │   │   ├── middleware/   # JWT auth, setup
│   │   │   └── utils/        # JWT, password hashing
│   │   ├── migrations/       # D1 SQL migrations
│   │   └── docs/             # Documentation markdown source
│   └── wrangler.toml         # Cloudflare config
├── web/                      # Web dashboard
│   ├── src/
│   │   ├── pages/            # auth, dashboard, sessions, admin, settings, docs
│   │   ├── components/ui/    # shadcn/ui base components
│   │   ├── hooks/            # Auth context
│   │   ├── layouts/          # Root layout with sidebar nav
│   │   └── lib/              # cn utility, formatters
│   └── vite.config.ts        # Vite config
└── .github/workflows/
    ├── ci-cd.yml             # CI/CD pipeline
    └── release.yml           # Signed APK release workflow
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login (returns JWT) |
| POST | `/api/auth/forgot-password` | — | Initiate password reset |
| POST | `/api/auth/reset-password` | — | Complete password reset |
| GET | `/api/auth/me` | JWT | Current user profile |
| POST | `/api/auth/refresh` | JWT | Refresh JWT token |
| GET | `/api/sessions` | JWT | List sessions (paginated) |
| POST | `/api/sessions` | JWT | Create session |
| GET | `/api/sessions/:id` | JWT | Session detail |
| DELETE | `/api/sessions/:id` | JWT | Delete session + CSV |
| GET | `/api/sessions/:id/data` | JWT | Download CSV |
| POST | `/api/upload` | JWT | Upload CSV file |
| GET | `/api/devices` | JWT | List devices |
| POST | `/api/devices` | JWT | Register device token |
| GET | `/api/admin/users` | Admin | List users |
| PUT | `/api/admin/users/:id` | Admin | Update user (role, premium, password) |
| GET | `/api/admin/stats` | Admin | System statistics |
| GET | `/api/docs/:slug` | — | Documentation page |

## Environment Setup

### Prerequisites
```bash
node --version  # 18+
npm install -g wrangler  # Cloudflare CLI
```

### Local Development
```bash
# Mobile app
npm install
npm run ios        # iOS simulator
npm run android    # Android emulator

# Web dashboard
cd web && npm install && npm run dev

# Cloudflare worker
cd cloudflare/worker && npm run dev
```

### Cloudflare Deploy
```bash
# Worker
cd cloudflare/worker
npm run deploy

# Web app
npm run build:web
npm run deploy:web
```

### APK Release
```bash
npm run release  # tags current version and pushes
```
Requires GitHub Secrets: `REPO_KEYSTORE`, `REPO_KEYSTORE_PASS`, `REPO_KEY_ALIAS`, `REPO_KEY_PASS`
Generate keystore: `keytool -genkeypair -v -keystore obd2free-release.keystore -alias obd2free -keyalg RSA -keysize 2048 -validity 10000`

## Environment Variables (Worker)

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `change-me-in-production...` | HMAC signing key for JWTs |
| `ADMIN_EMAIL` | `admin@obd2free.com` | First admin account email |
| `ADMIN_PASSWORD` | `changeme123` | First admin account password (CHANGE ME) |

## CI/CD

GitHub Actions on push to `main`:
1. **Tests & Type Check** — tsc, eslint, jest, metro bundle, web build
2. **Android Build** — `./gradlew assembleDebug` + artifact upload
3. **iOS Build** — `xcodebuild` for simulator + artifact upload

Git tag `v*` triggers release workflow with signed APK.

## Documentation

Docs are stored in Cloudflare R2 as markdown and served via the Worker API. Browse at `/docs` on the web app.

Available topics:
- [Getting Started](./cloudflare/worker/docs/getting-started.md)
- [User Guide](./cloudflare/worker/docs/user-guide.md)
- [Technical Reference](./cloudflare/worker/docs/technical-reference.md) (includes full OBD2 PID table)
- [Admin Guide](./cloudflare/worker/docs/admin-guide.md)
- [Troubleshooting](./cloudflare/worker/docs/troubleshooting.md)

## Key Features

- **BLE OBD2 Connection**: Singleton BleManager, auto-reconnect, UART service discovery
- **OBD2 Parsing**: 15+ standard PIDs, DTC read/clear, adaptive timing
- **Session Recording**: CSV logging with GPS, auto-flush, cloud upload
- **Real-time Gauges**: SVG-based RPM, speed, temperature displays
- **Web Dashboard**: shadcn/ui, dark/light theme, datalog viewer with charts
- **Admin Panel**: User management, premium license controls, system stats
- **Authentication**: JWT-based, password reset flow, device token registration
- **Premium Tier**: Free/Premium/Lifetime license levels with feature gating

## License

MIT
