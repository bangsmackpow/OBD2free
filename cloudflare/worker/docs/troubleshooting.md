# Troubleshooting

*Last updated: April 2026*

## Connection Issues

### OBD2 Adapter Not Found

**Problem:** The app can't find your OBD2 adapter when scanning.

**Solutions:**

1. **Check the adapter is powered** — The vehicle should be running or the ignition in the "On" position
2. **Check Bluetooth is enabled** — Ensure Bluetooth is turned on in your phone's settings
3. **Check permissions:**
   - **Android:** Settings → Apps → OBD2Free → Permissions → Enable Bluetooth + Location
   - **iOS:** Settings → Privacy → Bluetooth → OBD2Free → Enable
4. **Restart the adapter** — Unplug it, wait 10 seconds, and plug it back in
5. **Restart the app** — Force close and reopen OBD2Free
6. **Reset Bluetooth** — Toggle Bluetooth off and on in your phone's settings
7. **Move closer** — Ensure you're within 3 meters of the adapter

### Connection Drops Frequently

**Problem:** The app connects but disconnects after a short time.

**Solutions:**
- Move your phone closer to the OBD2 adapter
- Remove other Bluetooth devices that might cause interference
- Check for USB ports or power cables near the OBD2 port that may cause interference
- Try a different OBD2 adapter if available

### Adapter Pairs But Won't Connect

**Problem:** The adapter appears in the list but the app can't establish a connection.

**Solutions:**
- Unplug and re-plug the adapter
- Restart your phone
- Check if the adapter needs a PIN (try 0000 or 1234)
- Some adapters need an initialization sequence — start the vehicle and wait 30 seconds

## App Issues

### App Crashes on Startup

**Solutions:**
1. Update to the latest version
2. Clear app cache:
   - **Android:** Settings → Apps → OBD2Free → Storage → Clear Cache
   - **iOS:** Offload the app and reinstall
3. Reinstall the app

### No Data Showing

**Problem:** The app is connected but shows zeros or no data.

**Solutions:**
- Ensure the vehicle is running (some PIDs are only available with the engine on)
- Check that the adapter supports the standard OBD2 PIDs (most do)
- Try starting a new session — sometimes the data stream needs to be reset

### Battery Draining Fast

**Problem:** The app uses significant battery power.

**Solutions:**
- The app uses GPS and Bluetooth which are battery-intensive
- Stop sessions when not actively logging
- Reduce the data polling frequency in Settings
- Enable "Battery Saver" mode in the app (reduces GPS accuracy and polling rate)

## Account Issues

### Can't Log In

**Solutions:**
- Check your email and password are correct
- Use the "Forgot Password" link to reset your password
- Check if your account has been locked (contact support)

### Forgot Password

1. Go to the login page
2. Click "Forgot Password"
3. Enter your email address
4. Check your email for a reset link
5. Click the link and set a new password

**Note:** The reset link expires after 1 hour.

### Account Locked

After 5 failed login attempts, your account will be temporarily locked for 15 minutes. Wait and try again, or reset your password.

## Web App Issues

### Pages Not Loading

**Solutions:**
- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear your browser cache
- Try a different browser
- Check your internet connection

### Datalog Viewer Shows No Data

**Problem:** Charts and tables are empty for a session.

**Solutions:**
- The CSV file may still be uploading — check the session status
- Try refreshing the page
- Download the raw CSV to check if data exists
- If the CSV is empty, the session may have recorded no data

### Upload Fails

**Problem:** CSV files won't upload.

**Solutions:**
- Check file size (max 50 MB per file)
- Ensure the CSV is in the correct format
- Check your internet connection
- Try a different browser

## Error Messages

### "Unauthorized"

Your session has expired or you're not logged in. Log in again.

### "Forbidden"

You're trying to access an admin feature but don't have admin rights.

### "Not Found"

The session, user, or page doesn't exist. Check the URL or ID.

### "Rate Limit Exceeded"

You've made too many requests. Wait a minute and try again.

### "Internal Server Error"

Something went wrong on our end. Try again in a few minutes, or contact support if the issue persists.

## Data Issues

### Missing GPS Data

**Solutions:**
- Ensure location permissions are granted
- Check that GPS is enabled on your phone
- Walk outside — GPS works best with a clear view of the sky
- GPS accuracy can vary — the app filters out points with low accuracy

### Incorrect Speed Readings

- OBD2 speed comes from the vehicle's ECU and may differ slightly from GPS speed
- GPS speed is generally more accurate for actual ground speed
- Wheel size changes (larger/smaller tires) affect OBD2 speed accuracy

### Missing OBD2 Parameters

- Not all vehicles support all PIDs
- Some parameters require the engine to be running
- Luxury and newer vehicles may have restricted access to certain PIDs
- Check your vehicle's OBD2 compatibility

## Getting Help

If you've tried everything here and still have issues:

1. **Check the documentation** — You're reading it!
2. **Email support** — support@obd2free.com
3. **GitHub Issues** — Report bugs at [github.com/bangsmackpow/OBD2free/issues](https://github.com/bangsmackpow/OBD2free/issues)
4. **Community Forum** — Join discussions (coming soon)

Please include:
- App version
- Phone model and OS version
- OBD2 adapter model
- Vehicle make, model, and year
- A description of the problem and steps to reproduce
