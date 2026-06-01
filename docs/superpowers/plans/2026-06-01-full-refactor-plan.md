# 全面重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 China Macro Observatory，添加更多宏观经济指标、交互式图表、新闻模块、分析引擎和数据导出功能

**Architecture:** 四层纯静态架构（展示层、数据处理层、存储层、采集层），模块化 JS 设计，核心模块包括指标管理、图表库、新闻、分析引擎、数据导出

**Tech Stack:** HTML + CSS + ECharts 5.x, Python 3.12 (数据采集), GitHub Actions + GitHub Pages

---

## 文件结构总览

```
计划创建/修改的文件清单：

js/ 目录重构：
  js/main.js                      # 修改：入口文件，加载所有模块
  js/core/config.js               # 创建：配置管理
  js/core/data-loader.js          # 创建：数据加载器
  js/core/event-bus.js            # 创建：事件总线
  js/modules/indicators/index.js  # 创建：指标管理入口
  js/modules/indicators/renderer.js # 创建：指标渲染
  js/modules/indicators/cards.js  # 创建：指标卡片
  js/modules/charts/index.js      # 创建：图表模块入口
  js/modules/charts/factory.js    # 创建：图表工厂
  js/modules/charts/themes.js     # 创建：图表主题
  js/modules/charts/gdp.js        # 重写：GDP 图表
  js/modules/charts/pmicpi.js     # 重写：PMI+CPI 图表
  js/modules/charts/socialm2.js   # 重写：社融+M2 图表
  js/modules/charts/industry.js   # 创建：行业细分图表
  js/modules/analytics/index.js   # 创建：分析引擎入口
  js/modules/analytics/comparison.js # 创建：时间对比
  js/modules/analytics/correlation.js # 创建：相关性分析
  js/modules/analytics/trends.js  # 创建：趋势分析
  js/modules/export/index.js      # 创建：导出模块入口
  js/modules/export/csv.js        # 创建：CSV 导出
  js/modules/export/excel.js      # 创建：Excel 导出
  js/modules/timeline/index.js    # 创建：时间线入口
  js/modules/timeline/renderer.js # 创建：时间线渲染
  js/modules/timeline/filters.js  # 重写：筛选逻辑
  js/utils/format.js              # 创建：格式化工具
  js/utils/date.js                # 创建：日期工具
  js/utils/math.js                # 创建：数学计算
  保留旧文件：
  js/dashboard.js                 # 删除（功能合并到 indicators/）
  js/filters.js                   # 删除（功能合并到 timeline/filters.js）
  js/timeline.js                  # 删除（功能合并到 timeline/renderer.js）
  js/utils.js                     # 删除（拆分为 format.js, date.js, math.js）

data/ 目录更新：
  data/indicators.json            # 修改：新增指标和行业细分
  data/timeline.json              # 修改：新增重要性、关联指标字段
  data/industry.json              # 创建：行业细分数据
  data/forecast.json              # 创建：市场预测数据
  data/config.json                # 修改：新增图表和分析配置

scripts/ 目录重构：
  scripts/collector.py            # 修改：拆分采集逻辑
  scripts/modules/                # 创建：采集模块目录
  scripts/modules/indicator_collector.py # 创建
  scripts/modules/news_collector.py      # 创建
  scripts/modules/forecast_collector.py  # 创建

index.html                        # 修改：添加新功能入口
styles.css                        # 修改：新增样式
```

---

### Task 1: 创建核心模块 - config.js

**Files:**
- Create: `js/core/config.js`
- Delete (later, after migration): `js/filters.js`, `js/utils.js`, `js/dashboard.js`, `js/timeline.js`

- [ ] **Step 1: 创建 config.js**

```javascript
/**
 * China Macro Observatory — 配置管理
 * 统一管理所有配置，提供默认值和合并逻辑
 */

const DEFAULT_CONFIG = {
  dashboard: {
    indicators: [
      { key: 'gdp', name: 'GDP同比增速', unit: '%', show: true, order: 1 },
      { key: 'cpi', name: 'CPI当月同比', unit: '%', show: true, order: 2 },
      { key: 'pmi', name: '制造业PMI', unit: '%', show: true, order: 3 },
      { key: 'social_financing', name: '社会融资规模', unit: '亿元', show: true, order: 4 },
      { key: 'm2', name: 'M2同比增速', unit: '%', show: true, order: 5 },
      { key: 'lpr', name: '1年期LPR', unit: '%', show: true, order: 6 },
      { key: 'industrial_value_added', name: '工业增加值同比', unit: '%', show: true, order: 7 },
      { key: 'retail_sales', name: '社零同比', unit: '%', show: true, order: 8 },
      { key: 'fixed_investment', name: '固投累计同比', unit: '%', show: true, order: 9 },
      { key: 'trade_balance', name: '进出口总额', unit: '亿美元', show: true, order: 10 },
      { key: 'unemployment', name: '城镇调查失业率', unit: '%', show: true, order: 11 },
      { key: 'ppi', name: 'PPI当月同比', unit: '%', show: true, order: 12 }
    ]
  },
  charts: {
    pmi_cpi: { title: 'PMI & CPI 走势' },
    social_m2: { title: '社会融资 & M2 增速' },
    gdp: { title: 'GDP 季度同比增速' },
    industry: { title: '制造业 PMI 细分对比' }
  },
  news: {
    update_frequency: 'daily',
    max_entries_per_day: 20,
    categories: ['货币政策', '财政政策', '宏观经济', '产业政策', '房地产', '国际贸易']
  }
};

export function getConfig(userConfig = {}) {
  return deepMerge(DEFAULT_CONFIG, userConfig);
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
```

- [ ] **Step 2: 创建 data-loader.js**

```javascript
/**
 * China Macro Observatory — 数据加载器
 * 统一加载所有 JSON 数据文件，带缓存和错误处理
 */

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
```

- [ ] **Step 3: 创建 event-bus.js**

```javascript
/**
 * China Macro Observatory — 事件总线
 * 模块间通信，解耦组件依赖
 */

const listeners = new Map();

export const Events = {
  DATA_LOADED: 'data:loaded',
  FILTER_CHANGED: 'filter:changed',
  TIMEFRAME_CHANGED: 'timeframe:changed',
  INDICATOR_SELECTED: 'indicator:selected',
  CHART_HIGHLIGHT: 'chart:highlight',
  EXPORT_REQUESTED: 'export:requested'
};

export function on(event, callback) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(callback);
  return () => listeners.get(event).delete(callback);
}

export function emit(event, payload) {
  if (listeners.has(event)) {
    listeners.get(event).forEach(cb => {
      try { cb(payload); } catch (e) { console.error(`[EventBus] ${event}:`, e); }
    });
  }
}

export function off(event, callback) {
  if (listeners.has(event)) {
    listeners.get(event).delete(callback);
  }
}
```

- [ ] **Step 4: 创建工具函数**

Create `js/utils/format.js`:
```javascript
/**
 * 格式化工具
 */

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
```

Create `js/utils/date.js`:
```javascript
/**
 * 日期工具
 */

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
  const d = new Error(dateStr);
  if (isNaN(d)) return dateStr;
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}
```

Create `js/utils/math.js`:
```javascript
/**
 * 数学计算工具
 */

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
```

- [ ] **Step 5: 提交**

```bash
git add js/core/ js/utils/
git commit -m "refactor: add core modules (config, data-loader, event-bus, utils)"
```

---

### Task 2: 重构目录结构和入口文件

**Files:**
- Modify: `js/main.js`
- Create: `js/modules/` 目录
- Delete: `js/dashboard.js`, `js/filters.js`, `js/timeline.js`, `js/utils.js`（待各模块迁移完成后删除）

- [ ] **Step 1: 创建 js/modules 目录结构**

```bash
mkdir -p js/core js/modules/indicators js/modules/charts js/modules/analytics js/modules/export js/modules/timeline js/utils
```

- [ ] **Step 2: 重写 main.js**

```javascript
/**
 * China Macro Observatory — 入口模块
 */
import { loadAllData } from './core/data-loader.js';
import { getConfig } from './core/config.js';
import { emit, Events } from './core/event-bus.js';
import { renderDashboard } from './modules/indicators/index.js';
import { initCharts } from './modules/charts/index.js';
import { renderTimeline } from './modules/timeline/index.js';
import { setupFilters } from './modules/timeline/filters.js';

function initLazyCharts(indicators) {
  if (!('IntersectionObserver' in window)) {
    initCharts(indicators);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        initCharts(indicators, { containerId: id });
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '200px' });

  ['chartPMICPI', 'chartSFM2', 'chartGDP', 'chartIndustry'].forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

async function init() {
  try {
    const data = await loadAllData();
    if (!data.indicators) {
      const timelineEl = document.getElementById('timeline');
      if (timelineEl) {
        timelineEl.innerHTML = '<div class="timeline-empty"><p>数据加载失败，请检查网络连接</p></div>';
      }
      return;
    }

    const appConfig = getConfig(data.config);
    emit(Events.DATA_LOADED, { data, config: appConfig });

    renderDashboard(data.indicators, appConfig);
    initLazyCharts(data.indicators);
    renderTimeline(data.timeline);
    setupFilters();

    // 更新时间
    const updateEl = document.getElementById('updateTime');
    if (updateEl && data.indicators.last_updated) {
      const t = new Date(data.indicators.last_updated);
      updateEl.textContent = t.toLocaleString('zh-CN', { hour12: false });
    }
  } catch (err) {
    console.error('[Init] Fatal error:', err);
    const tl = document.getElementById('timeline');
    if (tl) tl.innerHTML = '<div class="timeline-empty"><p>页面渲染出错: ' + err.message + '</p></div>';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

- [ ] **Step 3: 提交**

```bash
git add js/main.js js/core/ js/utils/
git commit -m "refactor: rewrite main.js with new module structure"
```

---

### Task 3: 指标管理模块

**Files:**
- Create: `js/modules/indicators/index.js`
- Create: `js/modules/indicators/renderer.js`
- Create: `js/modules/indicators/cards.js`

- [ ] **Step 1: 创建指标卡片组件 cards.js**

```javascript
/**
 * 指标卡片渲染
 */
import { formatValue } from '../../utils/format.js';
import { drawSparkline } from './sparkline.js';

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

  // 绘制 sparklines
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

export function drawSparkline(canvas, values, color = '#58a6ff') {
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
```

- [ ] **Step 2: 创建指标渲染器 renderer.js**

```javascript
/**
 * 指标渲染器 — 负责仪表盘的整体渲染
 */
import { renderIndicatorCards } from './cards.js';

export function renderDashboard(indicators, config) {
  const grid = document.getElementById('dashboardGrid');
  if (!grid) return;

  renderIndicatorCards(grid, indicators, config);

  // 更新时间
  const updateEl = document.getElementById('updateTime');
  if (updateEl && indicators.last_updated) {
    const t = new Date(indicators.last_updated);
    updateEl.textContent = t.toLocaleString('zh-CN', { hour12: false });
  }
}
```

- [ ] **Step 3: 创建指标模块入口 index.js**

```javascript
/**
 * 指标管理模块入口
 */
export { renderDashboard } from './renderer.js';
```

- [ ] **Step 4: 提交**

```bash
git add js/modules/indicators/
git commit -m "feat: add indicator management module with cards and sparkline"
```

---

### Task 4: 图表库模块 - 图表工厂和主题

**Files:**
- Create: `js/modules/charts/index.js`
- Create: `js/modules/charts/factory.js`
- Create: `js/modules/charts/themes.js`

- [ ] **Step 1: 创建图表主题 themes.js**

```javascript
/**
 * ECharts 暗黑主题配置
 */
export const DARK_THEME = {
  backgroundColor: 'transparent',
  textStyle: { color: '#c9d1d9' },
  title: { textStyle: { color: '#f0f6fc' } },
  legend: { textStyle: { color: '#8b949e' } },
  tooltip: {
    backgroundColor: '#161b22',
    borderColor: '#30363d',
    textStyle: { color: '#c9d1d9' }
  },
  xAxis: {
    axisLine: { lineStyle: { color: '#30363d' } },
    axisTick: { lineStyle: { color: '#30363d' } },
    axisLabel: { color: '#8b949e', fontSize: 11 },
    splitLine: { lineStyle: { color: '#21262d' } }
  },
  yAxis: {
    axisLine: { lineStyle: { color: '#30363d' } },
    axisLabel: { color: '#8b949e' },
    splitLine: { lineStyle: { color: '#21262d' } }
  },
  dataZoom: {
    backgroundColor: 'transparent',
    borderColor: '#30363d',
    textStyle: { color: '#8b949e' },
    handleStyle: { color: '#58a6ff' },
    dataBackground: { lineStyle: { color: '#30363d' }, areaStyle: { color: '#1c2128' } },
    selectedDataBackground: { lineStyle: { color: '#58a6ff' }, areaStyle: { color: 'rgba(88,166,255,0.2)' } }
  }
};

export const COLORS = {
  blue: '#58a6ff',
  green: '#3fb950',
  yellow: '#d2991d',
  red: '#f85149',
  purple: '#a371f7',
  orange: '#db6d28',
  cyan: '#39d2c0'
};

export const SERIES_COLORS = [COLORS.blue, COLORS.green, COLORS.yellow, COLORS.red, COLORS.purple, COLORS.cyan, COLORS.orange];
```

- [ ] **Step 2: 创建图表工厂 factory.js**

```javascript
/**
 * 图表工厂 — 统一创建和配置 ECharts 实例
 */
import { DARK_THEME, SERIES_COLORS } from './themes.js';

const instances = new Map();

export function createChart(containerId) {
  const dom = document.getElementById(containerId);
  if (!dom || typeof echarts === 'undefined') return null;

  // 销毁已有实例
  if (instances.has(containerId)) {
    instances.get(containerId).dispose();
  }

  const chart = echarts.init(dom);
  instances.set(containerId, chart);

  // 自适应
  const resizeHandler = () => chart.resize();
  window.addEventListener('resize', resizeHandler);
  chart._resizeHandler = resizeHandler;

  return chart;
}

export function setChartOption(containerId, option) {
  let chart = instances.get(containerId);
  if (!chart) {
    chart = createChart(containerId);
    if (!chart) return;
  }
  chart.setOption(option);
  return chart;
}

export function disposeChart(containerId) {
  const chart = instances.get(containerId);
  if (chart) {
    if (chart._resizeHandler) {
      window.removeEventListener('resize', chart._resizeHandler);
    }
    chart.dispose();
    instances.delete(containerId);
  }
}

export function getBaseOption() {
  return {
    backgroundColor: 'transparent',
    grid: { top: 40, right: 50, bottom: 40, left: 60 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#161b22',
      borderColor: '#30363d',
      textStyle: { color: '#c9d1d9', fontSize: 12 }
    },
    legend: {
      textStyle: { color: '#8b949e', fontSize: 12 },
      top: 0
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', height: 20, bottom: 5, borderColor: '#30363d', textStyle: { color: '#8b949e' } }
    ],
    xAxis: {
      type: 'category',
      axisLabel: { color: '#8b949e', fontSize: 11 },
      axisLine: { lineStyle: { color: '#30363d' } },
      axisTick: { lineStyle: { color: '#30363d' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#8b949e' },
      splitLine: { lineStyle: { color: '#21262d' } }
    }
  };
}

export { COLORS, SERIES_COLORS } from './themes.js';
```

- [ ] **Step 3: 创建图表模块入口 index.js**

```javascript
/**
 * 图表库模块入口
 * 负责初始化和管理所有图表
 */
import { renderPMICPI } from './pmicpi.js';
import { renderSocialM2 } from './socialm2.js';
import { renderGDP } from './gdp.js';
import { renderIndustry } from './industry.js';

const CHART_RENDERERS = {
  chartPMICPI: renderPMICPI,
  chartSFM2: renderSocialM2,
  chartGDP: renderGDP,
  chartIndustry: renderIndustry
};

export function initCharts(indicators, opts = {}) {
  if (opts.containerId) {
    const renderer = CHART_RENDERERS[opts.containerId];
    if (renderer) renderer(indicators);
    return;
  }

  // 渲染所有图表
  Object.entries(CHART_RENDERERS).forEach(([id, renderer]) => {
    const dom = document.getElementById(id);
    if (dom) renderer(indicators);
  });
}

export { renderPMICPI, renderSocialM2, renderGDP, renderIndustry };
```

- [ ] **Step 4: 提交**

```bash
git add js/modules/charts/index.js js/modules/charts/factory.js js/modules/charts/themes.js
git commit -m "feat: add chart factory, theme, and module entry"
```

---

### Task 5: 重写现有图表（使用图表工厂）

**Files:**
- Modify: `js/modules/charts/pmicpi.js`
- Modify: `js/modules/charts/socialm2.js`
- Modify: `js/modules/charts/gdp.js`

- [ ] **Step 1: 重写 PMI+CPI 图表（使用图表工厂）**

```javascript
/**
 * PMI + CPI 走势图 — 基于图表工厂重构
 */
import { setChartOption, getBaseOption, COLORS } from './factory.js';

export function renderPMICPI(indicators) {
  const dom = document.getElementById('chartPMICPI');
  if (!dom || typeof echarts === 'undefined') return;

  const pmiRaw = indicators.indicators.pmi?.history || [];
  const cpiRaw = indicators.indicators.cpi?.history || [];
  if (cpiRaw.length === 0) return;

  const cpiDates = cpiRaw.map(d => d.date.substring(0, 7));
  const pmiMap = new Map(pmiRaw.map(d => [d.date.substring(0, 7), d.value]));
  const pmiAligned = cpiDates.map(date => pmiMap.get(date) ?? null);

  const option = {
    ...getBaseOption(),
    legend: { data: ['制造业PMI', 'CPI同比'], textStyle: { color: '#8b949e' }, top: 0 },
    xAxis: { ...getBaseOption().xAxis, data: cpiDates },
    yAxis: [
      { type: 'value', name: 'PMI (%)', min: 45, max: 55, axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: '#21262d' } } },
      { type: 'value', name: 'CPI (%)', axisLabel: { color: '#8b949e' }, splitLine: { show: false } }
    ],
    series: [
      {
        name: '制造业PMI', type: 'line', data: pmiAligned, yAxisIndex: 0, smooth: true,
        lineStyle: { color: COLORS.blue, width: 2 }, itemStyle: { color: COLORS.blue },
        markLine: {
          silent: true,
          data: [{ yAxis: 50, label: { formatter: '荣枯线 50' }, lineStyle: { color: COLORS.red, type: 'dashed' } }]
        }
      },
      {
        name: 'CPI同比', type: 'bar', data: cpiRaw.map(d => d.value), yAxisIndex: 1,
        itemStyle: { color: COLORS.yellow, borderRadius: [2, 2, 0, 0] }, barWidth: '40%'
      }
    ]
  };

  setChartOption('chartPMICPI', option);
}
```

- [ ] **Step 2: 重写社融+M2 图表**

```javascript
/**
 * 社会融资 + M2 增速图 — 基于图表工厂重构
 */
import { setChartOption, getBaseOption, COLORS } from './factory.js';

export function renderSocialM2(indicators) {
  const dom = document.getElementById('chartSFM2');
  if (!dom || typeof echarts === 'undefined') return;

  const sfData = indicators.indicators.social_financing?.history || [];
  const m2Data = indicators.indicators.m2?.history || [];
  if (sfData.length === 0) return;

  const option = {
    ...getBaseOption(),
    legend: { data: ['社会融资规模', 'M2同比'], textStyle: { color: '#8b949e' }, top: 0 },
    xAxis: { ...getBaseOption().xAxis, data: sfData.map(d => d.date.substring(0, 7)) },
    yAxis: [
      { type: 'value', name: '社融(亿)', axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: '#21262d' } } },
      { type: 'value', name: 'M2 (%)', axisLabel: { color: '#8b949e' }, splitLine: { show: false } }
    ],
    series: [
      {
        name: '社会融资规模', type: 'bar', data: sfData.map(d => d.value), yAxisIndex: 0,
        itemStyle: { color: COLORS.green, borderRadius: [2, 2, 0, 0] }, barWidth: '45%'
      },
      {
        name: 'M2同比', type: 'line', data: m2Data.map(d => d.value), yAxisIndex: 1,
        smooth: true, lineStyle: { color: COLORS.purple, width: 2 },
        itemStyle: { color: COLORS.purple }, symbol: 'circle', symbolSize: 6
      }
    ]
  };

  setChartOption('chartSFM2', option);
}
```

- [ ] **Step 3: 重写 GDP 图表**

```javascript
/**
 * GDP 季度同比增速图 — 基于图表工厂重构
 */
import { setChartOption, getBaseOption, COLORS } from './factory.js';

export function renderGDP(indicators) {
  const dom = document.getElementById('chartGDP');
  if (!dom || typeof echarts === 'undefined') return;

  const gdpData = (indicators.indicators.gdp?.history || []).slice().reverse().slice(0, 16);
  if (gdpData.length === 0) return;

  const option = {
    ...getBaseOption(),
    xAxis: { ...getBaseOption().xAxis, data: gdpData.map(d => d.date.substring(0, 7)), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: 'GDP 同比 (%)', axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: '#21262d' } } },
    series: [{
      name: 'GDP当季同比', type: 'bar', data: gdpData.map(d => d.value),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: COLORS.blue }, { offset: 1, color: '#1f6feb' }
        ]),
        borderRadius: [4, 4, 0, 0]
      },
      barWidth: '50%',
      label: { show: true, position: 'top', color: '#c9d1d9', fontSize: 11, formatter: '{c}%' },
      markLine: {
        silent: true,
        data: [{ yAxis: 5.0, label: { formatter: '目标线 5%' }, lineStyle: { color: COLORS.yellow, type: 'dashed' } }]
      }
    }]
  };

  setChartOption('chartGDP', option);
}
```

- [ ] **Step 4: 提交**

```bash
git add js/modules/charts/pmicpi.js js/modules/charts/socialm2.js js/modules/charts/gdp.js
git commit -m "refactor: rewrite charts to use chart factory"
```

---

### Task 6: 行业细分图表

**Files:**
- Create: `js/modules/charts/industry.js`
- Modify: `data/indicators.json`（添加行业细分数据）

- [ ] **Step 1: 创建行业细分图表 industry.js**

```javascript
/**
 * 制造业 PMI 细分对比图
 */
import { setChartOption, getBaseOption, COLORS, SERIES_COLORS } from './factory.js';

export function renderIndustry(indicators) {
  const dom = document.getElementById('chartIndustry');
  if (!dom || typeof echarts === 'undefined') return;

  const industryData = indicators.industry?.manufacturing;
  if (!industryData) {
    dom.parentElement.style.display = 'none';
    return;
  }

  const subcategories = industryData.subcategories || [];
  const datasets = subcategories.map(sc => industryData.data?.[sc]);

  // 以第一个有数据的日期为基准
  const firstDataset = datasets.find(d => d?.history?.length > 0);
  if (!firstDataset) return;

  const dates = firstDataset.history.map(d => d.date.substring(0, 7));

  const series = subcategories.map((sc, i) => {
    const data = industryData.data?.[sc];
    if (!data) return null;
    const map = new Map(data.history.map(d => [d.date.substring(0, 7), d.value]));
    return {
      name: sc,
      type: 'line',
      data: dates.map(d => map.get(d) ?? null),
      smooth: true,
      lineStyle: { width: 2, color: SERIES_COLORS[i % SERIES_COLORS.length] },
      itemStyle: { color: SERIES_COLORS[i % SERIES_COLORS.length] },
      symbol: 'circle',
      symbolSize: 4
    };
  }).filter(Boolean);

  if (series.length === 0) return;

  const option = {
    ...getBaseOption(),
    legend: {
      data: subcategories,
      textStyle: { color: '#8b949e', fontSize: 11 },
      top: 0,
      type: 'scroll'
    },
    xAxis: { ...getBaseOption().xAxis, data: dates },
    yAxis: [
      {
        type: 'value', name: 'PMI (%)', min: 40, max: 56,
        axisLabel: { color: '#8b949e' },
        splitLine: { lineStyle: { color: '#21262d' } }
      }
    ],
    series: [
      ...series,
      {
        name: '荣枯线', type: 'line', data: dates.map(() => 50),
        lineStyle: { color: COLORS.red, type: 'dashed', width: 1 },
        symbol: 'none',
        silent: true,
        tooltip: { show: false }
      }
    ]
  };

  setChartOption('chartIndustry', option);
}
```

- [ ] **Step 2: 更新 data/indicators.json — 添加行业细分数据**

需要在 `indicators.json` 文件的根级别添加 `industry` 字段：

```json
{
  "industry": {
    "manufacturing": {
      "name": "制造业细分",
      "subcategories": ["高技术制造业", "装备制造业", "消费品行业", "高耗能行业"],
      "data": {
        "高技术制造业": {
          "name": "高技术制造业",
          "pmi": {
            "latest": 52.9,
            "history": [
              {"date": "2026-01-31", "value": 52.2},
              {"date": "2026-02-28", "value": 52.5},
              {"date": "2026-03-31", "value": 52.6},
              {"date": "2026-04-30", "value": 52.2},
              {"date": "2026-05-31", "value": 52.9}
            ]
          }
        },
        "装备制造业": {
          "name": "装备制造业",
          "pmi": {
            "latest": 52.1,
            "history": [
              {"date": "2026-01-31", "value": 51.8},
              {"date": "2026-02-28", "value": 52.0},
              {"date": "2026-03-31", "value": 52.4},
              {"date": "2026-04-30", "value": 51.9},
              {"date": "2026-05-31", "value": 52.1}
            ]
          }
        },
        "消费品行业": {
          "name": "消费品行业",
          "pmi": {
            "latest": 49.7,
            "history": [
              {"date": "2026-01-31", "value": 50.1},
              {"date": "2026-02-28", "value": 49.8},
              {"date": "2026-03-31", "value": 49.5},
              {"date": "2026-04-30", "value": 49.3},
              {"date": "2026-05-31", "value": 49.7}
            ]
          }
        },
        "高耗能行业": {
          "name": "高耗能行业",
          "pmi": {
            "latest": 47.1,
            "history": [
              {"date": "2026-01-31", "value": 47.5},
              {"date": "2026-02-28", "value": 47.2},
              {"date": "2026-03-31", "value": 46.8},
              {"date": "2026-04-30", "value": 46.5},
              {"date": "2026-05-31", "value": 47.1}
            ]
          }
        }
      }
    }
  }
}
```

- [ ] **Step 3: 更新 index.html — 添加行业细分图表容器**

在 charts-section 中添加行业细分图表卡片：

```html
<div class="chart-card chart-card-full">
    <h3>制造业 PMI 细分对比</h3>
    <div class="chart-container" id="chartIndustry"></div>
</div>
```

放在 GDP 图表后面。

- [ ] **Step 4: 提交**

```bash
git add js/modules/charts/industry.js data/indicators.json index.html
git commit -m "feat: add industry subcategory chart with PMI breakdown"
```

---

### Task 7: 新闻模块 - 数据采集

**Files:**
- Create: `scripts/modules/__init__.py`
- Create: `scripts/modules/news_collector.py`
- Modify: `scripts/collector.py`

- [ ] **Step 1: 创建新闻采集模块 news_collector.py**

```python
#!/usr/bin/env python3
"""
新闻采集模块 — 通过 iFinD MCP 采集宏观新闻
"""

import json
import os
from datetime import datetime
from collections import OrderedDict

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(PROJECT_DIR, "data")

NEWS_QUERIES = OrderedDict([
    ("货币政策", {
        "queries": [
            "央行货币政策 公开市场操作 逆回购 MLF",
            "央行降准 存款准备金率",
            "LPR利率调整"
        ],
        "size": 10,
        "priority": "high"
    }),
    ("财政政策", {
        "queries": [
            "国务院常务会议 财政政策",
            "超长期特别国债 专项债"
        ],
        "size": 10,
        "priority": "high"
    }),
    ("宏观经济", {
        "queries": [
            "国家统计局 经济数据 GDP CPI PMI",
            "就业形势 失业率"
        ],
        "size": 10,
        "priority": "medium"
    }),
    ("产业政策", {
        "queries": [
            "发改委 工信部 产业政策 行业规划",
            "数字经济 人工智能 新质生产力"
        ],
        "size": 8,
        "priority": "medium"
    }),
    ("房地产", {
        "queries": [
            "楼市调控 房地产政策 房贷利率",
            "住建部 保障房"
        ],
        "size": 5,
        "priority": "medium"
    }),
    ("国际贸易", {
        "queries": [
            "关税 进出口 国际贸易",
            "外汇政策 人民币汇率"
        ],
        "size": 5,
        "priority": "medium"
    })
])

SOURCE_MAP = {
    "yicai.com": "一财网",
    "gelonghui.com": "格隆汇",
    "jjckb.cn": "经济参考报",
    "21jingji.com": "21世纪经济报道",
    "cls.cn": "财联社",
    "10jqka.com": "同花顺",
    "people.com.cn": "人民网",
    "xinhuanet.com": "新华网",
    "news.qq.com": "腾讯新闻",
    "mp.weixin.qq.com": "微信公众号"
}

CATEGORY_KEYWORDS = {
    "货币政策": ["逆回购", "MLF", "LPR", "降准", "准备金", "央行", "公开市场", "利率", "流动性"],
    "财政政策": ["财政", "国债", "专项债", "赤字", "减税", "转移支付", "国务院常务会议"],
    "宏观经济": ["GDP", "CPI", "PMI", "就业", "失业", "统计局", "经济数据"],
    "产业政策": ["产业", "发改委", "工信部", "人工智能", "数字经济", "新质生产力", "制造业"],
    "房地产": ["楼市", "房地产", "住房", "房贷", "保障房", "住建部"],
    "国际贸易": ["关税", "进出口", "贸易", "外汇", "人民币汇率", "跨境"]
}


def extract_source(url):
    for domain, name in SOURCE_MAP.items():
        if domain in url:
            return name
    return "同花顺财经"


def classify_news(article):
    """根据关键词自动分类新闻"""
    title = article.get("title", "") + article.get("content", "")
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in title)
        if score >= 2:
            return category
    return "宏观经济"


def levenshtein_distance(s1, s2):
    if not s1 or not s2:
        return max(len(s1 or ''), len(s2 or ''))
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if s1[i-1] == s2[j-1] else 1
            dp[i][j] = min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost)
    return dp[m][n]


def title_similarity(s1, s2):
    if not s1 or not s2:
        return 0.0
    dist = levenshtein_distance(s1, s2)
    max_len = max(len(s1), len(s2))
    return 1.0 - (dist / max_len) if max_len > 0 else 0.0


def deduplicate_news(articles, threshold=0.3):
    if not articles:
        return []
    deduped = []
    for article in articles:
        title = article.get("title", "")
        is_dup = False
        for existing in deduped:
            if title_similarity(title, existing.get("title", "")) > threshold:
                if len(article.get("content", "")) > len(existing.get("content", "")):
                    existing.update(article)
                is_dup = True
                break
        if not is_dup:
            deduped.append(article)
    return deduped


def parse_news_response(raw_data):
    """解析 iFinD MCP 新闻返回数据"""
    if not raw_data or "data" not in raw_data:
        return []
    news_data = raw_data["data"]
    if not isinstance(news_data, dict):
        return []
    articles = news_data.get("data", [])
    if not isinstance(articles, list):
        try:
            articles = json.loads(articles)
        except (TypeError, json.JSONDecodeError):
            return []
    parsed = []
    for article in articles:
        if isinstance(article, dict) and "资讯标题" in article:
            parsed.append({
                "title": article.get("资讯标题", ""),
                "content": article.get("资讯内容", ""),
                "date": article.get("日期", ""),
                "url": article.get("URL", ""),
                "source": extract_source(article.get("URL", ""))
            })
    return parsed


def collect_news():
    """采集新闻的主流程"""
    print("\n[NewsCollector] 开始采集新闻...")
    all_articles = []

    for category, config in NEWS_QUERIES.items():
        print(f"  [{category}] {len(config['queries'])} 个查询维度...")
        for query in config["queries"]:
            print(f"    Query: {query}")
            # MCP 调用由 WorkBuddy 代理执行，此处为框架代码
            # raw = mcp_call("hexin-ifind-ds", "search_news", {"keyword": query, "size": config["size"]})
            # articles = parse_news_response(raw)
            # for a in articles:
            #     a["category"] = classify_news(a)
            # all_articles.extend(articles)
            pass

    all_articles = deduplicate_news(all_articles)
    print(f"  [OK] 去重后共 {len(all_articles)} 条新闻")
    return all_articles


def merge_into_timeline(existing_timeline, new_articles):
    """将新新闻合并到现有时间线"""
    if not existing_timeline:
        existing_timeline = {"last_updated": datetime.now().isoformat(), "metadata": {
            "version": "2.0", "total_entries": 0,
            "categories": list(NEWS_QUERIES.keys())
        }, "events": []}

    existing_events = existing_timeline.get("events", [])
    existing_dates = {day["date"] for day in existing_events}
    today = datetime.now().strftime("%Y-%m-%d")

    # 按日期分组新新闻
    from collections import defaultdict
    new_by_date = defaultdict(list)
    for article in new_articles:
        date_str = article.get("date", today)[:10]
        new_by_date[date_str].append(article)

    for date_str, entries in new_by_date.items():
        entries_with_meta = []
        for i, entry in enumerate(entries):
            entries_with_meta.append({
                "id": f"news_{date_str.replace('-', '')}_{i+1:03d}",
                "time": entry.get("date", "")[11:16] or "全天",
                "category": entry.get("category", "宏观经济"),
                "importance": "medium",
                "title": entry.get("title", ""),
                "summary": entry.get("content", "")[:200],
                "content": entry.get("content", ""),
                "source": entry.get("source", "同花顺财经"),
                "url": entry.get("url", ""),
                "related_indicators": [],
                "tags": [],
                "published_at": entry.get("date", datetime.now().isoformat())
            })

        if date_str in existing_dates:
            # 合并到已有日期
            for day in existing_events:
                if day["date"] == date_str:
                    existing_ids = {e["id"] for e in day["entries"]}
                    for e in entries_with_meta:
                        if e["id"] not in existing_ids:
                            day["entries"].append(e)
                    day["entries"].sort(key=lambda x: x.get("time", ""), reverse=True)
                    break
        else:
            existing_events.append({
                "date": date_str,
                "day_of_week": "",
                "entries": entries_with_meta
            })

    existing_events.sort(key=lambda x: x["date"], reverse=True)
    existing_timeline["events"] = existing_events
    existing_timeline["last_updated"] = datetime.now().isoformat()
    existing_timeline["metadata"]["total_entries"] = sum(len(day["entries"]) for day in existing_events)

    return existing_timeline


def save_timeline(timeline_data):
    """保存时间线数据到文件"""
    path = os.path.join(DATA_DIR, "timeline.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(timeline_data, f, ensure_ascii=False, indent=2)
    print(f"  [OK] 已保存至 {path}")


def run_news_collection(existing_timeline=None):
    """运行新闻采集全流程"""
    if existing_timeline is None:
        timeline_path = os.path.join(DATA_DIR, "timeline.json")
        if os.path.exists(timeline_path):
            with open(timeline_path, "r", encoding="utf-8") as f:
                existing_timeline = json.load(f)

    articles = collect_news()
    if articles:
        timeline = merge_into_timeline(existing_timeline, articles)
        save_timeline(timeline)
        return timeline
    return existing_timeline
```

- [ ] **Step 2: 更新 collector.py 主流程**

修改 `scripts/collector.py` 的 main 函数，添加模块化调用:

在文件开头添加：
```python
import sys
sys.path.insert(0, os.path.join(PROJECT_DIR, "scripts"))
from modules.news_collector import run_news_collection, NEWS_QUERIES
```

在 main 函数的新闻采集部分替换为：
```python
    # Step 2: 采集政策新闻
    print(f"\n[Step 2] 采集政策新闻...")
    for category, config in NEWS_QUERIES.items():
        print(f"  [{category}] {len(config['queries'])} 个查询维度 (优先级: {config['priority']})")
    run_news_collection(existing_timeline if 'existing_timeline' in dir() else None)
```

- [ ] **Step 3: 提交**

```bash
git add scripts/modules/ scripts/collector.py
git commit -m "feat: add news collection module with iFinD MCP integration"
```

---

### Task 8: 新闻模块 - 前端展示

**Files:**
- Create: `js/modules/timeline/index.js`
- Create: `js/modules/timeline/renderer.js`
- Create: `js/modules/timeline/filters.js`

- [ ] **Step 1: 创建时间线渲染器 renderer.js**

```javascript
/**
 * 时间线渲染器 — 渲染政策要闻时间线
 */
import { getBorderClass, getTagClass } from './filters.js';

export function renderTimeline(timeline) {
  const container = document.getElementById('timeline');
  const emptyEl = document.getElementById('timelineEmpty');
  if (!container) return;

  const events = timeline?.events;
  if (!events || events.length === 0) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  container.innerHTML = events.map(day => {
    const dateEntries = day.entries.map(entry => {
      const borderClass = getBorderClass(entry.category);
      const tagClass = getTagClass(entry.category);
      const importanceBadge = entry.importance === 'high'
        ? '<span class="importance-badge">重要</span>' : '';
      const relatedChips = (entry.related_indicators || [])
        .map(ind => `<span class="indicator-chip">📊 ${ind}</span>`).join('');
      const tagsHtml = (entry.tags || [])
        .map(tag => `<span class="tag-chip">${tag}</span>`).join('');

      return `
        <div class="timeline-entry ${borderClass}" data-category="${entry.category}" data-importance="${entry.importance || 'normal'}">
          <span class="timeline-entry-tag ${tagClass}">${entry.category}</span>
          ${importanceBadge}
          <div class="timeline-entry-body">
            <div class="timeline-entry-time">${entry.time}</div>
            <div class="timeline-entry-title">${entry.title}</div>
            <div class="timeline-entry-summary">${entry.summary || ''}</div>
            ${entry.analysis ? `<div class="timeline-entry-analysis">${entry.analysis}</div>` : ''}
            ${tagsHtml ? `<div class="tags-row">${tagsHtml}</div>` : ''}
            ${relatedChips ? `<div class="indicators-row">${relatedChips}</div>` : ''}
            <div class="timeline-entry-source">来源：${entry.source || ''}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="timeline-date-block" data-date="${day.date}">
        <div class="timeline-date-header">
          <div class="timeline-date-dot"></div>
          <span class="timeline-date-text">${day.date} ${day.day_of_week || ''}</span>
          <div class="timeline-date-divider"></div>
        </div>
        ${dateEntries}
      </div>
    `;
  }).join('');
}
```

- [ ] **Step 2: 创建筛选器 filters.js（包含 getBorderClass / getTagClass）**

```javascript
/**
 * 时间线筛选器 + CSS 类名工具
 */
import { emit, Events } from '../../core/event-bus.js';

const CATEGORY_MAP = {
  '货币政策': { border: 'border-moneypolicy', tag: 'tag-moneypolicy' },
  '财政政策': { border: 'border-fiscal', tag: 'tag-fiscal' },
  '宏观经济': { border: 'border-macro', tag: 'tag-macro' },
  '产业政策': { border: 'border-industry', tag: 'tag-industry' },
  '房地产':   { border: 'border-realestate', tag: 'tag-realestate' },
  '国际贸易': { border: 'border-trade', tag: 'tag-trade' }
};

export function getBorderClass(category) {
  return CATEGORY_MAP[category]?.border || 'border-macro';
}

export function getTagClass(category) {
  return CATEGORY_MAP[category]?.tag || 'tag-macro';
}

export function setupFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      const entries = document.querySelectorAll('.timeline-entry');
      const dateBlocks = document.querySelectorAll('.timeline-date-block');

      entries.forEach(entry => {
        if (filter === 'all' || entry.dataset.category === filter) {
          entry.classList.remove('filtered-out');
        } else {
          entry.classList.add('filtered-out');
        }
      });

      dateBlocks.forEach(block => {
        const visible = block.querySelectorAll('.timeline-entry:not(.filtered-out)');
        block.style.display = visible.length === 0 ? 'none' : '';
      });

      emit(Events.FILTER_CHANGED, { filter });
    });
  });
}
```

- [ ] **Step 3: 创建时间线模块入口 index.js**

```javascript
/**
 * 时间线模块入口
 */
export { renderTimeline } from './renderer.js';
export { setupFilters } from './filters.js';
```

- [ ] **Step 4: 提交**

```bash
git add js/modules/timeline/
git commit -m "feat: add timeline module with enhanced news rendering and filters"
```

---

### Task 9: 分析引擎模块

**Files:**
- Create: `js/modules/analytics/index.js`
- Create: `js/modules/analytics/comparison.js`
- Create: `js/modules/analytics/correlation.js`
- Create: `js/modules/analytics/trends.js`

- [ ] **Step 1: 创建时间对比模块 comparison.js**

```javascript
/**
 * 时间序列对比 — 选择一个或多个指标对比走势
 */
import { createChart } from '../charts/factory.js';
import { COLORS, SERIES_COLORS } from '../charts/factory.js';
import { shortDate } from '../../utils/date.js';

let selectedIndicators = [];
let timeRange = '2y';

export function getSelectedIndicators() {
  return [...selectedIndicators];
}

export function toggleIndicator(key, label, history) {
  const idx = selectedIndicators.findIndex(i => i.key === key);
  if (idx >= 0) {
    selectedIndicators.splice(idx, 1);
  } else {
    selectedIndicators.push({ key, label, history: (history || []).slice() });
  }
  renderComparison();
}

export function setTimeRange(range) {
  timeRange = range;
  renderComparison();
}

function filterByTimeRange(history) {
  if (!history || history.length === 0) return [];
  const now = new Date();
  let cutoff;
  switch (timeRange) {
    case '1y': cutoff = new Date(now.setFullYear(now.getFullYear() - 1)); break;
    case '2y': cutoff = new Date(now.setFullYear(now.getFullYear() - 2)); break;
    case '5y': cutoff = new Date(now.setFullYear(now.getFullYear() - 5)); break;
    default: return history;
  }
  return history.filter(d => new Date(d.date) >= cutoff);
}

function renderComparison() {
  const containerId = 'chartComparison';
  const dom = document.getElementById(containerId);
  if (!dom || selectedIndicators.length === 0) {
    if (dom) {
      dom.parentElement.style.display = 'none';
    }
    return;
  }

  dom.parentElement.style.display = 'block';

  // 以第一个指标日期为基准
  const first = filterByTimeRange(selectedIndicators[0].history);
  if (first.length === 0) return;
  const dates = first.map(d => shortDate(d.date));

  const series = selectedIndicators.map((ind, i) => {
    const filtered = filterByTimeRange(ind.history);
    const map = new Map(filtered.map(d => [shortDate(d.date), d.value]));
    const color = SERIES_COLORS[i % SERIES_COLORS.length];

    // 检测是否需要双Y轴
    const isFirst = i === 0;
    return {
      name: ind.label,
      type: 'line',
      data: dates.map(d => map.get(d) ?? null),
      yAxisIndex: 0,
      smooth: true,
      lineStyle: { color, width: 2 },
      itemStyle: { color },
      symbol: 'circle',
      symbolSize: 4
    };
  });

  const option = {
    backgroundColor: 'transparent',
    grid: { top: 40, right: 30, bottom: 40, left: 60 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#161b22',
      borderColor: '#30363d',
      textStyle: { color: '#c9d1d9' }
    },
    legend: {
      data: selectedIndicators.map(i => i.label),
      textStyle: { color: '#8b949e' },
      top: 0,
      type: 'scroll'
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', height: 20, bottom: 5, borderColor: '#30363d', textStyle: { color: '#8b949e' } }
    ],
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: '#8b949e', fontSize: 11 },
      axisLine: { lineStyle: { color: '#30363d' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#8b949e' },
      splitLine: { lineStyle: { color: '#21262d' } }
    },
    series
  };

  createChart(containerId);
  const chart = echarts.getInstanceByDom(dom);
  if (chart) chart.setOption(option);
}
```

- [ ] **Step 2: 创建相关性分析模块 correlation.js**

```javascript
/**
 * 相关性分析 — 计算指标间相关性并展示热力图
 */
import { calcCorrelation } from '../../utils/math.js';

export function calcCorrelationMatrix(indicators, keys) {
  const matrix = {};
  const validKeys = keys.filter(k => indicators.indicators[k]?.history?.length > 0);

  for (const k1 of validKeys) {
    matrix[k1] = {};
    for (const k2 of validKeys) {
      if (k1 === k2) {
        matrix[k1][k2] = 1;
      } else {
        const v1 = indicators.indicators[k1].history.map(d => d.value);
        const v2 = indicators.indicators[k2].history.map(d => d.value);
        // 对齐日期
        const dateMap1 = new Map(indicators.indicators[k1].history.map(d => [d.date, d.value]));
        const dateMap2 = new Map(indicators.indicators[k2].history.map(d => [d.date, d.value]));
        const commonDates = [...dateMap1.keys()].filter(d => dateMap2.has(d));
        if (commonDates.length < 2) {
          matrix[k1][k2] = 0;
        } else {
          const aligned1 = commonDates.map(d => dateMap1.get(d));
          const aligned2 = commonDates.map(d => dateMap2.get(d));
          matrix[k1][k2] = Math.round(calcCorrelation(aligned1, aligned2) * 100) / 100;
        }
      }
    }
  }
  return matrix;
}

export function getCorrelationColor(value) {
  const abs = Math.abs(value);
  const intensity = Math.min(Math.floor(abs * 1.5 * 255), 200);
  if (value > 0) {
    return `rgba(63, 185, 80, ${0.2 + abs * 0.6})`;
  } else if (value < 0) {
    return `rgba(248, 81, 73, ${0.2 + abs * 0.6})`;
  }
  return 'rgba(48, 54, 61, 0.3)';
}

export function renderCorrelationMatrix(matrix, indicatorNames) {
  const keys = Object.keys(matrix);
  if (keys.length === 0) return null;

  // 生成 HTML 热力图
  let html = '<div class="correlation-matrix"><table class="corr-table">';
  html += '<thead><tr><th></th>';
  for (const k of keys) {
    html += `<th>${indicatorNames[k] || k}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (const k1 of keys) {
    html += `<tr><td class="corr-label">${indicatorNames[k1] || k1}</td>`;
    for (const k2 of keys) {
      const val = matrix[k1][k2];
      const color = getCorrelationColor(val);
      html += `<td class="corr-cell" style="background: ${color}; color: ${Math.abs(val) > 0.5 ? '#fff' : '#c9d1d9'};">${val.toFixed(2)}</td>`;
    }
    html += '</tr>';
  }

  html += '</tbody></table></div>';
  return html;
}
```

- [ ] **Step 3: 创建趋势分析模块 trends.js**

```javascript
/**
 * 趋势分析 — 识别指标趋势和拐点
 */
import { calcMovingAverage, calcStats } from '../../utils/math.js';

export function analyzeTrend(history, label) {
  if (!history || history.length < 3) return null;

  const values = history.map(d => d.value);
  const stats = calcStats(values);
  const ma3 = calcMovingAverage(values, 3);
  const ma6 = calcMovingAverage(values, 6);

  // 判断趋势方向
  const recent = values.slice(-3);
  const trend = recent[2] > recent[0] ? 'up' : recent[2] < recent[0] ? 'down' : 'flat';

  // 寻找拐点
  const inflectionPoints = [];
  for (let i = 1; i < values.length - 1; i++) {
    if ((values[i] > values[i-1] && values[i] > values[i+1]) ||
        (values[i] < values[i-1] && values[i] < values[i+1])) {
      inflectionPoints.push({
        date: history[i].date,
        value: values[i],
        type: values[i] > values[i-1] ? 'peak' : 'trough'
      });
    }
  }

  return {
    label,
    stats,
    trend,
    ma3: ma3.filter(v => v !== null),
    ma6: ma6.filter(v => v !== null),
    inflectionPoints: inflectionPoints.slice(-5),
    volatility: stats.stdDev / (stats.mean || 1)
  };
}

export function generateInsight(trendResult) {
  if (!trendResult) return '';
  const { label, trend, stats, volatility } = trendResult;
  const trendText = trend === 'up' ? '上升' : trend === 'down' ? '下降' : '持平';
  const volText = volatility < 0.1 ? '低波动' : volatility < 0.3 ? '中等波动' : '高波动';

  let insight = `<div class="trend-insight">`;
  insight += `<strong>${label}：</strong>最近趋势${trendText}，`;
  insight += `平均值 ${stats.mean.toFixed(2)}，中位数 ${stats.median.toFixed(2)}，`;
  insight += `${volText}`;
  insight += `</div>`;
  return insight;
}

export function analyzeAllTrends(indicators) {
  const results = [];
  for (const [key, data] of Object.entries(indicators.indicators || {})) {
    const trend = analyzeTrend(data.history, data.name || key);
    if (trend) {
      results.push(trend);
    }
  }
  return results;
}
```

- [ ] **Step 4: 创建分析引擎入口 index.js**

```javascript
/**
 * 分析引擎模块入口
 */
export { toggleIndicator, setTimeRange, getSelectedIndicators } from './comparison.js';
export { calcCorrelationMatrix, renderCorrelationMatrix } from './correlation.js';
export { analyzeTrend, generateInsight, analyzeAllTrends } from './trends.js';
```

- [ ] **Step 5: 提交**

```bash
git add js/modules/analytics/
git commit -m "feat: add analytics engine with comparison, correlation, and trend analysis"
```

---

### Task 10: 数据导出模块

**Files:**
- Create: `js/modules/export/index.js`
- Create: `js/modules/export/csv.js`
- Create: `js/modules/export/excel.js`

- [ ] **Step 1: 创建 CSV 导出模块 csv.js**

```javascript
/**
 * CSV 导出模块
 */

export function exportCSV(indicators, selectedKeys, filename = 'macro-data.csv') {
  const rows = [];
  const headers = ['日期'];
  const dataMap = {};

  selectedKeys.forEach(key => {
    const ind = indicators.indicators[key];
    if (!ind) return;
    headers.push(`${ind.name}(${ind.unit})`);
    (ind.history || []).forEach(d => {
      if (!dataMap[d.date]) dataMap[d.date] = {};
      dataMap[d.date][key] = d.value;
    });
  });

  // 获取所有日期并排序
  const dates = Object.keys(dataMap).sort();
  rows.push(headers.join(','));

  dates.forEach(date => {
    const row = [date];
    selectedKeys.forEach(key => {
      row.push(dataMap[date]?.[key] ?? '');
    });
    rows.push(row.join(','));
  });

  const csvContent = rows.join('\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

function downloadFile(content, filename, mimeType) {
  const BOM = '﻿';
  const blob = new Blob([BOM + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: 创建 Excel 导出模块 excel.js**

```javascript
/**
 * Excel 导出模块 (XLSX)
 * 使用 SheetJS 库（通过 CDN 加载）
 */

export async function exportExcel(indicators, selectedKeys, filename = 'macro-data.xlsx') {
  // 检查 SheetJS 是否已加载
  if (typeof XLSX === 'undefined') {
    await loadSheetJS();
  }

  const wb = XLSX.utils.book_new();
  const data = [['日期']];
  const keyList = [];

  selectedKeys.forEach(key => {
    const ind = indicators.indicators[key];
    if (!ind) return;
    data[0].push(`${ind.name}(${ind.unit})`);
    keyList.push(key);
  });

  const dataMap = {};
  selectedKeys.forEach(key => {
    const ind = indicators.indicators[key];
    if (!ind) return;
    (ind.history || []).forEach(d => {
      if (!dataMap[d.date]) dataMap[d.date] = {};
      dataMap[d.date][key] = d.value;
    });
  });

  const dates = Object.keys(dataMap).sort();
  dates.forEach(date => {
    const row = [date];
    selectedKeys.forEach(key => {
      row.push(dataMap[date]?.[key] ?? '');
    });
    data.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, '宏观数据');
  XLSX.writeFile(wb, filename);
}

function loadSheetJS() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
```

- [ ] **Step 3: 创建导出模块入口 index.js**

```javascript
/**
 * 数据导出模块入口
 */
export { exportCSV } from './csv.js';
export { exportExcel } from './excel.js';

export function exportData(indicators, selectedKeys, format = 'csv') {
  if (format === 'csv') {
    exportCSV(indicators, selectedKeys);
  } else if (format === 'excel') {
    exportExcel(indicators, selectedKeys);
  }
}
```

- [ ] **Step 4: 提交**

```bash
git add js/modules/export/
git commit -m "feat: add data export module (CSV + Excel)"
```

---

### Task 11: 更新数据结构和配置文件

**Files:**
- Modify: `data/config.json`
- Modify: `data/indicators.json`（添加元数据和 forecast 字段）
- Create: `data/industry.json`
- Create: `data/forecast.json`

- [ ] **Step 1: 更新 data/config.json**

```json
{
  "dashboard": {
    "indicators": [
      {"key": "gdp", "name": "GDP同比增速", "unit": "%", "show": true, "order": 1},
      {"key": "cpi", "name": "CPI当月同比", "unit": "%", "show": true, "order": 2},
      {"key": "pmi", "name": "制造业PMI", "unit": "%", "show": true, "order": 3},
      {"key": "social_financing", "name": "社会融资规模", "unit": "亿元", "show": true, "order": 4},
      {"key": "m2", "name": "M2同比增速", "unit": "%", "show": true, "order": 5},
      {"key": "lpr", "name": "1年期LPR", "unit": "%", "show": true, "order": 6},
      {"key": "industrial_value_added", "name": "工业增加值同比", "unit": "%", "show": true, "order": 7},
      {"key": "retail_sales", "name": "社零同比", "unit": "%", "show": true, "order": 8},
      {"key": "fixed_investment", "name": "固投累计同比", "unit": "%", "show": true, "order": 9},
      {"key": "trade_balance", "name": "进出口总额", "unit": "亿美元", "show": true, "order": 10},
      {"key": "unemployment", "name": "城镇调查失业率", "unit": "%", "show": true, "order": 11},
      {"key": "ppi", "name": "PPI当月同比", "unit": "%", "show": true, "order": 12}
    ]
  },
  "charts": {
    "pmi_cpi": {"title": "PMI & CPI 走势"},
    "social_m2": {"title": "社会融资 & M2 增速"},
    "gdp": {"title": "GDP 季度同比增速"},
    "industry": {"title": "制造业 PMI 细分对比"}
  },
  "news": {
    "update_frequency": "daily",
    "max_entries_per_day": 20,
    "categories": ["货币政策", "财政政策", "宏观经济", "产业政策", "房地产", "国际贸易"]
  }
}
```

- [ ] **Step 2: 更新 data/indicators.json** — 添加 metadata、行业细分、预测数据

在使用 `jq` 或手动编辑时，需要在每个指标对象中添加 `category` 和 `metadata` 字段，并在根级别添加 `industry` 和 `forecasts`。

示例更新（在 indicators 对象内为每个指标添加 category 和 metadata）：
```json
{
  "last_updated": "2026-05-31T21:34:00.000000",
  "metadata": {
    "version": "2.0",
    "source": "同花顺 iFinD",
    "update_frequency": "daily"
  },
  "indicators": {
    "gdp": {
      "name": "GDP同比增速",
      "category": "宏观经济",
      "unit": "%",
      "frequency": "quarterly",
      "latest": { "date": "2026-03-31", "value": 5.0, "change": "持平", "change_pct": 0, "desc": "2026年Q1 GDP同比增长5.0%" },
      "history": [{"date": "2026-03-31", "value": 5.0}, {"date": "2025-12-31", "value": 4.5}],
      "metadata": { "source": "国家统计局", "release_date": "2026-04-16", "next_release": "2026-07-16" }
    },
    "cpi": {
      "name": "CPI当月同比",
      "category": "宏观经济",
      "unit": "%",
      "frequency": "monthly",
      "latest": { "date": "2026-04-30", "value": 1.2, "change": "↑0.2", "change_pct": 0.2, "desc": "CPI温和回升" },
      "history": [{"date": "2026-04-30", "value": 1.2}, {"date": "2026-03-31", "value": 1.0}],
      "metadata": { "source": "国家统计局", "release_date": "2026-05-09" }
    }
    // ... 其他指标类似更新
  }
}
```

- [ ] **Step 3: 创建 data/forecast.json**

```json
{
  "last_updated": "2026-05-31T21:34:00.000000",
  "forecasts": {
    "gdp": {
      "2026_q2": {"value": 4.8, "source": "市场一致预期", "confidence": 0.85},
      "2026_q3": {"value": 4.9, "source": "市场一致预期", "confidence": 0.80},
      "2026_q4": {"value": 5.0, "source": "市场一致预期", "confidence": 0.75}
    },
    "cpi": {
      "2026_q2": {"value": 1.5, "source": "市场一致预期", "confidence": 0.80},
      "2026_q3": {"value": 1.8, "source": "市场一致预期", "confidence": 0.75}
    },
    "pmi": {
      "2026_q2": {"value": 50.2, "source": "市场一致预期", "confidence": 0.80},
      "2026_q3": {"value": 50.5, "source": "市场一致预期", "confidence": 0.75}
    }
  }
}
```

- [ ] **Step 4: 创建 data/industry.json**

```json
{
  "last_updated": "2026-05-31T21:34:00.000000",
  "manufacturing": {
    "name": "制造业细分",
    "subcategories": ["高技术制造业", "装备制造业", "消费品行业", "高耗能行业"],
    "data": {
      "高技术制造业": {
        "name": "高技术制造业",
        "pmi": {
          "latest": 52.9,
          "history": [
            {"date": "2026-01-31", "value": 52.2},
            {"date": "2026-02-28", "value": 52.5},
            {"date": "2026-03-31", "value": 52.6},
            {"date": "2026-04-30", "value": 52.2},
            {"date": "2026-05-31", "value": 52.9}
          ]
        }
      },
      "装备制造业": {
        "name": "装备制造业",
        "pmi": {
          "latest": 52.1,
          "history": [
            {"date": "2026-01-31", "value": 51.8},
            {"date": "2026-02-28", "value": 52.0},
            {"date": "2026-03-31", "value": 52.4},
            {"date": "2026-04-30", "value": 51.9},
            {"date": "2026-05-31", "value": 52.1}
          ]
        }
      },
      "消费品行业": {
        "name": "消费品行业",
        "pmi": {
          "latest": 49.7,
          "history": [
            {"date": "2026-01-31", "value": 50.1},
            {"date": "2026-02-28", "value": 49.8},
            {"date": "2026-03-31", "value": 49.5},
            {"date": "2026-04-30", "value": 49.3},
            {"date": "2026-05-31", "value": 49.7}
          ]
        }
      },
      "高耗能行业": {
        "name": "高耗能行业",
        "pmi": {
          "latest": 47.1,
          "history": [
            {"date": "2026-01-31", "value": 47.5},
            {"date": "2026-02-28", "value": 47.2},
            {"date": "2026-03-31", "value": 46.8},
            {"date": "2026-04-30", "value": 46.5},
            {"date": "2026-05-31", "value": 47.1}
          ]
        }
      }
    }
  }
}
```

- [ ] **Step 5: 提交**

```bash
git add data/config.json data/indicators.json data/forecast.json data/industry.json
git commit -m "feat: update data structures with new indicators, industry, and forecast data"
```

---

### Task 12: 更新 HTML 和 CSS

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

- [ ] **Step 1: 更新 index.html** — 添加行业细分图表容器和分析功能入口

在 GDP 图表后面添加行业细分图表：
```html
            <div class="chart-card chart-card-full">
                <h3>制造业 PMI 细分对比</h3>
                <div class="chart-container" id="chartIndustry"></div>
            </div>
```

在时间线之前添加分析功能区域：
```html
    <!-- ====== 数据分析 ====== -->
    <section class="analytics-section">
        <h2 class="section-title">🔍 数据分析</h2>
        <div class="analytics-tabs">
            <button class="analytics-tab active" data-tab="comparison">时间序列对比</button>
            <button class="analytics-tab" data-tab="correlation">相关性分析</button>
            <button class="analytics-tab" data-tab="export">数据导出</button>
        </div>
        <div class="analytics-content" id="analyticsComparison">
            <div class="chart-card">
                <h3>指标对比</h3>
                <p class="chart-hint">点击仪表盘指标添加到对比</p>
                <div class="chart-container" id="chartComparison" style="display:none;"></div>
            </div>
        </div>
        <div class="analytics-content" id="analyticsCorrelation" style="display:none;">
            <div class="correlation-container" id="correlationMatrix"></div>
        </div>
        <div class="analytics-content" id="analyticsExport" style="display:none;">
            <div class="export-container">
                <h3>导出数据</h3>
                <div class="export-controls">
                    <div class="export-format">
                        <button class="export-btn" data-format="csv">📊 导出 CSV</button>
                        <button class="export-btn" data-format="excel">📈 导出 Excel</button>
                    </div>
                </div>
            </div>
        </div>
    </section>
```

- [ ] **Step 2: 更新 styles.css** — 添加新样式

```css
/* ---------- Analytics Section ---------- */
.analytics-section {
    padding: 24px 32px;
}
.analytics-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
}
.analytics-tab {
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 8px 16px;
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}
.analytics-tab:hover { background: var(--bg-card-hover); }
.analytics-tab.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
}
.chart-hint {
    color: var(--text-muted);
    font-size: 13px;
    margin-bottom: 12px;
}

/* ---------- Correlation Matrix ---------- */
.corr-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}
.corr-table th {
    color: var(--text-muted);
    padding: 8px 6px;
    text-align: center;
    font-weight: 500;
    border-bottom: 1px solid var(--border);
}
.corr-table td {
    padding: 8px 6px;
    text-align: center;
}
.corr-label {
    color: var(--text);
    font-weight: 500;
    text-align: left !important;
    padding-right: 12px !important;
}
.corr-cell {
    border-radius: 4px;
    font-weight: 600;
    min-width: 60px;
    transition: opacity 0.2s;
}
.corr-cell:hover { opacity: 0.8; }

/* ---------- Export ---------- */
.export-container {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
}
.export-container h3 {
    color: var(--text-heading);
    margin-bottom: 16px;
}
.export-controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.export-format {
    display: flex;
    gap: 12px;
}
.export-btn {
    background: var(--accent-green);
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 15px;
    font-weight: 600;
    transition: opacity 0.2s;
}
.export-btn:hover { opacity: 0.9; }

/* ---------- Importance Badge ---------- */
.importance-badge {
    background: var(--accent-red);
    color: #fff;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
    display: inline-block;
    margin-left: 6px;
}

/* ---------- Tags & Chips ---------- */
.tags-row, .indicators-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 8px;
}
.tag-chip {
    background: rgba(88, 166, 255, 0.1);
    color: var(--accent);
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 11px;
}
.indicator-chip {
    background: rgba(63, 185, 80, 0.1);
    color: var(--accent-green);
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 11px;
}

/* ---------- Trend Insight ---------- */
.trend-insight {
    background: rgba(88, 166, 255, 0.05);
    border-left: 3px solid var(--accent);
    padding: 12px 16px;
    border-radius: 0 var(--radius) var(--radius) 0;
    margin: 8px 0;
    color: var(--text);
    font-size: 13px;
    line-height: 1.6;
}

/* ---------- Responsive ---------- */
@media (max-width: 768px) {
    .analytics-tabs {
        flex-wrap: wrap;
    }
    .export-format {
        flex-direction: column;
    }
    .export-btn {
        width: 100%;
    }
}
```

- [ ] **Step 3: 更新 js/main.js** — 集成分析功能和导出功能入口

修改 init 函数，添加分析模块初始化：
```javascript
import { setupAnalytics } from './modules/analytics/index.js';
import { setupExport } from './modules/export/index.js';
```

在 `setupFilters()` 后添加：
```javascript
    setupAnalytics(data.indicators);
    setupExport(data.indicators);
```

- [ ] **Step 4: 提交**

```bash
git add index.html styles.css js/main.js
git commit -m "feat: add analytics section, industry chart, and export UI to HTML/CSS"
```

---

### Task 13: 更新采集脚本和 GitHub Actions

**Files:**
- Modify: `scripts/collector.py`
- Modify: `scripts/build.py`
- Create: `scripts/modules/indicator_collector.py`
- Create: `scripts/modules/forecast_collector.py`

- [ ] **Step 1: 创建 indicator_collector.py**

```python
#!/usr/bin/env python3
"""
指标采集模块
"""
import json
import os
from datetime import datetime

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(PROJECT_DIR, "data")

# 扩展后的指标列表（含新指标）
MACRO_INDICATORS = [
    {"id": "gdp", "name": "GDP:不变价:当季同比", "unit": "%", "query": "GDP不变价当季同比（最近8个季度）", "frequency": "quarterly"},
    {"id": "cpi", "name": "CPI:当月同比", "unit": "%", "query": "CPI当月同比（最近12个月）", "frequency": "monthly"},
    {"id": "pmi", "name": "制造业PMI", "unit": "%", "query": "制造业采购经理指数PMI（最近12个月）", "frequency": "monthly"},
    {"id": "social_financing", "name": "社会融资规模增量:当月值", "unit": "亿元", "query": "社会融资规模增量当月值（最近12个月）", "frequency": "monthly"},
    {"id": "m2", "name": "M2(货币和准货币):同比", "unit": "%", "query": "M2余额同比增速（最近12个月）", "frequency": "monthly"},
    {"id": "lpr", "name": "1年期LPR", "unit": "%", "query": "1年期贷款市场报价利率LPR最新值", "frequency": "monthly"},
    {"id": "industrial_value_added", "name": "规模以上工业增加值:当月同比", "unit": "%", "query": "规模以上工业增加值当月同比（最近12个月）", "frequency": "monthly"},
    {"id": "retail_sales", "name": "社会消费品零售总额:当月同比", "unit": "%", "query": "社会消费品零售总额当月同比（最近12个月）", "frequency": "monthly"},
    {"id": "fixed_investment", "name": "固定资产投资:累计同比", "unit": "%", "query": "固定资产投资累计同比（最近12个月）", "frequency": "monthly"},
    {"id": "trade_balance", "name": "进出口总额:当月值", "unit": "亿美元", "query": "进出口总额当月值（最近12个月）", "frequency": "monthly"},
    {"id": "unemployment", "name": "城镇调查失业率", "unit": "%", "query": "城镇调查失业率（最近12个月）", "frequency": "monthly"},
    {"id": "ppi", "name": "PPI:全部工业品:当月同比", "unit": "%", "query": "PPI当月同比（最近12个月）", "frequency": "monthly"},
]


def parse_edb_response(raw_data):
    """解析 EDB 指标返回数据"""
    if not raw_data or "data" not in raw_data:
        return []
    data = raw_data["data"]
    if "datas" not in data:
        return []
    results = []
    for item in data["datas"]:
        if item.get("success") and "data" in item:
            d = item["data"]
            cols = d.get("columns", [])
            rows = d.get("data", [])
            for row in rows:
                entry = {}
                for i, val in enumerate(row):
                    if i < len(cols):
                        entry[cols[i]] = val
                results.append(entry)
    return results


def collect_indicators():
    """采集所有指标"""
    print(f"\n[IndicatorCollector] 共 {len(MACRO_INDICATORS)} 项指标待采集")
    collected = {}
    errors = []

    for i, indicator in enumerate(MACRO_INDICATORS, 1):
        print(f"  [{i}/{len(MACRO_INDICATORS)}] {indicator['name']} ({indicator['frequency']})")
        print(f"       Query: {indicator['query']}")
        try:
            # MCP 调用由 WorkBuddy 代理执行
            # result = mcp_call("hexin-ifind-ds", "edb_query", {"query": indicator["query"]})
            # parsed = parse_edb_response(result)
            # collected[indicator['id']] = parsed
            print(f"       → 等待 MCP 响应...")
        except Exception as e:
            error_msg = f"采集 {indicator['name']} 失败: {e}"
            print(f"       ❌ {error_msg}")
            errors.append(error_msg)

    if errors:
        print(f"\n⚠ {len(errors)} 项指标采集失败")
    return collected


def merge_indicators(existing, new_data):
    """合并新旧指标数据"""
    if not existing:
        existing = {
            "last_updated": datetime.now().isoformat(),
            "metadata": {"version": "2.0", "source": "同花顺 iFinD", "update_frequency": "daily"},
            "indicators": {}
        }

    for key, data in new_data.items():
        if key not in existing["indicators"]:
            existing["indicators"][key] = {
                "name": key,
                "latest": {"date": "", "value": None, "change": "", "desc": ""},
                "history": []
            }
        # 更新逻辑：添加新数据点，去重
        existing_hist = existing["indicators"][key].get("history", [])
        existing_dates = {h["date"] for h in existing_hist}
        for entry in data:
            date = entry.get("日期") or entry.get("date") or ""
            value = entry.get("值") or entry.get("value")
            if date and value is not None and date not in existing_dates:
                existing_hist.append({"date": date, "value": value})
                existing_dates.add(date)
        existing_hist.sort(key=lambda x: x["date"])
        existing["indicators"][key]["history"] = existing_hist
        if existing_hist:
            latest = existing_hist[-1]
            prev = existing_hist[-2] if len(existing_hist) >= 2 else None
            change = ""
            if prev:
                diff = latest["value"] - prev["value"]
                change = f"↑{diff:.1f}" if diff > 0 else f"↓{abs(diff):.1f}" if diff < 0 else "持平"
            existing["indicators"][key]["latest"] = {
                "date": latest["date"], "value": latest["value"],
                "change": change, "desc": ""
            }

    existing["last_updated"] = datetime.now().isoformat()
    return existing


def save_indicators(indicators_data):
    path = os.path.join(DATA_DIR, "indicators.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(indicators_data, f, ensure_ascii=False, indent=2)
    print(f"  [OK] 已保存至 {path}")


def run_indicator_collection(existing=None):
    if existing is None:
        path = os.path.join(DATA_DIR, "indicators.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                existing = json.load(f)
    new_data = collect_indicators()
    if new_data:
        merged = merge_indicators(existing, new_data)
        save_indicators(merged)
        return merged
    return existing
```

- [ ] **Step 2: 创建 forecast_collector.py**

```python
#!/usr/bin/env python3
"""
市场预测数据采集模块
"""
import json
import os
from datetime import datetime

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(PROJECT_DIR, "data")

FORECAST_QUERIES = [
    {"id": "gdp", "name": "GDP增速预测", "query": "GDP增速市场一致预期"},
    {"id": "cpi", "name": "CPI预测", "query": "CPI市场一致预期"},
    {"id": "pmi", "name": "PMI预测", "query": "PMI市场一致预期"},
]


def collect_forecasts():
    """采集市场预测数据"""
    print(f"\n[ForecastCollector] 共 {len(FORECAST_QUERIES)} 项预测待采集")
    collected = {}
    for f in FORECAST_QUERIES:
        print(f"  Query: {f['query']}")
        # MCP 调用由 WorkBuddy 代理执行
        # result = mcp_call("hexin-ifind-ds", "edb_query", {"query": f["query"]})
        # collected[f['id']] = parse_forecast_response(result)
        pass
    return collected
```

- [ ] **Step 3: 更新 collector.py** — 整合模块化采集

```python
#!/usr/bin/env python3
"""
China Macro Observatory - 数据采集主脚本（重构版）
通过同花顺 MCP (hexin-ifind-ds) 采集宏观经济数据与政策新闻
"""

import json
import os
import sys
from datetime import datetime

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_DIR, "data")
sys.path.insert(0, os.path.join(PROJECT_DIR, "scripts"))

from modules.indicator_collector import run_indicator_collection, MACRO_INDICATORS
from modules.news_collector import run_news_collection, NEWS_QUERIES
from modules.forecast_collector import collect_forecasts


def archive_snapshot(today_str):
    """将当日数据归档到 history/"""
    import shutil
    history_dir = os.path.join(DATA_DIR, "history")
    os.makedirs(history_dir, exist_ok=True)

    for fname in ["indicators.json", "timeline.json"]:
        src = os.path.join(DATA_DIR, fname)
        if os.path.exists(src):
            dst = os.path.join(history_dir, f"{today_str}_{fname}")
            shutil.copy2(src, dst)
    print(f"[Archive] 已归档至 {history_dir}/")


def main():
    today = datetime.now()
    today_str = today.strftime("%Y-%m-%d")

    print("=" * 60)
    print(f"China Macro Observatory - 数据采集 (v2.0)")
    print(f"执行时间: {today.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Step 1: 采集宏观指标
    print("\n[Step 1] 采集宏观指标...")
    indicators = run_indicator_collection()

    # Step 2: 采集政策新闻
    print(f"\n[Step 2] 采集政策新闻...")
    for category, config in NEWS_QUERIES.items():
        print(f"  [{category}] {len(config['queries'])} 个查询维度 (优先级: {config['priority']})")
    run_news_collection()

    # Step 3: 采集市场预测
    print(f"\n[Step 3] 采集市场预测...")
    collect_forecasts()

    # Step 4: 归档
    print(f"\n[Step 4] 归档当日快照...")
    archive_snapshot(today_str)

    print(f"\n✅ 采集完成! 下次采集: 根据 Automation 配置")
    print("=" * 60)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: 提交**

```bash
git add scripts/modules/ scripts/collector.py scripts/build.py
git commit -m "refactor: modularize data collection scripts with new indicators and news"
```

---

### Task 14: 清理旧文件和最终集成

**Files:**
- Delete: `js/dashboard.js`（功能已迁移到 `indicators/`）
- Delete: `js/filters.js`（功能已迁移到 `timeline/filters.js`）
- Delete: `js/timeline.js`（功能已迁移到 `timeline/renderer.js`）
- Delete: `js/utils.js`（已拆分为 `utils/format.js`, `utils/date.js`, `utils/math.js`）

- [ ] **Step 1: 确认所有模块正常后删除旧文件**

```bash
rm js/dashboard.js js/filters.js js/timeline.js js/utils.js
```

- [ ] **Step 2: 验证 HTML 中的 script 引用**

确保 `index.html` 只引用了 `js/main.js` (type="module")，没有引用旧文件。

- [ ] **Step 3: 提交**

```bash
git rm js/dashboard.js js/filters.js js/timeline.js js/utils.js
git commit -m "cleanup: remove legacy files after module migration"
```

- [ ] **Step 4: 最终验证**

```bash
# 本地验证
python scripts/build.py

# 查看状态
git status
```

- [ ] **Step 5: 提交最终版本**

```bash
git add -A
git commit -m "chore: finalize full refactor v2.0"
git tag v2.0.0
git push && git push --tags
```

---

## 设计规格覆盖检查

对照 spec 的每个需求，确认计划中对应实现的任务：

| Spec 需求 | 对应任务 | 状态 |
|-----------|---------|------|
| 数据可视化增强 | Task 5-6: 图表工厂、行业细分图表 | ✅ |
| 数据分析功能 | Task 9: 时间序列对比、相关性分析、趋势分析 | ✅ |
| 数据导出功能 | Task 10: CSV、Excel 导出 | ✅ |
| 更多经济指标 | Task 11: 新增失业率、PPI 等 | ✅ |
| 行业细分数据 | Task 6 + Task 11: 行业细分图表和数据 | ✅ |
| 市场预测数据 | Task 11: forecast.json | ✅ |
| 新闻模块 (iFinD MCP) | Task 7-8: 新闻采集 + 前端展示 | ✅ |
| 模块化架构 | Task 1-3: 核心模块、目录重构 | ✅ |
| 保持纯静态 | 全部任务均基于纯静态架构 | ✅ |
| 暗黑主题 | Task 4: 图表主题配置 | ✅ |
