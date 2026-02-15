# Troubleshooting Guide 🔧

Common issues and solutions for Family Memory Log.

---

## 🚫 Cannot Connect to Server

### Symptom
App shows "Network Error" or "Cannot connect to server"

### Solutions

#### 1. Check PocketBase is Running
```bash
cd pocketbase-server
./pocketbase serve

# Should show: Server started at http://127.0.0.1:8090
```

#### 2. Verify IP Address
```bash
# Mac/Linux
ifconfig | grep inet

# Windows
ipconfig

# Look for: 192.168.x.x
```

Check `src/services/pocketbase.js` line 7:
```javascript
const PB_URL = 'http://192.168.1.100:8090'; // Must match your IP
```

#### 3. Same WiFi Network
- Phone and computer MUST be on same WiFi
- Corporate/school WiFi might block connections
- Try home WiFi or mobile hotspot

#### 4. Firewall
```bash
# Mac: Allow PocketBase in System Preferences → Security → Firewall
# Windows: Allow in Windows Defender Firewall
```

---

## 📦 Module Not Found

### Symptom
```
Error: Unable to resolve module @react-navigation/native
```

### Solution
```bash
# Delete and reinstall
rm -rf node_modules
rm package-lock.json
npm install

# If still fails
npm cache clean --force
npm install
```

---

## 🔄 App Won't Refresh/Update

### Symptom
Code changes don't appear in app

### Solutions

#### 1. Shake Device
- Physical device: Shake to open dev menu
- Tap "Reload"

#### 2. Force Refresh
```bash
# In terminal where npm start is running
Press 'r' to reload
```

#### 3. Clear Cache
```bash
npm start -- --clear
```

---

## 📱 Expo Go Won't Scan QR

### Solutions

#### 1. Update Expo Go
- iOS: App Store → Updates
- Android: Play Store → Updates

#### 2. Manual URL Entry
1. Look below QR code for URL like: `exp://192.168.1.100:8081`
2. In Expo Go app: Enter URL manually

#### 3. Try LAN URL
```bash
# In terminal, look for:
› Metro waiting on exp://192.168.1.100:8081  ← Use this
› Scan the QR code above with Expo Go...
```

---

## 🖼️ Images Won't Upload

### Symptom
"Upload failed" or images not appearing

### Solutions

#### 1. Check File Size
- Max 5MB per image (after compression)
- Try with fewer/smaller images first

#### 2. Check Permissions
- iOS: Settings → App → Photos → All Photos
- Android: Settings → Apps → Permissions → Storage

#### 3. Check PocketBase Limits
In PocketBase admin:
- Collections → memories → media field
- Check maxSize is 5242880 (5MB)

---

## 🔐 Login Issues

### Symptom
"Invalid credentials" or can't login

### Solutions

#### 1. Check PocketBase is Running
```bash
./pocketbase serve
```

#### 2. Reset Password in Admin
1. Go to http://127.0.0.1:8090/_/
2. Collections → users
3. Find user → Edit → Set new password

#### 3. Create Test User
In PocketBase admin:
- Collections → users → New record
- Email: test@test.com
- Password: testpass123
- Name: Test User

---

## 🐌 App is Slow

### Solutions

#### 1. Check Image Count
- Limit to 5-6 photos per memory for best performance
- Large images (10MB+) slow down compression

#### 2. Clear Cache
```bash
npm start -- --clear
```

#### 3. Reduce Feed Load
In `src/screens/FeedScreen.js` line 21:
```javascript
const result = await pb.getMemories(currentLogbook.id, pageNum, 20); // Reduce from 30
```

---

## 📋 Schema Import Failed

### Symptom
Can't import pocketbase-schema.json

### Solution: Manual Creation

#### 1. Create "logbooks" Collection
- Type: Base
- Fields:
  - `title` (Text, required, 2-100 chars)
  - `description` (Text, optional, max 500)
  - `created_by` (Relation → users, single)
  - `admins` (Relation → users, multiple)
  - `members` (Relation → users, multiple)
  - `invite_code` (Text, required, 8 chars, unique)
  - `cover_image` (File, optional, max 5MB)

#### 2. Set API Rules (logbooks)
- List: `@request.auth.id != '' && (members.id ?= @request.auth.id)`
- View: `@request.auth.id != '' && (members.id ?= @request.auth.id)`
- Create: `@request.auth.id != ''`
- Update: `@request.auth.id != '' && (admins.id ?= @request.auth.id)`
- Delete: `@request.auth.id != '' && (created_by = @request.auth.id)`

#### 3. Create "memories" Collection
- Type: Base
- Fields:
  - `logbook` (Relation → logbooks, single, cascade delete)
  - `author` (Relation → users, single)
  - `title` (Text, optional, max 100)
  - `description` (Text, optional, max 280)
  - `media` (File, required, 1-10 files, max 5MB each)
  - `media_types` (JSON, optional)
  - `media_order` (JSON, optional)
  - `event_date` (Date, required)
  - `location_name` (Text, optional, max 200)
  - `location_lat` (Number, optional)
  - `location_lng` (Number, optional)

#### 4. Set API Rules (memories)
- List: `@request.auth.id != '' && (logbook.members.id ?= @request.auth.id)`
- View: `@request.auth.id != '' && (logbook.members.id ?= @request.auth.id)`
- Create: `@request.auth.id != '' && (logbook.members.id ?= @request.auth.id)`
- Update: `@request.auth.id != '' && (author = @request.auth.id)`
- Delete: `@request.auth.id != '' && (author = @request.auth.id)`

---

## 🍎 iOS-Specific Issues

### "Untrusted Developer"
1. Settings → General → VPN & Device Management
2. Trust developer profile
3. Reopen Expo Go

### Can't Install Expo Go
- Requires iOS 13+
- Check iOS version: Settings → General → About

---

## 🤖 Android-Specific Issues

### "INSTALL_FAILED"
```bash
# Enable developer mode
Settings → About Phone → Tap "Build Number" 7 times
Settings → Developer Options → USB Debugging ON
```

### Permissions Denied
```bash
# Manually grant permissions
Settings → Apps → Expo Go → Permissions → Allow all
```

---

## 🌐 Network/WiFi Issues

### Corporate/School WiFi
- May block peer-to-peer connections
- Use mobile hotspot instead
- Or use USB connection (requires ejecting from Expo)

### Double-Check Same Network
1. Phone WiFi: Settings → WiFi
2. Computer WiFi: Must match exactly
3. No VPN running on either device

---

## 🔍 Debug Mode

### Enable Detailed Logs

In `src/services/pocketbase.js`, add after line 10:
```javascript
this.client.beforeSend = function (url, options) {
  console.log('API Request:', url, options);
  return { url, options };
};

this.client.afterSend = function (response, data) {
  console.log('API Response:', response, data);
  return data;
};
```

Then check Expo console for detailed API logs.

---

## 🆘 Still Stuck?

### Check Logs

#### Expo Logs (App)
- Look at terminal where `npm start` is running
- Errors show in red

#### PocketBase Logs (Server)
- Look at terminal where `./pocketbase serve` is running
- Shows API requests and errors

### Test Individually

#### Test Backend Only
```bash
# In browser:
http://127.0.0.1:8090/api/health

# Should show: {"code":200,"message":"OK"}
```

#### Test App Only
```bash
# Change pocketbase.js to use demo server temporarily:
const PB_URL = 'https://pocketbase.io';

# If app works, problem is your local server
# If still broken, problem is app code
```

---

## 📞 Getting Help

When asking for help, provide:

1. **Error message** (exact text)
2. **What you tried** (steps to reproduce)
3. **Environment:**
   - OS: Mac/Windows/Linux
   - Node version: `node --version`
   - Phone: iOS/Android
   - Expo Go version

4. **Logs:**
   - Terminal output from `npm start`
   - Terminal output from `./pocketbase serve`
   - Any error screens from phone

---

## ✅ Prevention

### Before Starting Development

- [ ] PocketBase running: `./pocketbase serve`
- [ ] App running: `npm start`
- [ ] Phone on same WiFi
- [ ] Expo Go updated
- [ ] IP address correct

Save yourself time - check these every time! 😊
