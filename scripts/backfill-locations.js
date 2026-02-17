#!/usr/bin/env node

/**
 * Backfill location data for existing memories.
 *
 * Downloads each memory's first image, reads EXIF GPS,
 * reverse-geocodes to a place name, and updates the record.
 *
 * Usage:
 *   node scripts/backfill-locations.js <PB_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD>
 *
 * Example:
 *   node scripts/backfill-locations.js http://127.0.0.1:8090 admin@example.com mypassword
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 */

const PocketBase = require('pocketbase/cjs');
const ExifReader = require('exifreader');

// --- Config from CLI args ---
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const DRY_RUN = flags.includes('--dry-run');

const PB_URL = args[0];
const ADMIN_EMAIL = args[1];
const ADMIN_PASSWORD = args[2];

if (!PB_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Usage: node scripts/backfill-locations.js <PB_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD> [--dry-run]');
  process.exit(1);
}

// --- Reverse geocode using free OpenStreetMap Nominatim API ---
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MemoryLog-Backfill/1.0' },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const addr = data.address || {};
    const parts = [
      addr.city || addr.town || addr.village,
      addr.state,
      addr.country,
    ].filter(Boolean);

    return parts.join(', ') || null;
  } catch (err) {
    console.log(`  Reverse geocode failed: ${err.message}`);
    return null;
  }
}

// --- Extract GPS from EXIF ---
function extractGPS(tags) {
  try {
    const lat = tags.GPSLatitude?.description;
    const lng = tags.GPSLongitude?.description;

    if (lat != null && lng != null) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        return { lat: latNum, lng: lngNum };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// --- Main ---
async function main() {
  console.log(`Connecting to PocketBase at ${PB_URL}...`);
  const pb = new PocketBase(PB_URL);

  // Auth as admin
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log('Authenticated as admin.\n');

  // Fetch all memories that are missing location data
  const memories = await pb.collection('memories').getFullList({
    filter: 'location_lat = 0 || location_lat = null',
    sort: '-created',
  });

  console.log(`Found ${memories.length} memories without location data.`);
  if (memories.length === 0) {
    console.log('Nothing to do!');
    return;
  }

  if (DRY_RUN) {
    console.log('(DRY RUN - no changes will be made)\n');
  }

  let updated = 0;
  let skipped = 0;

  for (const memory of memories) {
    const mediaFiles = memory.media || [];
    if (mediaFiles.length === 0) {
      console.log(`[${memory.id}] "${memory.title}" - No media files, skipping.`);
      skipped++;
      continue;
    }

    let gps = null;

    // Try each image until we find one with GPS
    for (const filename of mediaFiles) {
      const fileUrl = pb.files.getUrl(memory, filename);
      try {
        const res = await fetch(fileUrl);
        if (!res.ok) {
          console.log(`  Could not download ${filename}: ${res.status}`);
          continue;
        }

        const buffer = await res.arrayBuffer();
        const tags = ExifReader.load(buffer);
        gps = extractGPS(tags);

        if (gps) {
          console.log(`[${memory.id}] "${memory.title}" - Found GPS in ${filename}: ${gps.lat}, ${gps.lng}`);
          break;
        }
      } catch (err) {
        console.log(`  Error reading EXIF from ${filename}: ${err.message}`);
      }
    }

    if (!gps) {
      console.log(`[${memory.id}] "${memory.title}" - No GPS found in any image, skipping.`);
      skipped++;
      continue;
    }

    // Reverse geocode
    const locationName = await reverseGeocode(gps.lat, gps.lng);
    console.log(`  Location name: ${locationName || '(unknown)'}`);

    if (!DRY_RUN) {
      const updateData = {
        location_lat: gps.lat,
        location_lng: gps.lng,
      };
      if (locationName) {
        updateData.location_name = locationName;
      }

      await pb.collection('memories').update(memory.id, updateData);
      console.log(`  Updated!`);
    } else {
      console.log(`  (would update)`);
    }

    updated++;

    // Be polite to Nominatim rate limit (1 req/sec)
    await new Promise(r => setTimeout(r, 1100));
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
