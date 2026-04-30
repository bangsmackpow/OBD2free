# Getting Started

*Last updated: April 2026*

## What You'll Need

1. **An OBD2-compatible vehicle** (1996 or newer in the US)
2. **An OBD2 Bluetooth adapter** (OBDLink LX recommended, but any BLE OBD2 adapter works)
3. **A smartphone** running iOS 15+ or Android 12+
4. **An internet connection** (for cloud sync features)

## Step 1: Install the App

### Android
- Download the APK from the [GitHub Releases page](https://github.com/bangsmackpow/OBD2free/releases)
- Open the downloaded APK file and tap "Install"
- If prompted about "Install from unknown sources," grant permission

### iOS
- Open the App Store and search for "OBD2Free"
- Tap "Get" to install
- *Note: iOS version requires TestFlight access during beta*

## Step 2: Find Your OBD2 Port

The OBD2 port is typically located under the dashboard on the driver's side. Common locations:

- Under the steering column (most common)
- Above the foot pedals
- Behind a small panel or fuse box cover

## Step 3: Plug in Your Adapter

Insert the OBD2 adapter firmly into the port. The vehicle **does not** need to be running — the port is powered even when the ignition is off. A light on the adapter should illuminate.

**Tip:** For your first setup, start the vehicle before connecting. Some adapters enter a low-power mode when the engine is off.

## Step 4: Grant Permissions

When you first open the app, you'll be asked for:

- **Bluetooth** — Required to communicate with the OBD2 adapter
- **Location** — Required for GPS tracking during sessions
- **Notifications** — Optional, for session notifications

## Step 5: Pair Your Adapter

1. Open the OBD2Free app
2. Tap **"Scan for Devices"**
3. You'll see a list of nearby Bluetooth devices
4. Tap your OBD2 adapter (look for names containing "OBD" or "ELM")
5. Wait for the connection — you'll see "Connected" when ready

**Pro tip:** If your adapter doesn't appear, make sure it's firmly plugged in and try moving closer to the adapter.

## Step 6: Start Logging

Once connected, you can:

- **View real-time data** — RPM, speed, coolant temperature, and more
- **Start a session** — Records all OBD2 data with GPS tracking
- **Stop a session** — Saves and uploads the data to your cloud account

## Step 7: View Your Data

Your logged sessions are available:

- **On your phone** — View recent sessions in the app
- **On the web** — Go to [app.obd2free.com](https://app.obd2free.com) and log in
- **Download CSV** — Export any session as a CSV file for analysis in Excel or other tools

## Creating an Account

1. Open the web app at [app.obd2free.com](https://app.obd2free.com)
2. Click **"Register"**
3. Enter your email and a password (at least 8 characters)
4. Check your email for a verification link (if enabled)
5. Log in and start exploring your data

## What's Next?

- [User Guide](./user-guide) — Learn about the dashboard, datalog viewer, and settings
- [Premium Features](./user-guide#premium) — Unlock advanced analytics and unlimited storage
- [Technical Reference](./technical-reference) — API docs and CSV schema
