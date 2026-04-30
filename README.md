# OBD2Free

**Cross-platform OBD2 datalogging platform — Android, iOS, Web**

Record, visualize, and analyze your vehicle's OBD2 data with a professional-grade tool that pairs with any BLE OBD2 adapter.

## Hardware Target: ELM327 (OBDLink LX Recommended)

OBD2Free maximizes the capabilities of standard ELM327 adapters, covering ~80% of what average users need:

**Supported via ELM327:**
- All 10 OBD-II modes (01-0A)
- 90+ standard PIDs (RPM, speed, temps, fuel trims, O2 sensors, etc.)
- DTC read/clear with descriptions (180+ codes)
- Freeze frame, I/M readiness, vehicle info (VIN, CAL ID, CVN)
- Mode 06 component tests (catalyst, O2 heater, EVAP, EGR)

**Not supported (requires pro scanner):**
- All-system diagnostics (ABS, SRS, transmission, BCM)
- Bi-directional control, ECU coding, service resets

**Recommended hardware:** OBDLink LX ($90) — fastest ELM327 implementation (~100 PIDs/sec), firmware updates, secure pairing.

See [V2-PRO.md](./V2-PRO.md) for full hardware comparison and feature parity analysis vs professional scanners (Icon T8, Autel, Launch).

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

Browse at `/docs` on the web app or read source files in `cloudflare/worker/docs/`:

- [Getting Started](./cloudflare/worker/docs/getting-started.md) — Install, connect OBD2 adapter, first session
- [User Guide](./cloudflare/worker/docs/user-guide.md) — Dashboard, sessions, datalog viewer, premium features
- [Technical Reference](./cloudflare/worker/docs/technical-reference.md) — API docs, JWT, CSV schema, full OBD2 PID table
- [Admin Guide](./cloudflare/worker/docs/admin-guide.md) — User management, license control, system config
- [Troubleshooting](./cloudflare/worker/docs/troubleshooting.md) — Connections, data, accounts, errors
- [V2-PRO Hardware Reference](./V2-PRO.md) — Hardware comparison, feature parity, ELM327 maximization roadmap

## Key Features

### OBD-II Diagnostics (ELM327)
- **All 10 Modes**: 01 (live data), 02 (freeze frame), 03 (DTCs), 04 (clear), 05 (O2 tests), 06 (component tests), 07 (pending DTCs), 09 (vehicle info), 0A (permanent DTCs)
- **90+ PIDs**: RPM, speed, coolant temp, fuel trims, O2 voltage/lambda, MAF, MAP, timing, throttle, EGR, EVAP, catalyst temp, battery voltage
- **DTC Database**: 180+ codes with descriptions, causes, fixes, severity ratings
- **Mode 06 Tests**: Catalyst efficiency, O2 heater, EVAP leak, EGR flow monitoring

### Mobile App
- **BLE OBD2 Connection**: Singleton BleManager, auto-reconnect, UART service discovery
- **OBD2 Parsing**: ELM327 command queue, adaptive timing, ~100 PIDs/sec with OBDLink LX
- **Session Recording**: CSV logging with GPS, auto-flush, cloud upload to R2
- **Real-time Gauges**: SVG-based RPM, speed, temperature displays
- **Trip Computer**: Distance, time, average speed, fuel economy calculations

### Web Dashboard
- **Modern UI**: shadcn/ui, dark/light theme, responsive design
- **Datalog Viewer**: Interactive charts with Recharts, data tables
- **Session Management**: Pagination, search, CSV import/export
- **Admin Panel**: User management, premium license controls, system stats
- **Documentation Viewer**: Markdown rendering from R2

### Cloud Backend (Cloudflare)
- **Authentication**: JWT-based (HMAC-SHA256 via Web Crypto API), password reset flow
- **Device Linking**: Device token registration for mobile app sync
- **Premium Tiers**: Free/Premium/Lifetime license levels with feature gating
- **D1 Database**: SQLite-based user/session/device storage
- **R2 Storage**: CSV datalog files, documentation markdown
- **KV Cache**: OBD2 PID caching, session metadata

### CI/CD
- **Automated Testing**: TypeScript, ESLint, Jest, Metro bundle, web build
- **Multi-Platform Builds**: Android APK, iOS simulator artifacts
- **Signed Releases**: Git tag triggers signed APK generation

## License

MIT
