# OBD2Free Documentation

**Your Complete OBD2 Data Logging & Analytics Platform**

OBD2Free is a powerful, cross-platform application that transforms your vehicle's OBD2 port into a professional-grade data logging and analytics system. Whether you're a car enthusiast, mechanic, or fleet manager, OBD2Free gives you the tools to understand exactly what your vehicle is doing in real-time.

## Quick Start

- [Getting Started](./getting-started) — Install and connect your OBD2 adapter
- [User Guide](./user-guide) — Dashboard, sessions, datalog viewer
- [Technical Reference](./technical-reference) — API docs, data format, CSV schema
- [Admin Guide](./admin-guide) — User management, license management
- [Troubleshooting](./troubleshooting) — Common issues and solutions

## What is OBD2?

OBD2 (On-Board Diagnostics, second generation) is a standardized system that allows external electronics to interface with your vehicle's computer system. Every car sold in the United States since 1996 has an OBD2 port, typically located under the dashboard on the driver's side.

When you plug an OBD2 adapter (like the OBDLink LX) into this port, you gain access to:

- **Engine RPM** — How fast your engine is spinning
- **Vehicle Speed** — How fast you're going
- **Coolant Temperature** — Engine operating temperature
- **Fuel System Status** — Fuel trim, oxygen sensor data
- **Calculated Load** — Engine load percentage
- **Intake Air Temperature** — Air temperature entering the engine
- **Throttle Position** — How far the throttle is open
- **Timing Advance** — Ignition timing
- **Many more** — Over 100 possible parameters

## Key Features

- **Real-time OBD2 Monitoring** — Connect via Bluetooth LE (BLE) to any compatible OBD2 adapter
- **Session Recording** — Log every drive with GPS tracking and full OBD2 data
- **Cloud Sync** — Automatically upload sessions to your private cloud storage
- **Web Dashboard** — View and analyze your data from any browser
- **Rich Data Visualization** — Multi-chart timelines, virtualized data tables, CSV export
- **Premium Tier** — Extended history, advanced analytics, unlimited storage
- **Privacy First** — Your data is encrypted in transit and at rest

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Mobile App      │────▶│  Cloudflare API  │────▶│  D1 Database  │
│  (React Native)  │     │  (Worker)        │     │  (SQLite)     │
└─────────────────┘     └──────────────────┘     └──────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  OBD2 Adapter    │     │  R2 Object Store │     │  KV Cache    │
│  (BLE)           │     │  (CSV Files)     │     │  (Session)   │
└─────────────────┘     └──────────────────┘     └──────────────┘
```

## Support

Need help? Check the [Troubleshooting](./troubleshooting) guide or contact support.

---

*For developers: see the [Technical Reference](./technical-reference) for API documentation and integration guides.*
