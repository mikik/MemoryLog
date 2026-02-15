# Family Memory Log - Project Setup

## ✅ Step-by-Step Setup Guide

### 1. PocketBase Schema Import

**Manual Setup (for now):**

1. Open PocketBase Admin: http://127.0.0.1:8090/_/
2. Go to **Settings** → **Import collections**
3. Copy the content from `pocketbase-schema.json` (I'll provide this)
4. Paste and click **Import**

**Or follow these steps manually:**

#### Create Collections:

1. **Go to Collections** in PocketBase admin
2. Click **New Collection** → **Base Collection**

#### Collection 1: logbooks
- Name: `logbooks`
- Fields:
  - `title` (Text, required, min: 2, max: 100)
  - `description` (Text, optional, max: 500)
  - `created_by` (Relation to users, required, single)
  - `admins` (Relation to users, required, multiple)
  - `members` (Relation to users, required, multiple)
  - `invite_code` (Text, required, min: 8, max: 8)
  - `cover_image` (File, optional, images only, max 5MB)

- **API Rules** (in the "API Rules" tab):
  - List: `@request.auth.id != '' && (members.id ?= @request.auth.id)`
  - View: `@request.auth.id != '' && (members.id ?= @request.auth.id)`
  - Create: `@request.auth.id != ''`
  - Update: `@request.auth.id != '' && (admins.id ?= @request.auth.id)`
  - Delete: `@request.auth.id != '' && (created_by = @request.auth.id)`

#### Collection 2: memories
- Name: `memories`
- Fields:
  - `logbook` (Relation to logbooks, required, single, cascade delete)
  - `author` (Relation to users, required, single)
  - `title` (Text, optional, max: 100)
  - `description` (Text, optional, max: 280)
  - `media` (File, required, min: 1, max: 10, images only, max 5MB each)
  - `media_types` (JSON, optional)
  - `media_order` (JSON, optional)
  - `event_date` (Date, required)
  - `location_name` (Text, optional, max: 200)
  - `location_lat` (Number, optional)
  - `location_lng` (Number, optional)

- **API Rules**:
  - List: `@request.auth.id != '' && (logbook.members.id ?= @request.auth.id)`
  - View: `@request.auth.id != '' && (logbook.members.id ?= @request.auth.id)`
  - Create: `@request.auth.id != '' && (logbook.members.id ?= @request.auth.id)`
  - Update: `@request.auth.id != '' && (author = @request.auth.id)`
  - Delete: `@request.auth.id != '' && (author = @request.auth.id)`

#### Collection 3 & 4: comments, reactions (for V2)
Leave rules as `null` (disabled for now)

### 2. Create Test Data

1. **Create a test user** (besides your admin):
   - Go to **Collections** → **users** → **New Record**
   - Email: `test@family.com`
   - Password: `testpass123`
   - Name: `Test User`

2. **Create a test LogBook**:
   - Go to **Collections** → **logbooks** → **New Record**
   - Title: `The Test Family`
   - Created by: (select your admin user)
   - Admins: (select your admin user)
   - Members: (select both admin and test user)
   - Invite code: `TESTCODE`

---

## 📱 Mobile App Structure

```
family-memory-log/
├── App.js                    # Main entry point
├── src/
│   ├── navigation/
│   │   └── AppNavigator.js   # Navigation setup
│   ├── screens/
│   │   ├── AuthScreen.js     # Login/Signup
│   │   ├── FeedScreen.js     # Main timeline
│   │   ├── CreateMemoryScreen.js
│   │   ├── LogBooksScreen.js
│   │   └── ProfileScreen.js
│   ├── components/
│   │   ├── MemoryCard.js     # Single memory display
│   │   ├── ImageCarousel.js  # Swipeable images
│   │   └── LoadingSpinner.js
│   ├── services/
│   │   ├── pocketbase.js     # API client
│   │   └── imageService.js   # Compression
│   └── stores/
│       └── authStore.js      # Zustand state
├── package.json
└── app.json
```

---

## 🔧 Configuration

### Update PocketBase URL in app

In `src/services/pocketbase.js`, set:
```javascript
const PB_URL = 'http://YOUR_LOCAL_IP:8090';
```

**Find your local IP:**
- Mac/Linux: `ifconfig | grep inet`
- Windows: `ipconfig`
- Look for something like `192.168.1.xxx`

**Why?** Your phone needs to connect to your computer's PocketBase server. `localhost` won't work from your phone.

---

## 🚀 Running the App

### Terminal 1: PocketBase
```bash
cd pocketbase-server
./pocketbase serve
```

### Terminal 2: Expo
```bash
cd family-memory-log
npm start
```

### On Your Phone:
1. Open Expo Go app
2. Scan QR code
3. App should load!

---

## 📝 Next Steps

After setup, we'll build:
1. ✅ Authentication flow (login screen)
2. ✅ Feed screen (display memories)
3. ✅ Create memory flow (photo picker + upload)
4. ✅ LogBook switcher
5. ✅ Offline support

---

## 🆘 Troubleshooting

### "Cannot connect to server"
- Make sure PocketBase is running (`./pocketbase serve`)
- Check the URL in `pocketbase.js` matches your computer's IP
- Phone and computer must be on same WiFi network

### "Expo Go won't scan QR code"
- Update Expo Go app to latest version
- Try typing the URL manually (shown below QR code)

### "Module not found"
```bash
cd family-memory-log
rm -rf node_modules
npm install
```

---

Ready to code! Let me know when PocketBase is set up and I'll give you the app code.
