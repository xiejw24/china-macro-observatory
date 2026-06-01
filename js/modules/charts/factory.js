const instances = new Map();

export function createChart(containerId) {
  const dom = document.getElementById(containerId);
  if (!dom || typeof echarts === 'undefined') return null;
  if (instances.has(containerId)) instances.get(containerId).dispose();
  const chart = echarts.init(dom);
  instances.set(containerId, chart);
  const resizeHandler = () => chart.resize();
  window.addEventListener('resize', resizeHandler);
  chart._resizeHandler = resizeHandler;
  return chart;
}

export function setChartOption(containerId, option) {
  let chart = instances.get(containerId);
  if (!chart) { chart = createChart(containerId); if (!chart) return; }
  chart.setOption(option);
  return chart;
}

export function disposeChart(containerId) {
  const chart = instances.get(containerId);
  if (chart) { if (chart._resizeHandler) window.removeEventListener('resize', chart._resizeHandler); chart.dispose(); instances.delete(containerId); }
}

export function getBaseOption() {
  return {
    backgroundColor: 'transparent',
    grid: { top: 40, right: 50, bottom: 40, left: 60 },
    tooltip: { trigger: 'axis', backgroundColor: '#161b22', borderColor: '#30363d', textStyle: { color: '#c9d1d9', fontSize: 12 } },
    legend: { textStyle: { color: '#8b949e', fontSize: 12 }, top: 0 },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', height: 20, bottom: 5, borderColor: '#30363d', textStyle: { color: '#8b949e' } }
    ],
    xAxis: { type: 'category', axisLabel: { color: '#8b949e', fontSize: 11 }, axisLine: { lineStyle: { color: '#30363d' } }, axisTick: { lineStyle: { color: '#30363d' } } },
    yAxis: { type: 'value', axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: '#21262d' } } }
  };
}

export { COLORS, SERIES_COLORS } from './themes.js';
