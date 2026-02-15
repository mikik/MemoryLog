# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm install          # Install dependencies
npm start            # Start Expo development server
npm run ios          # Run on iOS simulator
npm run android      # Run on Android emulator
```

## Architecture Overview

Family Memory Log is a React Native (Expo) app that allows families to share memories privately through a self-hosted PocketBase backend.

### Key Architecture Decisions

**Authentication Flow**: The app uses a conditional navigator pattern in `src/navigation/AppNavigator.js`. The root `AppNavigator` checks `isAuthenticated` from Zustand store and renders either `AuthScreen` or the main `AppStack`. Auto-login is attempted on app startup via `useAuthStore.initialize()`.

**State Management**: Zustand store (`src/stores/authStore.js`) manages all global state: user, authentication status, logbooks, and current logbook selection. There is no Redux or Context API.

**API Layer**: All PocketBase API calls go through a singleton service (`src/services/pocketbase.js`). Authentication tokens are stored in `expo-secure-store`. The service handles both auth operations and CRUD for logbooks/memories.

**Image Pipeline**: `src/services/imageService.js` handles image picking, EXIF extraction (date/GPS), and compression via `expo-image-manipulator`. Images are compressed to max 2048px width and ~80% quality before upload.

### Navigation Structure

- `AppNavigator` (root): Conditional auth check
  - `AuthScreen`: Login/signup
  - `AppStack`: Stack navigator
    - `MainTabs`: Bottom tab navigator (Feed, LogBooks, Profile)
    - `CreateMemory`: Modal screen

### Data Model (PocketBase Collections)

- **logbooks**: Family circles with `members`, `admins`, `invite_code`
- **memories**: Photos with `title`, `description`, `media` (up to 10 files), `event_date`, `location_*`
- **comments/reactions**: Future features (currently stubbed in schema)

See `pocketbase-schema.json` for full schema definition.

## Configuration

The PocketBase URL must be configured in `src/services/pocketbase.js`:
```javascript
const PB_URL = 'http://YOUR_IP:8090';
```

App bundle identifiers are in `app.json` under `expo.ios.bundleIdentifier` and `expo.android.package`.
