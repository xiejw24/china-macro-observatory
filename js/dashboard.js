/**
 * China Macro Observatory — 仪表盘渲染
 */
import { formatValue, drawSparkline } from './utils.js';

/**
 * 渲染仪表盘卡片（全部10项指标）
 * @param {Object} indicators - indicators.json 数据
 * @param {Object} config - config.json 配置
 */
export function renderDashboard(indicators, config) {
  const grid = document.getElementById('dashboardGrid');
  if (!grid) return;

  const inds = indicators.indicators;
  const indicatorConfig = config?.dashboard?.indicators || [];

  grid.innerHTML = indicatorConfig
    .filter(item => item.show)
    .sort((a, b) => a.order - b.order)
    .map(item => {
      const data = inds[item.key];
      if (!data) return '';
      const latest = data.latest;
      const changeClass = latest.change.startsWith('↑') ? 'change-up' :
                         latest.change.startsWith('↓') ? 'change-down' : 'change-flat';
      return `
        <div class="indicator-card" data-indicator="${item.key}">
          <div class="indicator-name">${item.name}</div>
          <div>
            <span class="indicator-value">${formatValue(latest.value, item.unit)}</span>
            <span class="indicator-unit">${item.unit}</span>
          </div>
          <div class="indicator-change ${changeClass}">${latest.change}</div>
          <div class="indicator-date">${latest.date}</div>
          <div class="indicator-desc">${latest.desc}</div>
          <canvas class="sparkline" data-history='${JSON.stringify(data.history || [])}' width="140" height="30"></canvas>
        </div>
      `;
    }).join('');

  // 绘制 sparklines
  grid.querySelectorAll('.sparkline').forEach(canvas => {
    try {
      const history = JSON.parse(canvas.dataset.history);
      if (history.length > 1) {
        drawSparkline(canvas, history, '#58a6ff');
      }
    } catch (e) {
      console.warn('[Sparkline] Error:', e);
    }
  });

  // 更新时间
  const updateEl = document.getElementById('updateTime');
  if (updateEl) {
    const t = new Date(indicators.last_updated);
    updateEl.textContent = t.toLocaleString('zh-CN', { hour12: false });
  }
}
