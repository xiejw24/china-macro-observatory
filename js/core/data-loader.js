const DATA_CACHE = new Map();

export async function loadData(path) {
  if (DATA_CACHE.has(path)) {
    return DATA_CACHE.get(path);
  }
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
    const data = await res.json();
    DATA_CACHE.set(path, data);
    return data;
  } catch (err) {
    console.error(`[DataLoader] Failed to load ${path}:`, err);
    return null;
  }
}

export function clearCache() {
  DATA_CACHE.clear();
}

export async function loadAllData() {
  const [indicators, timeline, config, industry, forecast] = await Promise.all([
    loadData('data/indicators.json'),
    loadData('data/timeline.json'),
    loadData('data/config.json'),
    loadData('data/industry.json').catch(() => null),
    loadData('data/forecast.json').catch(() => null)
  ]);
  return { indicators, timeline, config, industry, forecast };
}
