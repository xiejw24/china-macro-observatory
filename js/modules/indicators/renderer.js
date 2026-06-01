import { renderIndicatorCards } from './cards.js';

export function renderDashboard(indicators, config) {
  const grid = document.getElementById('dashboardGrid');
  if (!grid) return;
  renderIndicatorCards(grid, indicators, config);

  const updateEl = document.getElementById('updateTime');
  if (updateEl && indicators.last_updated) {
    const t = new Date(indicators.last_updated);
    updateEl.textContent = t.toLocaleString('zh-CN', { hour12: false });
  }
}
