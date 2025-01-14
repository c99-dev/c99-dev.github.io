export const STORAGE_KEYS = {
  BANNED_CHAMPIONS: "lolApp_bannedChampions",
  TABLE_OPTIONS: "lolApp_tableOptions",
  SORT_OPTION: "lolApp_sortOption",
};

export const DEFAULT_TABLE_OPTIONS = {
  rank: false,
  winrate: false,
  tier: true,
};

export function getFromStorage(key, defaultValue) {
  const storedValue = localStorage.getItem(key);
  if (storedValue === null) {
    return defaultValue;
  }
  try {
    return JSON.parse(storedValue);
  } catch (error) {
    console.error(`Error parsing stored value for key ${key}:`, error);
    return defaultValue;
  }
}

export function setToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
