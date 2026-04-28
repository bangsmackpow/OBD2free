# OBD2Free - OBD2 Reader Application

Cross-platform OBD2 reader for Android, iOS, and web with custom dashboards, datalogging, and performance analytics.

## Tech Stack

- **Mobile**: React Native 0.73+ with TypeScript
- **BLE**: react-native-ble-plx (v3.5.1+)
- **Storage**: MMKV (local), Cloudflare R2 (cloud)
- **Backend**: Cloudflare Workers + D1 + R2
- **Web**: React + Vite + Tailwind CSS
- **Analytics**: Recharts (web), react-native-svg (mobile)

## Project Structure

```
obd2free/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (BleContext, SessionContext)
│   ├── hooks/            # Custom React hooks
│   ├── navigation/       # React Navigation setup
│   ├── screens/          # App screens (Dashboard, Sessions, etc.)
│   ├── services/         # Core business logic
│   │   ├── BleService.ts        # BLE singleton manager
│   │   ├── OBD2Service.ts       # ELM327 command queue & PID parser
│   │   ├── DataLogger.ts        # CSV logging + R2 upload
│   │   └── GPSService.ts        # Location tracking
│   ├── types/            # TypeScript interfaces
│   └── constants/        # App config, OBD2 PIDs, colors
├── android/              # Android native code
├── ios/                  # iOS native code
├── cloudflare/
│   ├── worker/           # Cloudflare Workers API
│   │   ├── index.ts
│   │   ├── context.ts
│   │   └── routes/
│   ├── migrations/       # D1 SQL migrations
│   └── wrangler.toml     # Cloudflare config
├── web/                  # Web dashboard (Cloudflare Pages)
└── .github/
    └── workflows/
        └── ci-cd.yml    # CI/CD pipeline
```

## Quick Start

### Prerequisites
- Node.js 18+
- React Native CLI (`npm install -g react-native-cli`)
- Xcode (iOS development)
- Android Studio (Android development)
- OBDLink LX or compatible ELM327 BLE adapter

### Mobile App Setup

1. **Install dependencies**
```bash
npm install
```

2. **Configure permissions**
- Android: Edit `android/app/src/main/AndroidManifest.xml` (already configured)
- iOS: Edit `ios/OBD2Free/Info.plist` (already configured)

3. **iOS Pod install**
```bash
cd ios && pod install && cd ..
```

4. **Run on device/simulator**
```bash
# iOS
npm run ios

# Android
npm run android
```

### Cloudflare Backend Setup

1. **Create Cloudflare account** and install Wrangler CLI:
```bash
npm install -g wrangler
wrangler login
```

2. **Create R2 bucket**:
```bash
wrangler r2 bucket create obd2free-logs
```

3. **Create D1 database**:
```bash
wrangler d1 create obd2free-db
```

4. **Update `cloudflare/wrangler.toml`** with your database ID.

5. **Apply migrations**:
```bash
cd cloudflare
wrangler d1 execute obd2free-db --file=./migrations/001_initial_schema.sql --remote
```

6. **Deploy worker**:
```bash
wrangler deploy
```

### Web Dashboard Setup

```bash
cd web
npm install
npm run dev  # development
npm run build  # production build
```

Deploy to Cloudflare Pages:
```bash
wrangler pages deploy web/dist --project-name obd2free-web
```

## Architecture Highlights

### BLE Communication
- Singleton `BleManager` pattern prevents memory leaks
- Background scanning with service UUID filtering (iOS)
- Foreground service required for Android 15+ background logging
- Automatic protocol detection (AT SP 0)

### OBD2 Data Pipeline
1. **Scan** for BLE OBD2 adapters
2. **Connect** via react-native-ble-plx
3. **Initialize** ELM327 with adaptive timing (AT AT1)
4. **Poll** configured PIDs with throttled command queue (50ms min delay)
5. **Parse** responses into typed `EngineData` objects
6. **Cache** in MMKV for instant UI updates
7. **Log** to CSV buffer (flushed every 500 records or 5s)
8. **Upload** to R2 when on WiFi or session ends

### Datalogging
- Circular MMKV buffer (last 10,000 readings)
- Automatic CSV chunking (500 records each)
- GPS integration for track mapping
- Session metadata in D1, logs in R2

## Features

### Phase 1 (Complete)
- BLE device scanning & connection
- Real-time RPM, speed, coolant temp
- DTC reading/clearing
- Local CSV datalogging

### Phase 2 (In Progress)
- Custom dashboard builder
- Background GPS tracking
- Cloud R2 upload
- Session management

### Phase 3 (Planned)
- Web dashboard with analytics
- Lap timing & performance metrics
- MazdaSpeed 3 & BMW F10 enhanced PIDs
- Premium paywall

## Configuration

### OBD2 PIDs
Standard PIDs defined in `src/constants/index.ts`: OBD2PID enum

### Polling Rate
Default: 10Hz (100ms)
- Fast PIDs (RPM, speed): every cycle
- Slow PIDs (temps): every 5 cycles

Control via `OBD2_CONFIG.DEFAULT_POLL_RATE`

Premium unlocks 20Hz mode for OBDLink MX.

## Testing

### With OBDLink LX
1. Plug adapter into vehicle OBD2 port
2. Power on ignition
3. Run app → Scan → "OBDLink LX"
4. Connect → Dashboard shows live data

### Mock Testing
```bash
# Use react-native-ble-plx-mock
npm test
```

## Deployment

### CI/CD (GitHub Actions)
- Push to `main` triggers:
  - Type check & lint
  - Unit tests with coverage
  - Android debug APK build
  - iOS debug build
  - Web build → Cloudflare Pages deployment

### Manual Deployment
```bash
# Android release
cd android && ./gradlew assembleRelease

# iOS archive
xcodebuild -workspace OBD2Free.xcworkspace -scheme OBD2Free -configuration Release

# Web
cd web && npm run build && wrangler pages deploy dist
```

## Troubleshooting

### BLE won't scan (iOS)
- Ensure "Bluetooth" permission in Info.plist
- Background Modes → "Uses Bluetooth LE Accessories" enabled
- Adapter must include service UUID in advertisement

### BLE connection fails (Android)
- Verify BLUETOOTH_SCAN and BLUETOOTH_CONNECT permissions granted
- Android 15+: Add FOREGROUND_SERVICE_CONNECTED_DEVICE
- Some devices require location services enabled

### ELM327 no response
- Check OBD2 adapter power (some draw too much from port)
- Try AT SP 0 (auto protocol) manually
- Ensure ELM327 firmware is latest

## License

MIT

## Support

Report issues: https://github.com/obd2free/obd2-reader/issues
