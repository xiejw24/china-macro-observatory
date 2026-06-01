export function calcStats(values) {
  if (!values || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  const median = n % 2 === 0 ? (sorted[n/2 - 1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)];
  const min = sorted[0];
  const max = sorted[n - 1];
  const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  return { mean, median, min, max, stdDev, count: n };
}

export function calcCorrelation(x, y) {
  if (!x || !y || x.length !== y.length || x.length < 2) return 0;
  const n = x.length;
  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;
  const num = x.reduce((s, xi, i) => s + (xi - meanX) * (y[i] - meanY), 0);
  const denX = Math.sqrt(x.reduce((s, xi) => s + (xi - meanX) ** 2, 0));
  const denY = Math.sqrt(y.reduce((s, yi) => s + (yi - meanY) ** 2, 0));
  if (denX === 0 || denY === 0) return 0;
  return num / (denX * denY);
}

export function calcMovingAverage(data, window = 3) {
  if (!data || data.length < window) return data;
  return data.map((_, i) => {
    if (i < window - 1) return null;
    const slice = data.slice(i - window + 1, i + 1);
    return slice.reduce((s, v) => s + v, 0) / window;
  });
}
