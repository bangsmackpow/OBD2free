# OBD2Free — V2-PRO Hardware & Feature Parity Reference

> Created: 2026-04-30
> Purpose: Hardware comparison, feature parity analysis vs professional scanners, and ELM327 maximization roadmap.

---

## 1. Professional Scanner Baseline: Icon T8

The Icon T8 is an intelligent diagnostic scanner (~$300-400) used as our feature parity benchmark.

### Icon T8 Core Capabilities
- All-system diagnostics (Engine, Transmission, ABS, Airbag/SRS, BCM, etc.)
- Bi-directional control (active tests — actuate solenoids, relays, motors)
- ECU coding and adaptations
- Service resets (oil, EPB, DPF, SAS, battery registration, injector coding)
- Live data graphing on 8" touchscreen
- Network topology mapping
- Freeze frame, DTC read/clear, I/M readiness
- Multi-language support
- WiFi updates

### Icon T8 Advanced Hardware Features
- Built-in 2-channel oscilloscope
- Built-in multimeter
- ADAS calibration support
- Tablet form factor with ruggedized housing

---

## 2. Hardware Tier Landscape

### Tier 1: Enhanced ELM327 Adapters ($25-$100) — CURRENT TARGET

| Device | Price | Key Features |
|--------|-------|-------------|
| **Vgate vLinker MC+** | ~$45 | Bluetooth, CAN-FD support, more stable than clones |
| **OBDLink LX** | ~$90 | Bluetooth, ~100 PIDs/sec, BatterySaver mode, secure pairing, firmware updates |
| **OBDLink MX+** | ~$100 | USB + Bluetooth, fastest ELM327 implementation |

**Capabilities:** Standard OBD-II (Modes 01-0A), 90+ PIDs, DTC read/clear, freeze frame, O2 sensor tests, EVAP tests, I/M readiness, vehicle info (VIN, CAL ID, CVN)

**Limitations:** Powertrain/emissions only. No ABS, SRS, transmission, BCM. No bidirectional. No ECU programming.

### Tier 2: All-System Bluetooth Dongles ($80-$150) — BEST VALUE UPGRADE

| Device | Price | Capabilities |
|--------|-------|-------------|
| **ThinkDiag 2** | ~$90 | All systems, bidirectional, 15 service resets, limited ECU coding. Requires ~$40/yr subscription after year 1. |
| **ThinkCar ThinkDiag** | ~$80 | Same as ThinkDiag 2, older version |
| **TOPDON ArtiDiag 800BT** | ~$130 | All systems, bidirectional, 27 service functions, NO annual subscription |

**What you get:** 90% of Icon T8 diagnostic capability at 25% of the price.

### Tier 3: J2534 Passthru Devices ($80-$300)

| Device | Price | Notes |
|--------|-------|-------|
| **TOPDON RLink X3** | ~$99 | Budget J2534, basic programming |
| **SM2 Pro J2534** | ~$90 | 67-in-1 VCI, budget option |
| **Xhorse MVCI PRO+** | ~$119 | Multi-vehicle J2534 |
| **TOPDON RLink J2534** | ~$225 | OEM J2534, all protocols |

**Use case:** ECU flashing, module programming, OEM dealer software (Techstream, IDS, etc.)
**Requires:** PC + OEM software subscriptions. Not standalone.

### Tier 4: Prosumer Diagnostic Tablets ($300-$500)

| Device | Price | Capabilities |
|--------|-------|-------------|
| **TOPDON ArtiDiag900 Lite** | ~$315 | 8" tablet, all systems, bidirectional, 8 reset functions, 60+ brands |
| **TOPDON ArtiDiag Pro** | ~$400 | 7" tablet, all systems, bidirectional, 35 service functions, ECU coding, 72+ makes |
| **Launch CRP919E** | ~$400 | Similar to ArtiDiag Pro |

### Tier 5: Professional Tablets ($500-$4000+)

| Device | Price | Notes |
|--------|-------|-------|
| **TOPDON Phoenix Nano** | ~$560 | 8", CAN-FD + DoIP, ECU coding |
| **TOPDON ONE** | ~$750 | 10.1", J2534 programming, AI repair guidance |
| **TOPDON Phoenix Lite 3** | ~$859 | 8", CAN-FD, 35 service functions, topology mapping |
| **Autel MK808BT** | ~$500 | 7", all systems, 30+ services |

---

## 3. Feature Parity Matrix: ELM327 vs Icon T8

### FULLY SUPPORTED via ELM327

| Feature | OBD-II Mode | Notes |
|---------|-------------|-------|
| Read DTCs (stored) | Mode 03 | Generic + manufacturer-specific |
| Clear DTCs / Reset MIL | Mode 04 | Also clears freeze frame |
| Live sensor data | Mode 01 | 90+ standard PIDs |
| Freeze frame data | Mode 02 | Snapshot at DTC trigger |
| O2 sensor test results | Mode 05 | Voltage, trim, lambda |
| Component test results | Mode 06 | Monitor IDs, thresholds |
| Pending DTCs | Mode 07 | Detected during current/last cycle |
| Vehicle information | Mode 09 | VIN, CAL ID, CVN, ECU name |
| Permanent DTCs | Mode 0A | Cannot be cleared by Mode 04 |
| I/M Readiness | Mode 01 PID 01 | Monitor status flags |
| Fuel economy calculation | Computed | From MAF, speed, fuel trim |
| Trip computer | Computed | Distance, time, avg MPG |

### PARTIALLY SUPPORTED via ELM327

| Feature | Status | Notes |
|---------|--------|-------|
| VIN decoding | Manual/API | Mode 09 PID 02 returns raw VIN; decode locally or via NHTSA API |
| Enhanced OBD-II | Vehicle-dependent | Some manufacturers expose extra PIDs on standard OBD-II bus |
| Custom PIDs | User-defined | Formula-based custom PID creator possible |
| Multi-protocol auto-detect | ELM327 firmware | OBDLink handles well; cheap clones may fail |
| CAN switching | Hardware-dependent | OBDLink LX supports; clones may not |

### NOT SUPPORTED via ELM327 (Hardware Limitation)

| Feature | Why | Workaround |
|---------|-----|------------|
| All-system diagnostics (ABS, SRS, Trans, BCM) | Uses manufacturer-specific protocols, not standard OBD-II | Requires ThinkDiag-level hardware |
| Bi-directional control | ELM327 is read-only; cannot send actuation commands | Requires J2534 or proprietary VCI |
| ECU coding/programming | Requires write access to ECU flash memory | Requires J2534 passthru |
| Service resets (oil, EPB, DPF, SAS) | Manufacturer-specific commands | Requires all-system diagnostic tool |
| Battery registration | BMS communication via manufacturer protocol | Requires all-system diagnostic tool |
| Immobilizer/key programming | Security protocols, seed-key algorithms | Requires specialized hardware |
| Network topology mapping | Requires querying all ECUs on all buses | Requires all-system diagnostic tool |
| Oscilloscope | Hardware requirement | External oscilloscope needed |
| Multimeter | Hardware requirement | External multimeter needed |
| ADAS calibration | Requires specialized targets + procedures | Requires dedicated ADAS tool |
| Injector coding | Manufacturer-specific ECU programming | Requires J2534 + OEM software |

---

## 4. ELM327 Maximization Strategy

### 4.1 All 10 OBD-II Modes — Full Implementation

```
Mode 01 - Show Current Data
  - 90+ standard PIDs
  - Real-time polling (up to 100 PIDs/sec with OBDLink LX)
  - Supported PID discovery (PID 00, 20, 40, 60, 80, A0)
  - Monitor status decoding (MIL, DTC count, readiness)

Mode 02 - Show Freeze Frame Data
  - Same PIDs as Mode 01, but snapshot at DTC trigger
  - PID 02 returns the DTC that triggered the freeze frame

Mode 03 - Show Stored DTCs
  - Up to 83 DTCs per response (variable length)
  - Generic (P0xxx, P2xxx, C0xxx, B0xxx, U0xxx)
  - Manufacturer-specific (P1xxx, P3xxx, etc.)

Mode 04 - Clear DTCs and Stored Values
  - Resets MIL, clears freeze frame, resets readiness monitors
  - WARNING: Also clears Mode 06 test results

Mode 05 - O2 Sensor Test Results (non-CAN only)
  - Voltage-based O2 sensors
  - Sensor ID, voltage, STFT

Mode 06 - Component Test Results (CAN only)
  - Monitor IDs with test values, min/max thresholds
  - Critical for catalytic converter, O2 heater, EVAP, EGR testing

Mode 07 - Show Pending DTCs
  - DTCs detected during current or last driving cycle
  - Not yet confirmed/stored

Mode 08 - Control Operation of On-Board Component/System
  - Rarely supported on standard OBD-II
  - Some vehicles support EVAP leak test initiation

Mode 09 - Request Vehicle Information
  - PID 02: VIN (up to 20 chars)
  - PID 04: CAL ID (calibration identification)
  - PID 06: CVN (calibration verification number)
  - PID 08: In-use performance tracking (spark ignition)
  - PID 0A: ECU name
  - PID 0B: In-use performance tracking (compression ignition)

Mode 0A - Permanent DTCs
  - DTCs that persist even after Mode 04 clear
  - Indicates unresolved issues
```

### 4.2 Complete PID Coverage (Mode 01)

#### Standard PIDs (All Vehicles)

| PID | Hex | Description | Formula |
|-----|-----|-------------|---------|
| 01 | 0x01 | Monitor status since DTCs cleared | Bit encoded |
| 03 | 0x03 | Fuel system status | Bit encoded |
| 04 | 0x04 | Calculated engine load | A * 100 / 255 |
| 05 | 0x05 | Engine coolant temperature | A - 40 |
| 06 | 0x06 | Short term fuel trim - Bank 1 | A * 100 / 128 - 100 |
| 07 | 0x07 | Long term fuel trim - Bank 1 | A * 100 / 128 - 100 |
| 08 | 0x08 | Short term fuel trim - Bank 2 | A * 100 / 128 - 100 |
| 09 | 0x09 | Long term fuel trim - Bank 2 | A * 100 / 128 - 100 |
| 0A | 0x0A | Fuel pressure (gauge) | A * 3 |
| 0B | 0x0B | Intake manifold absolute pressure | A |
| 0C | 0x0C | Engine speed (RPM) | (256A + B) / 4 |
| 0D | 0x0D | Vehicle speed | A |
| 0E | 0x0E | Timing advance | A / 2 - 64 |
| 0F | 0x0F | Intake air temperature | A - 40 |
| 10 | 0x10 | MAF air flow rate | (256A + B) / 100 |
| 11 | 0x11 | Throttle position | A * 100 / 255 |
| 13 | 0x13 | O2 sensors present (2 banks) | Bit encoded |
| 1C | 0x1C | OBD standards this vehicle conforms to | Enumerated |
| 1F | 0x1F | Run time since engine start | 256A + B |
| 21 | 0x21 | Distance with MIL on | 256A + B |
| 22 | 0x22 | Fuel rail pressure (vacuum) | 0.079 * (256A + B) |
| 23 | 0x23 | Fuel rail gauge pressure (direct inj) | 10 * (256A + B) |
| 2C | 0x2C | Commanded EGR | A * 100 / 255 |
| 2D | 0x2D | EGR error | A * 100 / 128 - 100 |
| 2E | 0x2E | Commanded evaporative purge | A * 100 / 255 |
| 2F | 0x2F | Fuel tank level input | A * 100 / 255 |
| 30 | 0x30 | Warm-ups since codes cleared | A |
| 31 | 0x31 | Distance since codes cleared | 256A + B |
| 33 | 0x33 | Barometric pressure | A |
| 3C | 0x3C | Catalyst temp - Bank 1 Sensor 1 | ((256A + B) / 10) - 40 |
| 42 | 0x42 | Control module voltage | (256A + B) / 1000 |
| 43 | 0x43 | Engine load (absolute) | A * 100 / 255 |
| 44 | 0x44 | Commanded equivalence ratio (lambda) | (256A + B) / 32768 |
| 45 | 0x45 | Relative throttle position | A * 100 / 255 |
| 46 | 0x46 | Ambient air temperature | A - 40 |
| 47 | 0x47 | Absolute throttle position B | A * 100 / 255 |
| 49 | 0x49 | Accelerator pedal position D | A * 100 / 255 |
| 4A | 0x4A | Accelerator pedal position E | A * 100 / 255 |
| 4C | 0x4C | Commanded throttle actuator | A * 100 / 255 |
| 4D | 0x4D | Time run with MIL on | 256A + B |
| 4E | 0x4E | Time since DTCs cleared | 256A + B |
| 51 | 0x51 | Fuel type | Enumerated |
| 52 | 0x52 | Ethanol fuel % | A * 100 / 255 |
| 5B | 0x5B | Hybrid battery pack life | A * 100 / 255 |

#### Extended PIDs (Mode 01, above 0x20)

| PID | Hex | Description | Formula |
|-----|-----|-------------|---------|
| 5C | 0x5C | Engine oil temperature | A - 40 |
| 5D | 0x5D | Fuel injection timing | (256A + B) / 128 |
| 5E | 0x5E | Engine fuel rate | (256A + B) / 20 |
| 60 | 0x60 | OBD standards (extended) | Bit encoded |
| 78-79 | 0x78-79 | Exhaust gas temp (Bank 1/2) | (256A + B) / 10 - 40 |

### 4.3 Advanced ELM327 Commands (AT Commands)

```
ATZ          - Reset adapter
ATE0         - Echo off
ATL0         - Linefeeds off
ATS0         - Spaces off
ATH1         - Headers on (needed for PID parsing)
ATAT1        - Auto protocol detection
ATSP0        - Set protocol to auto (same as ATAT1)
ATDPN        - Describe protocol number
ATRV         - Read vehicle voltage (adapter voltage)
ATST FF      - Set timeout to max (255 * 4ms = 1020ms)
ATSH         - Set header (for manufacturer-specific PIDs)
ATCRA        - Set receive address filter
ATCAF0       - Turn off CAN auto formatting
ATCM         - Set CAN mask
ATCF         - Set CAN filter
ATWM         - Wakeup message (for ISO 9141/14230)
```

### 4.4 Manufacturer-Specific PID Exploration

While ELM327 cannot access full manufacturer diagnostics, some manufacturers expose enhanced PIDs on the standard OBD-II bus:

**Ford (Mode 22):**
- Transmission temp: `22 1111`
- Transmission pressure: `22 1134`
- Turbo boost pressure: `22 1137`

**GM (Mode 22):**
- Transmission temp: `22 1114`
- Transmission pressure: `22 1115`

**Toyota (Mode 21):**
- Inverter temp: `21 43`
- Hybrid battery voltage: `21 69`

**Implementation approach:**
1. Create a custom PID database per manufacturer
2. Allow users to add custom PIDs with formulas
3. Community-sourced custom PID sharing via cloud

### 4.5 Performance Optimization

**OBDLink LX vs Cheap Clone:**

| Metric | OBDLink LX | $5 Clone |
|--------|-----------|----------|
| Max PIDs/sec | ~100 | ~10-20 |
| Protocol support | All 5 OBD-II | Often missing ISO 9141 |
| Connection stability | Excellent | Poor (drops frequently) |
| Firmware updates | Yes | No |
| Battery saver | <2mA sleep | ~50mA constant drain |
| Security | 128-bit encryption + physical button | Open broadcast, PIN 1234 |

**Polling strategy for best performance:**
1. Query supported PIDs first (PID 00, 20, 40, 60, 80, A0)
2. Batch multiple PIDs in single request where possible
3. Use adaptive polling rate (fast for active monitoring, slow for background)
4. Cache PID support per vehicle (don't re-query every session)
5. Prioritize critical PIDs (RPM, speed, coolant temp) for real-time display

---

## 5. OBD2Free ELM327 Feature Roadmap

### Phase 1: Core OBD-II (Current)
- [x] DTC read/clear with descriptions (180+ codes)
- [ ] Live data dashboard (20+ common PIDs)
- [ ] Freeze frame viewer
- [ ] I/M readiness status display
- [ ] O2 sensor test results
- [ ] Vehicle information (VIN, CAL ID, CVN)
- [ ] Pending DTCs display
- [ ] Permanent DTCs display

### Phase 2: Enhanced Monitoring
- [ ] Full 90+ PID support with formulas
- [ ] Real-time graphing (multi-PID overlay)
- [ ] Fuel economy calculator (instant + average MPG)
- [ ] Trip computer (distance, time, avg speed, fuel used)
- [ ] Data logging to cloud (D1/R2)
- [ ] Alert system (temperature, RPM, voltage thresholds)
- [ ] Custom gauge dashboard (user-configurable)

### Phase 3: Advanced Diagnostics
- [ ] Mode 06 component test results (catalyst, O2 heater, EVAP, EGR)
- [ ] Monitor ID decoding with pass/fail status
- [ ] Min/max/current value display for each monitor
- [ ] DTC history tracking (cloud-synced)
- [ ] Repair cost estimates (crowdsourced)
- [ ] Maintenance tracker (oil changes, filters, spark plugs)
- [ ] Vehicle profile management (multiple cars)

### Phase 4: Custom PIDs & Community
- [ ] Custom PID creator (user-defined formulas)
- [ ] Manufacturer-specific PID database (Ford Mode 22, GM Mode 22, Toyota Mode 21)
- [ ] Community PID sharing (cloud-synced custom PIDs)
- [ ] Report generation (PDF export)
- [ ] Pre-purchase inspection checklist
- [ ] Emissions test readiness report

### Phase 5: Cloud Intelligence
- [ ] DTC trend analysis (frequency, severity over time)
- [ ] Predictive maintenance alerts
- [ ] Recall notifications (VIN-based NHTSA API)
- [ ] Nearby mechanic locator
- [ ] Parts compatibility lookup
- [ ] Service manual access (subscription)

---

## 6. Hardware Recommendations for OBD2Free

### Development Hardware (Current)

| Device | Price | Purpose |
|--------|-------|---------|
| **OBDLink LX** | $90 | Primary dev device - best ELM327 implementation |

### Reference/Comparison Hardware (Future)

| Device | Price | Purpose |
|--------|-------|---------|
| **ThinkDiag 2** | ~$90 | Reference for all-system diagnostics comparison |
| **TOPDON RLink J2534** | ~$225 | Explore OEM protocols/programming |

### Budget Summary

| Item | Cost | Priority |
|------|------|----------|
| OBDLink LX | $90 | HIGH - Required for dev |
| ThinkDiag 2 | ~$90 | MEDIUM - Feature reference |
| Apple Developer | $99/yr | LOW - Only for real-device iOS |
| Google Play | $25 | LOW - Only for Play Store |

---

## 7. Market Positioning

### OBD2Free vs Professional Scanners

**OBD2Free covers ~80% of what average users need:**
- Check engine light diagnosis (most common use case)
- Live data monitoring
- Basic vehicle health assessment
- Emissions test readiness
- Fuel economy tracking
- Maintenance reminders

**OBD2Free CANNOT replace professional scanners for:**
- Transmission/ABS/Airbag diagnostics
- Bi-directional testing
- ECU programming/coding
- Advanced manufacturer functions
- Oscilloscope/multimeter measurements

### Target Audience
1. **DIY Mechanics** (80% of repairs are basic OBD-II)
2. **Fleet Managers** (need cloud tracking, multiple vehicles)
3. **Used Car Buyers** (pre-purchase inspections)
4. **Driving Enthusiasts** (performance monitoring, data logging)

### Differentiation Strategy
- **Cloud sync** - Icon T8 stores locally only
- **Web dashboard** - Access from any device
- **Community features** - Crowdsourced repair data, custom PIDs
- **Lower price** - Free tier + $5/mo premium vs $400 upfront
- **Always updated** - Cloud-based DTC database, no annual fees

---

## 8. Technical Reference

### ELM327 Protocol Support

| Protocol | Standard | Vehicles |
|----------|----------|----------|
| ISO 15765-4 (CAN 500kbps) | 2008+ all vehicles | Modern vehicles |
| ISO 15765-4 (CAN 250kbps) | Pre-2008 some vehicles | Older CAN vehicles |
| ISO 14230-4 (KWP2000) | 1996-2003 some vehicles | Asian, European, Chrysler |
| ISO 9141-2 | 1996-2003 some vehicles | Asian, European, Chrysler |
| J1850 VPW | 1996-2003 GM | GM vehicles |
| J1850 PWM | 1996-2003 Ford | Ford vehicles |

### OBD-II Connector Pinout (SAE J1962)

```
Pin 2:  J1850 Bus+
Pin 4:  Chassis Ground
Pin 5:  Signal Ground
Pin 6:  CAN High (ISO 15765-4)
Pin 7:  K-Line (ISO 9141-2 / ISO 14230-4)
Pin 10: J1850 Bus-
Pin 14: CAN Low (ISO 15765-4)
Pin 15: L-Line (ISO 9141-2 / ISO 14230-4)
Pin 16: Battery Power (+12V)
```

### DTC Code Structure

```
P0XXX - Powertrain (generic)
P1XXX - Powertrain (manufacturer-specific)
P2XXX - Powertrain (generic)
P3XXX - Powertrain (manufacturer-specific)
C0XXX - Chassis (generic)
C1XXX - Chassis (manufacturer-specific)
B0XXX - Body (generic)
B1XXX - Body (manufacturer-specific)
U0XXX - Network (generic)
U1XXX - Network (manufacturer-specific)

Second digit:
0 - SAE defined
1 - SAE defined
2 - SAE defined
3 - SAE defined

Third digit (subsystem):
1 - Fuel/Air Metering
2 - Fuel/Air Metering (injector circuit)
3 - Ignition System / Misfire
4 - Auxiliary Emissions Controls
5 - Vehicle Speed/Idle Control
6 - Computer/Output Circuit
7 - Transmission
8 - Transmission
9 - SAE reserved
0 - SAE reserved
```

---

## 9. Key Links & Resources

- **OBDLink LX**: https://www.scantool.net/obdlink-lxbt/
- **STN11xx Programming Manual**: https://www.scantool.net/downloads/98/stn1100-frpm.pdf
- **SAE J1979 Standard**: OBD-II test modes definition
- **Wikipedia OBD-II PIDs**: https://en.wikipedia.org/wiki/OBD-II_PIDs
- **NHTSA VIN Decoder API**: https://vpic.nhtsa.dot.gov/api/
- **ThinkDiag 2**: https://www.thinkdiag.com/
- **TOPDON Diagnostics**: https://www.topdon.us/collections/diagnostic-tools

---

## 10. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-30 | Stick with ELM327 for V2 | Maximizes ROI, covers 80% of use cases, open API |
| 2026-04-30 | Target OBDLink LX for dev | Best ELM327 implementation, firmware updates, fast polling |
| 2026-04-30 | Defer all-system diagnostics | Requires proprietary hardware; not feasible with ELM327 |
| 2026-04-30 | Focus on cloud differentiation | Professional scanners are local-only; cloud sync is our edge |
| 2026-04-30 | Build custom PID framework | Enables manufacturer-specific exploration within ELM327 limits |
