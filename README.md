# Family Memory Log

A private, self-hosted mobile app for families to share and preserve memories together.

## ✨ Features

- 📸 Upload up to 10 photos per memory
- 💬 Add titles and descriptions (280 char limit)
- 📅 Auto-extract dates from photo metadata
- 📍 Auto-extract locations from photo GPS data
- 👨‍👩‍👧‍👦 Multiple LogBooks (family circles)
- 🔐 100% private - YOUR server, YOUR data
- 🌍 Full Hebrew & English support (BiDi text)
- 📱 Works on iOS and Android
- ⚡ Zero friction - create a memory in < 60 seconds

## 🚀 Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for step-by-step setup (5 minutes!)

## 📚 Documentation

- **QUICKSTART.md** - Get up and running fast
- **SETUP.md** - Detailed setup and configuration
- **pocketbase-schema.json** - Database schema for import

## 🏗️ Tech Stack

- **Frontend:** React Native + Expo
- **Backend:** PocketBase (self-hosted)
- **Database:** SQLite (embedded in PocketBase)
- **State:** Zustand
- **Navigation:** React Navigation
- **Image Processing:** Expo Image Manipulator

## 📁 Project Structure

```
family-memory-log/
├── App.js                      # Main entry point
├── src/
│   ├── navigation/
│   │   └── AppNavigator.js     # App routing
│   ├── screens/
│   │   ├── AuthScreen.js       # Login/Signup
│   │   ├── FeedScreen.js       # Main timeline
│   │   ├── CreateMemoryScreen.js
│   │   ├── LogBooksScreen.js
│   │   └── ProfileScreen.js
│   ├── components/
│   │   └── MemoryCard.js       # Memory display
│   ├── services/
│   │   ├── pocketbase.js       # API client
│   │   └── imageService.js     # Compression
│   └── stores/
│       └── authStore.js        # State management
├── package.json
└── app.json
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## ⚙️ Configuration

### 1. PocketBase URL
Edit `src/services/pocketbase.js`:
```javascript
const PB_URL = 'http://YOUR_IP:8090';
```

### 2. App Identifier
Edit `app.json` to change bundle IDs:
```json
"ios": {
  "bundleIdentifier": "com.yourfamily.memorylog"
},
"android": {
  "package": "com.yourfamily.memorylog"
}
```

## 🌐 Server Options

### Development (Local Network)
- PocketBase running on your computer
- Access via local IP (e.g., 192.168.1.100)
- Good for testing

### Production
1. **Cloudflare Tunnel** (easiest)
   - Free
   - No port forwarding
   - Automatic HTTPS

2. **Tailscale** (most private)
   - Zero-trust VPN
   - No public exposure
   - Requires all users on network

3. **VPS** (most flexible)
   - Full control
   - nginx/Caddy reverse proxy
   - Let's Encrypt SSL

## 📝 License

Private family use. Not for commercial distribution.

## 🙏 Credits

Built with love for families who want to preserve their memories privately.

---

**Version:** 1.0.0  
**Status:** MVP Ready
