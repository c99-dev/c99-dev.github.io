export const STORAGE_KEYS = {
  BANNED_CHAMPIONS: 'lolApp_bannedChampions',
  TABLE_OPTIONS: 'lolApp_tableOptions',
  SORT_OPTION: 'lolApp_sortOption',
  DISPLAY_COUNT: 'lolApp_displayCount',
  TIER_DISPLAY: 'lolApp_tierDisplay',
};

export const DEFAULT_TABLE_OPTIONS = {
  rank: false,
  winrate: false,
  tier: true,
  tierDisplay: true, // 티어표시 (티어, 꿀벌, OP) 기본값
};

export function getFromStorage(key, defaultValue) {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue === null) return defaultValue;
    const value = JSON.parse(storedValue);
    if (key === STORAGE_KEYS.DISPLAY_COUNT) {
      return Number.isInteger(value) && value > 0 && value <= 100
        ? value
        : defaultValue;
    }
    if (key === STORAGE_KEYS.SORT_OPTION) {
      return ['tier', 'alphabetical', 'random'].includes(value)
        ? value
        : defaultValue;
    }
    if (Array.isArray(defaultValue)) {
      return Array.isArray(value)
        ? [...new Set(value.filter(id => typeof id === 'string'))]
        : defaultValue;
    }
    if (typeof defaultValue === 'object') {
      return Object.fromEntries(
        Object.entries(defaultValue).map(([name, fallback]) => [
          name,
          typeof value?.[name] === 'boolean' ? value[name] : fallback,
        ]),
      );
    }
    return typeof value === typeof defaultValue ? value : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

export function setToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // 저장소가 차단된 브라우저에서도 현재 세션은 계속 사용할 수 있습니다.
  }
}
