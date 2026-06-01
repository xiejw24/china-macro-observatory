import { on, emit, Events } from '../../core/event-bus.js';
import { calcCorrelation } from '../../utils/math.js';

let selectedIndicators = [];

export function setupAnalytics(indicators) {
  setupComparisonTab(indicators);
  setupCorrelationTab(indicators);
  setupTabSwitching();
}

function setupTabSwitching() {
  const tabs = document.querySelectorAll('.analytics-tab');
  const contents = document.querySelectorAll('.analytics-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      contents.forEach(c => c.style.display = 'none');
      const targetEl = document.getElementById(`analytics${target.charAt(0).toUpperCase() + target.slice(1)}`);
      if (targetEl) targetEl.style.display = 'block';
    });
  });
}

function setupComparisonTab(indicators) {
  on(Events.INDICATOR_SELECTED, ({ key, label, history }) => {
    const idx = selectedIndicators.findIndex(i => i.key === key);
    if (idx >= 0) {
      selectedIndicators.splice(idx, 1);
    } else {
      selectedIndicators.push({ key, label, history: (history || []).slice() });
    }
    renderComparison();
  });
}

function renderComparison() {
  const containerId = 'chartComparison';
  const dom = document.getElementById(containerId);
  if (!dom) return;
  if (selectedIndicators.length === 0) {
    dom.style.display = 'none';
    return;
  }
  dom.style.display = 'block';
  if (typeof echarts === 'undefined') return;

  const dates = selectedIndicators[0].history.map(d => d.date.substring(0, 7));
  const SERIES_COLORS = ['#58a6ff', '#3fb950', '#d2991d', '#f85149', '#a371f7', '#39d2c0', '#db6d28'];

  const series = selectedIndicators.map((ind, i) => {
    const map = new Map(ind.history.map(d => [d.date.substring(0, 7), d.value]));
    const color = SERIES_COLORS[i % SERIES_COLORS.length];
    return {
      name: ind.label, type: 'line', data: dates.map(d => map.get(d) ?? null),
      smooth: true, lineStyle: { color, width: 2 }, itemStyle: { color },
      symbol: 'circle', symbolSize: 4
    };
  });

  let chart = echarts.getInstanceByDom(dom);
  if (!chart) chart = echarts.init(dom);
  chart.setOption({
    backgroundColor: 'transparent',
    grid: { top: 40, right: 30, bottom: 40, left: 60 },
    tooltip: { trigger: 'axis', backgroundColor: '#161b22', borderColor: '#30363d', textStyle: { color: '#c9d1d9' } },
    legend: { data: selectedIndicators.map(i => i.label), textStyle: { color: '#8b949e' }, top: 0, type: 'scroll' },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', height: 20, bottom: 5, borderColor: '#30363d', textStyle: { color: '#8b949e' } }
    ],
    xAxis: { type: 'category', data: dates, axisLabel: { color: '#8b949e', fontSize: 11 }, axisLine: { lineStyle: { color: '#30363d' } } },
    yAxis: { type: 'value', axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: '#21262d' } } },
    series
  });
}

function setupCorrelationTab(indicators) {
  const matrixEl = document.getElementById('correlationMatrix');
  if (!matrixEl) return;

  const keys = ['gdp', 'cpi', 'pmi', 'social_financing', 'm2', 'lpr', 'industrial_value_added', 'retail_sales', 'fixed_investment', 'trade_balance', 'unemployment', 'ppi'];
  const validKeys = keys.filter(k => indicators.indicators?.[k]?.history?.length > 2);

  const matrix = {};
  for (const k1 of validKeys) {
    matrix[k1] = {};
    for (const k2 of validKeys) {
      if (k1 === k2) { matrix[k1][k2] = 1; continue; }
      const v1 = indicators.indicators[k1].history;
      const v2 = indicators.indicators[k2].history;
      const dateMap1 = new Map(v1.map(d => [d.date, d.value]));
      const dateMap2 = new Map(v2.map(d => [d.date, d.value]));
      const common = [...dateMap1.keys()].filter(d => dateMap2.has(d));
      if (common.length < 2) { matrix[k1][k2] = 0; }
      else {
        const aligned1 = common.map(d => dateMap1.get(d));
        const aligned2 = common.map(d => dateMap2.get(d));
        matrix[k1][k2] = Math.round(calcCorrelation(aligned1, aligned2) * 100) / 100;
      }
    }
  }

  const names = {};
  for (const k of validKeys) names[k] = indicators.indicators[k]?.name || k;

  let html = '<table class="corr-table"><thead><tr><th></th>';
  for (const k of validKeys) html += `<th>${names[k]}</th>`;
  html += '</tr></thead><tbody>';
  for (const k1 of validKeys) {
    html += `<tr><td class="corr-label">${names[k1]}</td>`;
    for (const k2 of validKeys) {
      const val = matrix[k1][k2];
      const abs = Math.abs(val);
      const color = val > 0 ? `rgba(63,185,80,${0.2 + abs * 0.6})` : val < 0 ? `rgba(248,81,73,${0.2 + abs * 0.6})` : 'rgba(48,54,61,0.3)';
      const textColor = abs > 0.5 ? '#fff' : '#c9d1d9';
      html += `<td class="corr-cell" style="background:${color};color:${textColor};">${val.toFixed(2)}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  matrixEl.innerHTML = html;
}
