# State Log — 2026-02-25

## Last Night's Android APK Build

| Field | Value |
|-------|-------|
| **ID** | `fedf287a-efa4-4751-b6b7-50d1446ab3dc` |
| **Status** | Finished |
| **Profile** | preview (store distribution) |
| **Version** | 0.1.0 |
| **SDK** | 54.0.0 |
| **Commit** | `bc05036` — Add dual-mode feed, inline create memory modal, comment UI, and RTL support |
| **Started** | 2/24/2026, 11:37 PM |
| **Finished** | 2/25/2026, 12:20 AM |
| **APK** | https://expo.dev/artifacts/eas/xtpYNXdDZkXdSyWidEBvaE.apk |

## Current Branch: `dev`

Up to date with `origin/dev`.

### Uncommitted Changes

**Modified files:**

1. **eas.json** — Added iOS preview build profile (`distribution: internal`, `simulator: false`)
2. **src/screens/AuthScreen.js** — Switched PB_URL from ngrok to Azure (`memorylog.eastus.cloudapp.azure.com`), removed `ngrok-skip-browser-warning` header
3. **src/services/pocketbase.js** — Same URL switch from ngrok to Azure, removed ngrok `beforeSend` header hook and old IP-address comments

**Untracked files:**

- `INSTALL.txt`
- `az-deploy.txt`
- `run-local.txt`

### Summary

The uncommitted changes migrate the backend URL from the ngrok tunnel (`hippocampal-louie-unevaporated.ngrok-free.dev`) to an Azure-hosted endpoint (`memorylog.eastus.cloudapp.azure.com`) and strip all ngrok-specific workarounds. The EAS config was also updated to support iOS internal distribution builds.

## Recent Commit History (dev)

```
bc05036 Add dual-mode feed, inline create memory modal, comment UI, and RTL support
d908461 Add delete logbook feature with cascade warning
1a78efa Add RUNNING.md with service startup order documentation
1695bfa Set app version to 0.1.0 and display it dynamically on Profile screen
515b603 Add expo-location plugin config and @expo/ngrok dev dependency
d5db354 LogBooks UI: double-tap to open feed, single FAB action sheet, fix RTL text alignment
8c4b255 Add location support: device GPS fallback, reverse geocoding, and backfill script
0c1102a UI polish: field labels, inline validation, and layout improvements
53fd39b Add ngrok tunnel support for remote access and connection diagnostics
d65d1e8 Add comments feature on memory posts
91abe56 Show member names on logbook cards with owner listed first
eaaf027 Add project documentation and view tracker utility
2b32d27 Add @react-native-async-storage/async-storage dependency
c0833bd Update UI: add Join/Create FABs, share button, fix feed pagination, and profile header
c23fc33 Relax PocketBase logbook rules to support join-by-invite and broader visibility
```

## Automated Backup Setup — 2026-03-01

Daily backups to Azure Blob Storage are now live.

| Field | Value |
|-------|-------|
| **Storage Account** | `memorylogbackups` (Standard LRS, eastus) |
| **Container** | `pb-backups` |
| **Schedule** | Daily at 3:00 AM UTC via cron |
| **Retention** | 30 days (auto-pruned) |
| **SAS Token Expiry** | 2028-03-01 |
| **Est. Cost** | ~$0.02/GB/month |

### What gets backed up

- `data.db` — SQLite database (consistent copy via `sqlite3 .backup`)
- `storage/` — All uploaded photos
- `logs.db` — PocketBase logs

### First backup verified

| Field | Value |
|-------|-------|
| **Archive** | `pb_backup_2026-03-01_160905.tar.gz` |
| **Size** | 64 MB |
| **Status** | Uploaded successfully to Azure Blob Storage |

### Files on VM

- Backup script: `/opt/pocketbase/backup.sh`
- Cron job: `/etc/cron.d/pocketbase-backup`
- Log file: `/var/log/pocketbase-backup.log`

### Tools installed on VM

- `sqlite3` 3.45.1
- `azcopy` 10.32.1
