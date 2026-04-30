# Diagnostic Trouble Codes (DTC) Reference

*Last updated: April 2026*

## What are Diagnostic Trouble Codes?

When your vehicle's engine control unit (ECU) detects a problem, it stores a **Diagnostic Trouble Code (DTC)** and illuminates the Check Engine Light. These codes follow a standardized format that identifies the system, subsystem, and specific fault.

### Code Structure

```
P 0 1 2 3
│ │ │ │
│ │ │ └── Specific fault identifier (00-99)
│ │ └──── Subsystem (1=Fuel/Air, 2=Fuel/Air injector, 3=Ignition, etc.)
│ └────── Type (0=SAE generic, 1=Manufacturer specific, 2=SAE extended, 3=Reserved)
└──────── System (P=Powertrain, B=Body, C=Chassis, U=Network)
```

### Code Systems

| Prefix | System | Examples |
|--------|--------|----------|
| **P0xxx** | Powertrain — Generic (SAE) | P0301 (Cylinder 1 Misfire) |
| **P1xxx** | Powertrain — Manufacturer Specific | P1131 (Ford O2 sensor) |
| **P2xxx** | Powertrain — Extended (SAE) | P2096 (Post-cat lean) |
| **P3xxx** | Powertrain — Reserved | P3000-P3FFF |
| **B0xxx** | Body | B0001 (Airbag fault) |
| **C0xxx** | Chassis | C0035 (ABS sensor) |
| **U0xxx** | Network/Communication | U0100 (Lost communication) |

## Using the DTC Lookup API

### Lookup a specific code

```
GET /api/dtc/P0301
```

**Response:**
```json
{
  "code": "P0301",
  "system": "Powertrain",
  "category": "Ignition System",
  "description": "Cylinder 1 Misfire Detected",
  "causes": ["Faulty spark plug on cylinder 1", "Faulty ignition coil on cylinder 1", "Fuel injector issue on cylinder 1", "Low compression on cylinder 1"],
  "fixes": ["Swap coil to another cylinder to test", "Replace spark plugs", "Test/replace fuel injector", "Perform compression test"],
  "severity": "High",
  "symptoms": ["Check Engine Light flashing", "Rough idle", "Engine vibration", "Power loss"]
}
```

### Search by keyword

```
GET /api/dtc?search=oxygen
GET /api/dtc?search=lean
GET /api/dtc?category=Ignition+System
```

### List categories

```
GET /api/dtc
```

## Common DTCs by Category

### Fuel & Air Metering
| Code | Description | Severity |
|------|-------------|----------|
| P0100-P0104 | MAF Sensor Circuit Issues | Medium-High |
| P0110-P0113 | Intake Air Temperature Sensor | Low |
| P0115-P0118 | Engine Coolant Temperature Sensor | Medium |
| P0120-P0123 | Throttle Position Sensor | Medium |

### Fuel System
| Code | Description | Severity |
|------|-------------|----------|
| P0171/P0174 | System Too Lean (Bank 1/Bank 2) | High |
| P0172/P0175 | System Too Rich (Bank 1/Bank 2) | Medium |
| P0087 | Fuel Rail Pressure Too Low | Critical |
| P0088 | Fuel Rail Pressure Too High | Medium |

### Ignition System
| Code | Description | Severity |
|------|-------------|----------|
| P0300 | Random/Multiple Misfire | Critical |
| P0301-P0312 | Specific Cylinder Misfire | High |
| P0325-P0328 | Knock Sensor | Medium |
| P0335-P0339 | Crankshaft Position Sensor | Critical |
| P0340-P0349 | Camshaft Position Sensor | High |
| P0351-P0362 | Ignition Coil Circuit | High |

### Oxygen Sensors
| Code | Description | Severity |
|------|-------------|----------|
| P0130-P0134 | O2 Sensor Circuit (Bank 1 Sensor 1) | Medium |
| P0135-P0139 | O2 Sensor Heater Circuit | Medium |
| P0140-P0147 | O2 Sensor Circuit (Bank 1 Sensor 2) | Medium |
| P0150-P0159 | O2 Sensor Circuit (Bank 2) | Medium |

### Evaporative Emission (EVAP)
| Code | Description | Severity |
|------|-------------|----------|
| P0440-P0449 | EVAP System Faults | Low |
| P0452-P0454 | EVAP Pressure Sensor | Low |
| P0455 | EVAP Gross Leak | Low |
| P0456 | EVAP Very Small Leak | Low |

### Exhaust / EGR
| Code | Description | Severity |
|------|-------------|----------|
| P0400-P0409 | EGR System Faults | Medium |
| P0410-P0419 | Secondary Air Injection | Low |
| P0420 | Catalyst Efficiency (Bank 1) | Medium |
| P0430 | Catalyst Efficiency (Bank 2) | Medium |

### Variable Valve Timing (VVT)
| Code | Description | Severity |
|------|-------------|----------|
| P0010-P0013 | VVT Solenoid Circuit | Medium |
| P0011-P0017 | Camshaft Timing Correlation | Critical |
| P0020-P0024 | VVT Bank 2 | Medium |

### Transmission
| Code | Description | Severity |
|------|-------------|----------|
| P0700-P0705 | Transmission Control System | High |
| P0715-P0725 | Speed Sensors | High |
| P0730-P0749 | Gear Ratio / Shift Solenoids | Critical |
| P0750-P0795 | Shift Solenoid Circuit | High |

### Network Communication
| Code | Description | Severity |
|------|-------------|----------|
| U0100-U0104 | Lost ECU Communication | Critical |
| U0105-U0155 | Lost Module Communication | High |
| U0121-U0129 | Lost ABS/Chassis Communication | High |
| U0140-U0149 | Lost Body Module Communication | High |

## How to Diagnose DTCs

### Step 1: Read the Codes
Use an OBD2 scanner (like OBDLink LX with the OBD2Free app) to read the stored codes. Note all codes — sometimes multiple codes point to a single root cause.

### Step 2: Research the Codes
Use the lookup API (`/api/dtc/:code`) or check this documentation for descriptions, causes, and recommended fixes. Focus on the **first** code that appeared, as others may be secondary.

### Step 3: Check for Common Causes
**Before buying any parts:**
1. **Check gas cap** — Loose gas cap causes P0440/P0455
2. **Check fluid levels** — Low oil affects VVT, low coolant affects temp sensors
3. **Inspect wiring** — Rodents, corrosion, and damage are common
4. **Look for vacuum leaks** — Cracked hoses cause lean codes
5. **Check battery/charging** — Low voltage causes random communication codes

### Step 4: Clear and Retest
After initial inspection:
1. Clear the codes through the app
2. Drive the vehicle for 10-15 minutes under various conditions
3. If codes return, proceed with diagnostic testing
4. If codes don't return, the issue was intermittent

### Step 5: Systematic Diagnosis
When codes persist:
1. **Search for Technical Service Bulletins (TSBs)** — Manufacturers release known-fix bulletins
2. **Follow the diagnostic flow** — The code tells you which circuit; test that circuit
3. **Check live data** — Use the app's real-time data to verify sensor readings
4. **Address root cause** — Replacing a sensor without fixing the underlying issue will fail again

## Severity Guide

| Severity | Meaning | Action |
|----------|---------|--------|
| **Critical** | Immediate risk of damage or stranding | Do not drive until repaired |
| **High** | Significant performance or reliability issue | Repair as soon as possible |
| **Medium** | Moderate impact on performance/emissions | Schedule repair soon |
| **Low** | Minor issue, usually emissions-related | Monitor and repair at convenience |

## Disclaimer

Diagnostic trouble codes and their resolutions are guidelines based on common patterns. Actual vehicle diagnosis requires proper tools, experience, and sometimes professional assistance. The fixes described here address common causes, but your specific vehicle may have unique requirements. When in doubt, consult a certified mechanic.

---

## API Reference

For the full DTC database API, see the [Technical Reference](./technical-reference).
