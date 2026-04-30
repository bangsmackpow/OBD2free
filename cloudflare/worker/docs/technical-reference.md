# Technical Reference

*Last updated: April 2026*

## API Overview

OBD2Free uses a RESTful API hosted on Cloudflare Workers. All API endpoints are prefixed with `/api/`. Authentication is handled via JWT Bearer tokens.

### Base URL

```
https://api.obd2free.com
```

During development:
```
http://localhost:8787
```

### Authentication

Most endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained via the `/api/auth/login` endpoint and expire after 24 hours.

## Authentication Endpoints

### Register

Creates a new user account.

```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "display_name": "John Doe"  // optional
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "premium_level": "free"
  }
}
```

### Login

Authenticates a user and returns a JWT token.

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "role": "user",
    "premium_level": "free",
    "created_at": "2026-04-29T00:00:00.000Z"
  }
}
```

### Get Current User

Returns the authenticated user's profile.

```
GET /api/auth/me
Authorization: Bearer <token>
```

### Refresh Token

Issues a new JWT token for an authenticated user.

```
POST /api/auth/refresh
Authorization: Bearer <token>
```

### Forgot Password

Initiates a password reset.

```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Reset Password

Completes a password reset using the token from forgot-password.

```
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "newsecurepassword"
}
```

## Session Endpoints

### List Sessions

Returns paginated list of sessions for the authenticated user.

```
GET /api/sessions?page=1&limit=20&search=keyword
Authorization: Bearer <token>
```

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-uuid",
      "vehicle_id": "vehicle-uuid",
      "vehicle_name": "2020 BMW 330i",
      "started_at": "2026-04-29T14:00:00.000Z",
      "ended_at": "2026-04-29T14:30:00.000Z",
      "duration_seconds": 1800,
      "max_speed_kmh": 142.5,
      "avg_speed_kmh": 65.3,
      "distance_km": 32.7,
      "max_rpm": 4500,
      "avg_rpm": 1850,
      "max_coolant_temp": 92,
      "csv_row_count": 3600,
      "created_at": "2026-04-29T14:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

### Get Session

Returns full session metadata.

```
GET /api/sessions/:id
Authorization: Bearer <token>
```

### Create Session

Creates a new session record.

```
POST /api/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "vehicleId": "optional-vehicle-id",
  "vehicleName": "2020 BMW 330i",
  "notes": "Test drive after oil change"
}
```

### Delete Session

Removes a session and its CSV data.

```
DELETE /api/sessions/:id
Authorization: Bearer <token>
```

### Download Session CSV

Streams the raw CSV data for a session.

```
GET /api/sessions/:id/data
Authorization: Bearer <token>
```

**Response:** Binary CSV file with `Content-Type: text/csv` and `Content-Disposition: attachment`.

## Upload Endpoint

Accepts CSV data from the mobile app or manual uploads.

```
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <csv-file>
sessionId: optional-session-uuid
```

Or as JSON:
```
POST /api/upload/:sessionId
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": "timestamp,rpm,speed,...\n0,842,0,...",
  "sessionId": "optional-session-uuid"
}
```

**Response (201):**
```json
{
  "sessionId": "uuid",
  "rowCount": 3600,
  "r2Key": "sessions/user-id/session-uuid/data.csv",
  "stats": {
    "maxSpeed": 142.5,
    "avgSpeed": 65.3,
    "distance": 0,
    "duration": 1800
  }
}
```

## Device Endpoints

### List Devices

```
GET /api/devices
Authorization: Bearer <token>
```

### Register Device

Creates a device token for the mobile app.

```
POST /api/devices
Authorization: Bearer <token>
Content-Type: application/json

{
  "device_name": "iPhone 16 Pro",
  "device_type": "mobile"
}
```

### Delete Device

```
DELETE /api/devices/:id
Authorization: Bearer <token>
```

## Admin Endpoints

*Requires admin role.*

### List Users

```
GET /api/admin/users?page=1&limit=50&search=keyword
Authorization: Bearer <token> (admin)
```

### Get User Detail

```
GET /api/admin/users/:id
Authorization: Bearer <token> (admin)
```

**Response includes:** user profile, session count, total storage, device count.

### Update User

```
PUT /api/admin/users/:id
Authorization: Bearer <token> (admin)
Content-Type: application/json

{
  "email": "newemail@example.com",
  "display_name": "New Name",
  "role": "user",              // "user" | "admin"
  "premium_level": "premium",  // "free" | "premium" | "lifetime"
  "premium_expiry": 1775000000, // optional unix timestamp
  "password": "newpassword"
}
```

### Get Stats

```
GET /api/admin/stats
Authorization: Bearer <token> (admin)
```

Returns aggregate statistics: user count, session count, total storage, premium user count.

## Documentation Endpoints

### List Docs

Returns available documentation pages.

```
GET /api/docs
```

### Get Doc

Returns a documentation page as markdown content.

```
GET /api/docs/:slug
```

**Response:**
```json
{
  "slug": "getting-started",
  "content": "# Getting Started\n\n... (markdown content)",
  "key": "docs/getting-started.md"
}
```

## CSV Data Format

Each session's data is stored as a CSV file in R2 with the following standard format:

```csv
timestamp,rpm,speed,coolant_temp,intake_air_temp,throttle_position,engine_load,timing_advance,stft,ltft,map,maf
0.0,842,0,87,25,8.2,12.5,4.5,0.8,1.2,34.0,2.1
1.0,865,0,87,25,8.5,13.0,4.5,0.8,1.2,34.5,2.2
...
```

### Column Reference

| Column | Unit | Description |
|--------|------|-------------|
| timestamp | seconds | Elapsed time since session start |
| rpm | RPM | Engine revolutions per minute |
| speed | km/h | Vehicle speed |
| coolant_temp | °C | Engine coolant temperature |
| intake_air_temp | °C | Intake air temperature |
| throttle_position | % | Throttle plate opening |
| engine_load | % | Calculated engine load |
| timing_advance | ° | Ignition timing advance |
| stft | % | Short-term fuel trim |
| ltft | % | Long-term fuel trim |
| map | kPa | Manifold absolute pressure |
| maf | g/s | Mass air flow rate |

### Custom Columns

OBD2Free also supports additional columns from other OBD2 apps. Any column not in the standard set above is preserved and displayed in the data table.

## Security

### Password Storage

Passwords are hashed using PBKDF2 with SHA-256, 100,000 iterations, and a random 16-byte salt. The hash format is:

```
pbkdf2:<salt-hex>:<hash-hex>
```

### JWT Tokens

Tokens are signed using HMAC-SHA256. The JWT payload contains:

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "user",
  "premium_level": "free",
  "iat": 1714400000,
  "exp": 1714486400
}
```

### Data Encryption

All data is encrypted in transit (TLS). CSV files stored in R2 are encrypted at rest.

<details>
<summary>OBD2 PID Reference (Click to expand)</summary>

## Complete OBD2 PID Reference

| PID (Hex) | Name | Formula | Units | Min | Max |
|-----------|------|---------|-------|-----|-----|
| 00 | PIDs Supported [01-20] | Bitmask | — | — | — |
| 01 | Monitor Status Since DTCs Cleared | Bitmask | — | — | — |
| 02 | Freeze DTC | — | — | — | — |
| 03 | Fuel System Status | Bit field | — | — | — |
| 04 | Calculated Engine Load | 100 * A / 255 | % | 0 | 100 |
| 05 | Engine Coolant Temperature | A - 40 | °C | -40 | 215 |
| 06 | Short Term Fuel Trim - Bank 1 | (100 * A / 128) - 100 | % | -100 | 99.22 |
| 07 | Long Term Fuel Trim - Bank 1 | (100 * A / 128) - 100 | % | -100 | 99.22 |
| 08 | Short Term Fuel Trim - Bank 2 | (100 * A / 128) - 100 | % | -100 | 99.22 |
| 09 | Long Term Fuel Trim - Bank 2 | (100 * A / 128) - 100 | % | -100 | 99.22 |
| 0A | Fuel Pressure | A * 3 | kPa | 0 | 765 |
| 0B | Intake Manifold Pressure | A | kPa | 0 | 255 |
| 0C | Engine RPM | ((A * 256) + B) / 4 | rpm | 0 | 16,383 |
| 0D | Vehicle Speed | A | km/h | 0 | 255 |
| 0E | Timing Advance | (A / 2) - 64 | ° | -64 | 63.5 |
| 0F | Intake Air Temperature | A - 40 | °C | -40 | 215 |
| 10 | MAF Air Flow Rate | ((A * 256) + B) / 100 | g/s | 0 | 655.35 |
| 11 | Throttle Position | 100 * A / 255 | % | 0 | 100 |
| 12 | Commanded Secondary Air Status | Bit field | — | — | — |
| 13 | Oxygen Sensors Present | Bitmask | — | — | — |
| 14 | Bank 1 - Sensor 1 O2 Voltage | A * 0.005 | V | 0 | 1.275 |
| 15 | Bank 1 - Sensor 2 O2 Voltage | A * 0.005 | V | 0 | 1.275 |
| 1C | OBD Standards | Enum | — | — | — |
| 1F | Run Time Since Engine Start | (A * 256) + B | sec | 0 | 65,535 |
| 21 | Distance Traveled with MIL On | (A * 256) + B | km | 0 | 65,535 |
| 22 | Fuel Rail Pressure (relative) | ((A * 256) + B) * 0.079 | kPa | 0 | 5,177 |
| 23 | Fuel Rail Pressure (diesel) | ((A * 256) + B) * 10 | kPa | 0 | 655,350 |
| 2F | Fuel Level Input | 100 * A / 255 | % | 0 | 100 |
| 31 | Distance Since DTCs Cleared | (A * 256) + B | km | 0 | 65,535 |
| 33 | Barometric Pressure | A | kPa | 0 | 255 |
| 3C | Catalyst Temperature Bank 1 | ((A * 256) + B) / 10 - 40 | °C | -40 | 6,513.5 |
| 42 | Control Module Voltage | ((A * 256) + B) / 1000 | V | 0 | 65.535 |
| 43 | Absolute Load Value | ((A * 256) + B) / 2.55 | % | 0 | 25,700 |
| 44 | Commanded Air-Fuel Equivalence Ratio | ((A * 256) + B) / 32768 | — | 0 | 2 |
| 45 | Relative Throttle Position | 100 * A / 255 | % | 0 | 100 |
| 46 | Ambient Air Temperature | A - 40 | °C | -40 | 215 |
| 47 | Absolute Throttle Position B | 100 * A / 255 | % | 0 | 100 |
| 48 | Absolute Throttle Position C | 100 * A / 255 | % | 0 | 100 |
| 49 | Accelerator Pedal Position D | 100 * A / 255 | % | 0 | 100 |
| 4A | Accelerator Pedal Position E | 100 * A / 255 | % | 0 | 100 |
| 4B | Accelerator Pedal Position F | 100 * A / 255 | % | 0 | 100 |
| 4C | Commanded Throttle Actuator | 100 * A / 255 | % | 0 | 100 |
| 4D | Time Run with MIL On | (A * 256) + B | min | 0 | 65,535 |
| 4E | Time Since DTCs Cleared | (A * 256) + B | min | 0 | 65,535 |
| 52 | Ethanol Fuel % | 100 * A / 255 | % | 0 | 100 |
| 53 | Absolute Evap System Vapor Pressure | ((A * 256) + B) / 200 | kPa | -327.68 | +327.67 |
| 5A | Relative Accelerator Pedal Position | 100 * A / 255 | % | 0 | 100 |
| 5B | Hybrid Battery Pack Life | 100 * A / 255 | % | 0 | 100 |
| 5C | Engine Oil Temperature | A - 40 | °C | -40 | 215 |
| 5D | Fuel Injection Timing | ((A * 256) + B) / 128 - 210 | ° | -210 | +301.992 |
| 5E | Engine Fuel Rate | ((A * 256) + B) * 0.05 | L/h | 0 | 3,276.75 |
</details>
