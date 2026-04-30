# User Guide

*Last updated: April 2026*

## Dashboard

The dashboard is your home screen after logging in. It provides a quick overview of your recent activity:

- **Active Session** — If you're currently logging, see real-time data
- **Recent Sessions** — Your last 5 sessions with quick stats
- **Weekly Summary** — Total driving time, distance, and session count for the week
- **Quick Actions** — Start a new session, upload a CSV, view all sessions

### Dashboard Cards

Each card shows a snapshot of a session:
- Date and time of the drive
- Duration
- Max and average speed
- Distance driven
- Status (completed or active)

Click any card to open the full [Session Detail](#session-detail) view.

## Sessions

The Sessions page lists all your recorded drives in a paginated table with search and filter capabilities.

### Columns
- **Date** — When the session started
- **Duration** — Total logging time
- **Distance** — Distance driven (if GPS data available)
- **Max Speed** — Peak speed during the session
- **Avg Speed** — Average speed
- **Max RPM** — Peak RPM
- **Rows** — Number of data points recorded
- **Status** — Completed or active

### Actions
- **View** — Opens the session detail with charts and data table
- **Download** — Downloads the raw CSV file
- **Delete** — Removes the session (requires confirmation)

### Search & Filter
- Search by date range, vehicle, or notes
- Filter by status (completed/active)
- Sort by any column

## Session Detail (Datalog Viewer)

This is the most powerful feature of OBD2Free. The datalog viewer gives you a comprehensive look at every parameter recorded during a session.

### Multi-Chart Timeline

The top section of the viewer shows synchronized charts:

- **RPM** — Engine revolutions per minute
- **Speed** — Vehicle speed in km/h
- **Coolant Temperature** — Engine temperature in °C
- **Engine Load** — Percentage of maximum load
- **Throttle Position** — Throttle opening percentage
- **MAF** — Mass air flow in g/s
- **MAP** — Manifold absolute pressure in kPa
- **Intake Air Temperature** — Air temperature entering the engine

**Controls:**
- **Zoom** — Click and drag on any chart to zoom in on a time range
- **Brush** — Use the timeline brush at the bottom to select a time window
- **Hover** — Hover over any chart to see exact values at that point
- **Toggle** — Show or hide individual parameters using the toggle buttons

### Data Table

Below the charts is a fully interactive data table:

- **Virtual scrolling** — Smoothly handles sessions with 10,000+ rows
- **Sortable columns** — Click any column header to sort
- **Resizable columns** — Drag column edges to resize
- **Search within table** — Filter rows by value
- **Row highlighting** — Click a row to highlight it across all charts
- **Synchronized cursor** — Hovering over a chart scrolls the table to the matching time

### Export & Share

- **Download CSV** — Export the full raw data
- **Download Filtered** — Export only visible rows (after filtering)
- **Copy Link** — Share a link to this session view

### CSV Import

You can import CSV files from other OBD2 logging apps or previous exports:

1. Go to **Sessions → Import CSV**
2. Select a CSV file from your device
3. The system parses the file and extracts basic statistics
4. The session appears in your sessions list
5. Open it in the datalog viewer for full analysis

**Supported CSV formats:**
- Standard OBD2 CSV files with timestamp, RPM, speed, and temperature columns
- Files from popular OBD2 apps (Torque, OBD Fusion, Car Scanner)
- Any CSV with OBD2 parameter names in the header row

## Settings

### Profile
- **Display Name** — Change how your name appears
- **Email** — Your login email (cannot be changed without verification)
- **Password** — Change your password

### Device Management
- **Registered Devices** — See which devices have access to your account
- **Revoke Access** — Remove a device from your account
- **Device Tokens** — Rotate API tokens for security

### Premium <a id="premium"></a>

- **Current Plan** — See your subscription status
- **Upgrade** — Choose monthly or lifetime premium access
- **Premium Features:**
  - Unlimited session storage
  - Advanced analytics and statistics
  - CSV export with full resolution
  - Priority support
  - Early access to new features

### Theme

- **Light Mode** — Clean, professional appearance for daytime use
- **Dark Mode** — Easy on the eyes for nighttime use
- **Auto** — Follows your system preference

## Web App vs Mobile App

| Feature | Mobile App | Web App |
|---------|-----------|---------|
| Real-time OBD2 data | ✅ | ❌ |
| Session recording | ✅ | ❌ |
| GPS tracking | ✅ | ❌ |
| View sessions | ✅ | ✅ |
| Datalog viewer | Limited | ✅ Full |
| CSV import | ❌ | ✅ |
| Admin panel | ❌ | ✅ |
| Account management | Basic | ✅ Full |

## Premium Features

OBD2Free offers a premium tier with enhanced capabilities:

- **Unlimited cloud storage** — Free users get 100 MB of storage
- **Advanced analytics** — Statistical analysis, trends, and comparisons
- **Full-resolution data** — Free users get data at 1-minute resolution
- **Priority uploads** — Premium sessions sync first
- **API access** — Integration with external tools

---

*Need more help? See the [Troubleshooting](./troubleshooting) guide or contact support.*
