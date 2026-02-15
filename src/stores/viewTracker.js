import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'logbook_last_viewed';

let cache = null;

async function loadMap() {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : {};
  } catch {
    cache = {};
  }
  return cache;
}

async function saveMap(map) {
  cache = map;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export async function markViewed(logbookId) {
  const map = await loadMap();
  map[logbookId] = new Date().toISOString();
  await saveMap(map);
}

export async function getLastViewed(logbookId) {
  const map = await loadMap();
  return map[logbookId] || null;
}

export async function getLastViewedMap() {
  return loadMap();
}
