import { formatValue } from '../../utils/format.js';

export function renderIndicatorCards(grid, indicators, config) {
  const inds = indicators.indicators;
  const indicatorConfig = config?.dashboard?.indicators || [];

  grid.innerHTML = indicatorConfig
    .filter(item => item.show)
    .sort((a, b) => a.order - b.order)
    .map(item => {
      const data = inds[item.key];
      if (!data) return '';
      const latest = data.latest;
      if (!latest) return '';
      const changeCls = latest.change?.startsWith('↑') ? 'change-up' :
                        latest.change?.startsWith('↓') ? 'change-down' : 'change-flat';
      return `
        <div class="indicator-card" data-indicator="${item.key}" data-category="${data.category || ''}">
          <div class="indicator-name">${item.name}</div>
          <div>
            <span class="indicator-value">${formatValue(latest.value, item.unit)}</span>
            <span class="indicator-unit">${item.unit}</span>
          </div>
          <div class="indicator-change ${changeCls}">${latest.change || '--'}</div>
          <div class="indicator-date">${latest.date || '--'}</div>
          <div class="indicator-desc">${latest.desc || ''}</div>
          <canvas class="sparkline" data-history='${JSON.stringify(data.history || [])}' width="140" height="30"></canvas>
        </div>
      `;
    }).join('');

  grid.querySelectorAll('.sparkline').forEach(canvas => {
    try {
      const history = JSON.parse(canvas.dataset.history);
      if (history.length > 1) {
        drawSparkline(canvas, history.map(d => d.value), '#58a6ff');
      }
    } catch (e) {
      console.warn('[Sparkline] Error:', e);
    }
  });
}

function drawSparkline(canvas, values, color = '#58a6ff') {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  if (!values || values.length < 2) return;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  values.forEach((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}
