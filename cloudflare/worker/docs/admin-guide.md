# Admin Guide

*Last updated: April 2026*

## Accessing the Admin Panel

The admin panel is available at `app.obd2free.com/admin`. You need an account with the `admin` role.

### First Admin Account

The first admin account is created automatically when the system starts up. The credentials are configured via environment variables:

- **Email:** `admin@obd2free.com`
- **Password:** Set via the `ADMIN_PASSWORD` environment variable

**Security:** Change the admin password immediately after first login.

## Dashboard

The admin dashboard shows system-wide statistics:

- **Total Users** — Registered account count
- **Total Sessions** — All sessions across all users
- **Total Storage** — Combined R2 storage usage
- **Active Users** — Users who have logged a session in the last 30 days
- **Premium Users** — Count of premium and lifetime subscribers
- **Storage Usage** — R2 bucket utilization over time

## User Management

### Viewing Users

The users table shows:

| Column | Description |
|--------|-------------|
| Email | User's login email |
| Display Name | User's chosen name |
| Role | `user` or `admin` |
| Premium Level | `free`, `premium`, or `lifetime` |
| Created | Account creation date |
| Sessions | Total session count |
| Storage | Total R2 storage used |

### Searching & Filtering

- Search by email or display name
- Filter by role
- Filter by premium level
- Sort by any column

### Editing a User

Click on any user to open the edit panel. You can change:

- **Email** — Update the user's email address
- **Display Name** — Change how they appear
- **Role** — Promote to admin or demote to user
- **Premium Level:** — Set to `free`, `premium`, or `lifetime`
- **Premium Expiry** — Set an expiration date for premium access
- **Password** — Reset the user's password

### Setting Premium Access

There are three premium levels:

1. **Free** — Default. Limited storage (100 MB), 1-minute data resolution
2. **Premium** — Subscription-based. Set an expiry date when this should end
3. **Lifetime** — One-time purchase. Never expires.

When setting premium access:

- Select the premium level from the dropdown
- For time-limited premium, set the expiry date
- Click "Save" to apply changes immediately
- The user does not need to log out — changes take effect on their next API call

## System Configuration

### Storage Management

- **R2 Bucket:** `obd2free-logs`
- **Storage Limit Per Free User:** 100 MB
- **Storage Limit Per Premium User:** Unlimited
- **Data Retention:** Sessions are kept indefinitely

To check storage usage:
1. Go to Admin Dashboard
2. View the "Storage" metric
3. Drill down by user in the users table

### Rate Limiting

API rate limits apply:
- **Authenticated requests:** 1000 per minute
- **Upload requests:** 100 per minute per user
- **Unauthenticated requests:** 100 per minute

## Manual Overrides

### Force Premium on a User

1. Navigate to Admin → Users
2. Find the user
3. Click "Edit"
4. Set Premium Level to "Premium" or "Lifetime"
5. Save

### Force Password Reset

1. Navigate to Admin → Users
2. Find the user
3. Click "Edit"
4. Enter a new password
5. Save
6. Provide the new password to the user securely

### Suspend a User

To temporarily disable a user's account:
1. Edit the user
2. Set their role to a non-existent role temporarily (this will break their login)
3. To restore, set their role back to "user"

## Audit Log

All admin actions are logged (future feature):
- User creation and modification
- Premium level changes
- Password resets
- Session deletions

## Monitoring

- **Worker logs** — Available in Cloudflare Dashboard > Workers & Pages > obd2free-worker > Logs
- **D1 queries** — Monitor database performance in Cloudflare Dashboard > D1
- **R2 usage** — Track storage costs in Cloudflare Dashboard > R2

---

*For API integration details, see the [Technical Reference](./technical-reference).*
