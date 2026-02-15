# Family Memory Log - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Node.js (if needed)
Check if you have Node.js:
```bash
node --version
```

If not installed: Download from https://nodejs.org/ (LTS version)

---

### Step 2: Set Up PocketBase (Backend)

#### Option A: Mac/Linux
```bash
# Create folder
mkdir pocketbase-server
cd pocketbase-server

# Download (Mac Intel)
curl -L https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_darwin_amd64.zip -o pb.zip

# Or for Mac M1/M2
curl -L https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_darwin_arm64.zip -o pb.zip

# Extract and run
unzip pb.zip
./pocketbase serve
```

#### Option B: Windows
```bash
# Download from browser:
https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_windows_amd64.zip

# Extract and double-click pocketbase.exe
# Or in terminal:
.\pocketbase.exe serve
```

**You should see:** `Server started at http://127.0.0.1:8090`

#### Create Admin Account
1. Open: http://127.0.0.1:8090/_/
2. Create your admin account
3. Keep this tab open

---

### Step 3: Import Database Schema

1. In PocketBase admin, click **Settings** → **Import collections**
2. Copy the content from `pocketbase-schema.json`
3. Paste and click **Import**
4. You should see 4 collections: logbooks, memories, comments, reactions

---

### Step 4: Set Up Mobile App

```bash
# Navigate to the project folder
cd family-memory-log-starter

# Install dependencies
npm install

# This takes 2-3 minutes
```

---

### Step 5: Configure Server Connection

**IMPORTANT:** Find your computer's local IP address

**Mac/Linux:**
```bash
ifconfig | grep inet
# Look for something like 192.168.1.100
```

**Windows:**
```bash
ipconfig
# Look for IPv4 Address: 192.168.1.100
```

**Edit this file:**
`src/services/pocketbase.js`

Change line 7:
```javascript
const PB_URL = 'http://192.168.1.100:8090'; // <-- YOUR IP HERE
```

---

### Step 6: Run the App

```bash
npm start
```

You'll see a QR code!

---

### Step 7: Test on Your Phone

1. **Install Expo Go:**
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Scan QR Code:**
   - iOS: Use Camera app
   - Android: Use Expo Go app

3. **App should load!**

---

## ✅ Your First Memory

1. **Sign Up** in the app
2. **Create a LogBook** (e.g., "Test Family")
3. **Tap the + button**
4. **Select photos** from your phone
5. **Add a title** (optional)
6. **Post!**

---

## 🆘 Troubleshooting

### "Cannot connect to server"
- Make sure PocketBase is running: `./pocketbase serve`
- Check the IP in `pocketbase.js` matches your computer
- Phone and computer must be on same WiFi

### "Module not found"
```bash
rm -rf node_modules
npm install
```

### "Expo Go won't open"
- Update Expo Go app to latest version
- Try typing the URL manually (shown below QR)

---

## 📱 Next Steps

Once working:
- Invite family with LogBook invite code
- Create more memories!
- Read `SETUP.md` for advanced features

---

## 🎯 Quick Reference

**Start PocketBase:**
```bash
cd pocketbase-server
./pocketbase serve
```

**Start App:**
```bash
cd family-memory-log-starter
npm start
```

**PocketBase Admin:**
http://127.0.0.1:8090/_/

---

Happy memory sharing! 📸❤️
