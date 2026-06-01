export function shortDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.substring(0, 7);
}

export function formatDate(dateStr) {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return dateStr;
  }
}

export function getDayOfWeek(dateStr) {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  try {
    const d = new Date(dateStr);
    return days[d.getDay()];
  } catch {
    return '';
  }
}

export function getTimeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}
