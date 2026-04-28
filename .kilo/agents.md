# OBD2Free - Agent Handoff Documentation

## Project Overview
Cross-platform OBD2 reader application for Android, iOS, and web. Built with React Native 0.73+, TypeScript, Cloudflare stack (Workers + R2 + D1), and OBDLink LX hardware.

## Current State (2026-04-28)

### Completed ✅
- All TypeScript compilation errors resolved
- ESLint configured (with warnings remaining)
- Jest tests passing (3/3)
- BLE service with singleton pattern
- OBD2 PID parser (15+ PIDs)
- Data logging with MMKV + CSV buffering
- GPS service integration
- Cloudflare Workers API (sessions, upload, auth)
- D1 database schema
- Web dashboard (Vite + React + Tailwind)
- GitHub Actions CI/CD pipeline
- PremiumGate component created
- Native permissions configured (AndroidManifest.xml, Info.plist)

### Partially Complete ⏳
- Android native files (MainApplication.java ✅, MainActivity.java ✅, but build.gradle needs generation)
- iOS native files (Info.plist ✅, but Podfile and xcodeproj need `pod install`)
- Dashboard UI (basic gauges work, but builder not implemented)

### Not Started 🔴
- Physical device testing with OBDLink LX
- Dashboard builder (drag-and-drop)
- In-app purchases (react-native-iap)
- Performance metrics (0-60, quarter mile)
- Advanced web charts (Recharts)
- Manufacturer-specific deep diagnostics

## File Structure & Key Files

### Core Services
- `src/services/BleService.ts` - BLE singleton, scanning, connection
- `src/services/OBD2Service.ts` - ELM327 commands, PID parsing
- `src/services/DataLogger.ts` - CSV logging, session management
- `src/services/GPSService.ts` - Location tracking

### Contexts
- `src/contexts/BleContext.tsx` - Connection state, device discovery
- `src/contexts/SessionContext.tsx` - User, sessions, premium status

### Screens
- `src/screens/DashboardScreen.tsx` - Main dashboard with gauges

### Configuration
- `android/app/src/main/AndroidManifest.xml` - Android permissions ✅
- `ios/OBD2Free/Info.plist` - iOS capabilities ✅
- `cloudflare/wrangler.toml` - Cloudflare config ✅
- `package.json` - Dependencies ✅
- `tsconfig.json` - TypeScript config ✅

## Environment Setup

### Prerequisites
```bash
# Node.js 18+
node --version  # Should be 18+

# React Native CLI
npm install -g react-native-cli

# For iOS
xcode-select --print-path  # Should show Xcode path
cd ios && pod install

# For Android
echo $ANDROID_HOME  # Should point to Android SDK
```

### Install Dependencies
```bash
cd /Users/curtis/Desktop/dev/obd2
NPM_CONFIG_CACHE=/Users/curtis/.npm-cache npm install
```

### Run on Simulators/Emulators
```bash
# iOS
npm run ios

# Android
npm run android

# Web
cd web && npm run dev
```

## Critical Implementation Details

### 1. BLE Communication
- **Singleton Pattern**: `BleService` is a singleton to prevent memory leaks
- **Service UUID**: Looks for `FFE0` (Nordic UART) or `6E400001-B5A3-...` (custom)
- **Characteristic UUID**: `FFE1` for TX/RX
- **Connection**: `autoConnect: true` for Android reconnection
- **iOS Background**: Requires `bluetooth-central` in Info.plist ✅

### 2. OBD2 Protocol
- **AT Initialization**: `AT Z`, `AT SP 0` (auto protocol), `AT AT1` (adaptive timing)
- **Command Queue**: 50ms minimum delay between same PID to prevent buffer overflow
- **Response Format**: `"41 0C 1A F8"` for mode 01, PID 0C (RPM)
- **Parsing**: See `parseOBD2Response` function in `OBD2Service.ts`

### 3. Data Flow
```
OBD2 Adapter → BLE → BleService → OBD2Service → DataLogger → MMKV/R2
                                         ↓
                                    Dashboard UI (gauges)
```

### 4. Cloudflare Architecture
- **Workers**: `/api/sessions`, `/api/upload/:sessionId`, `/api/auth/token`
- **D1**: `sessions`, `vehicles`, `users` tables
- **R2**: CSV file storage (obd2free-logs bucket)
- **Pages**: Web dashboard deployment

## Remaining Work (Priority Order)

### High Priority 🔴
1. **Generate native build files**
   ```bash
   # Option 1: Use React Native CLI (recommended)
   npx react-native init --template react-native-template-typescript
   # Then copy over src/, cloudflare/, web/ directories

   # Option 2: Manually create android/build.gradle and ios/Podfile
   ```

2. **Test with physical OBDLink LX**
   - Plug into vehicle OBD2 port
   - Power on ignition
   - Run `npm run ios` or `npm run android`
   - Scan → Connect → Verify live data

3. **Complete Android build**
   - Ensure `android/build.gradle` and `android/app/build.gradle` exist
   - Run `cd android && ./gradlew assembleDebug`
   - Fix any build errors

4. **Complete iOS build**
   - `cd ios && pod install`
   - Open `OBD2Free.xcworkspace` in Xcode
   - Set signing team
   - Build & run

### Medium Priority ⏳
5. **Dashboard Builder**
   - Research: react-beautiful-dnd vs react-grid-layout
   - Implement drag-and-drop widget system
   - Persist layouts to MMKV
   - File: `src/screens/DashboardBuilderScreen.tsx` (create)

6. **Premium Paywall**
   - Add `react-native-iap` dependency
   - Configure App Store/Play Store in-app purchases
   - Test PremiumGate component
   - File: `src/components/PremiumGate.tsx` ✅ (exists, needs integration)

7. **Performance Metrics**
   - GPS-based 0-60 timing
   - Quarter mile timer
   - G-force from accelerometer
   - File: `src/services/PerformanceService.ts` (create)

### Low Priority 🔽
8. **Web Dashboard Enhancements**
   - Add Recharts for session visualization
   - Session comparison tool
   - Map view for GPS tracks
   - File: `web/src/App.tsx` ✅ (basic version exists)

9. **Manufacturer-Specific Features**
   - MazdaSpeed 3: Knock sensor, boost pressure
   - BMW F10: Service reset, DME coding
   - Files: `src/services/MazdaService.ts`, `src/services/BMWService.ts` (create)

## Testing Strategy

### Unit Tests (Jest)
- Location: `__tests__/obd2Parser.test.ts` ✅ (3 tests passing)
- Run: `npm test`
- Add tests for: BleService, DataLogger, GPSService

### Integration Tests
- Need OBDLink LX hardware
- Test with MazdaSpeed 3 (primary vehicle)
- Verify all standard PIDs return valid data

### Build Tests
- GitHub Actions workflow ✅ (`.github/workflows/ci-cd.yml`)
- Runs: typecheck, lint, test, build
- Deploy: Cloudflare Pages, Android APK, iOS app

## Common Issues & Solutions

### npm Permission Errors
```bash
# Use custom cache location
NPM_CONFIG_CACHE=/Users/curtis/.npm-cache npm install
```

### TypeScript Errors
```bash
# Check for errors - all resolved ✅
npm run typecheck
```

### BLE Connection Fails
- Check permissions in AndroidManifest.xml ✅
- Check Info.plist background modes ✅
- Ensure OBDLink LX is powered (vehicle ignition on)
- Try AT SP 0 (auto protocol) manually

### ELM327 No Response
- Check UART service UUID (should be FFE0 or 6E400001-...)
- Ensure adaptive timing: `AT AT1`
- Increase timeout: `AT ST 4A` (74ms)

## Quick Command Reference

```bash
# Setup
cd /Users/curtis/Desktop/dev/obd2
NPM_CONFIG_CACHE=/Users/curtis/.npm-cache npm install

# Development
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run start        # Metro bundler

# Web
cd web && npm run dev   # Development server

# Testing
npm test              # Jest tests
npm run typecheck    # TypeScript check
npm run lint         # ESLint

# Build
npm run build:android  # Android release APK
npm run build:ios      # iOS release build
npm run build:web     # Web production build

# Cloudflare
cd cloudflare && npm run dev        # Local worker
cd cloudflare && npm run deploy     # Deploy worker
wrangler pages deploy web/dist --project-name obd2free-web
```

## Key Contacts & Resources

- **Plan File**: `/Users/curtis/.local/share/kilo/plans/1777321534478-obd2free.md`
- **Original Requirements**: OBDLink LX ($70), React Native 0.73+, Cloudflare stack
- **Documentation**: `README.md`, `IMPLEMENTATION_STATUS.md`
- **GitHub**: (not yet created, see ci-cd.yml for deployment config)

## Final Notes

The project is in a **Phase 1 Complete** state. All core services are implemented and TypeScript compilation passes. The next critical step is generating proper native build files and testing with physical OBDLink LX hardware.

**Estimated time to MVP**: 2-3 weeks (after hardware acquisition)
**Budget remaining**: $70 for OBDLink LX (already allocated in plan)

Ready for continuation! 🚀
