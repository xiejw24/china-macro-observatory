export function formatValue(val, unit) {
  if (val === null || val === undefined) return '--';
  if (unit === '亿元' && val >= 10000) return (val / 10000).toFixed(2) + '万亿';
  if (unit === '亿元' && val >= 1000) return val.toFixed(0) + '亿';
  if (unit === '亿美元' && val >= 1000) return val.toFixed(0) + '亿';
  return val;
}

export function formatPercentage(val, decimals = 1) {
  if (val === null || val === undefined) return '--';
  return Number(val).toFixed(decimals) + '%';
}

export function formatChange(change) {
  if (!change) return { text: '--', cls: 'change-flat' };
  const cls = change.startsWith('↑') ? 'change-up' :
              change.startsWith('↓') ? 'change-down' : 'change-flat';
  return { text: change, cls };
}
