# Running Family Memory Log

Start the services in this order. Each runs in its own terminal.

## 1. PocketBase (Backend)

```bash
cd pocketbase-server
./pocketbase serve --http 0.0.0.0:8090
```

Admin dashboard: http://localhost:8090/_/

## 2. ngrok (Expose PocketBase remotely)

```bash
ngrok http 8090
```

Copy the `https://...ngrok-free.dev` URL and update it in:
`src/services/pocketbase.js` → `PB_URL`

> **Note:** The free ngrok URL changes every time you restart ngrok.
> The app already includes the `ngrok-skip-browser-warning` header.

## 3. Expo Dev Server

**Local only (same WiFi):**
```bash
npx expo start
```

**Remote access (mobile data / different network):**
```bash
npx expo start --tunnel
```

Scan the QR code with Expo Go (iOS) or the Expo app (Android).

## Quick Reference

| Service    | Port | Purpose                        |
|------------|------|--------------------------------|
| PocketBase | 8090 | Backend API & file storage     |
| ngrok      | —    | Tunnel for PocketBase (remote) |
| Expo       | 8081 | React Native dev server        |

## Android APK Build

```bash
npx eas build -p android --profile preview
```

This builds an APK via Expo Application Services (EAS) cloud.
