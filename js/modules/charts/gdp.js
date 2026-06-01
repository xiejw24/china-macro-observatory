import { setChartOption, getBaseOption, COLORS } from './factory.js';

export function renderGDP(indicators) {
  const dom = document.getElementById('chartGDP');
  if (!dom || typeof echarts === 'undefined') return;
  const gdpData = (indicators.indicators.gdp?.history || []).slice().reverse().slice(0, 16);
  if (gdpData.length === 0) return;

  setChartOption('chartGDP', {
    ...getBaseOption(),
    xAxis: { ...getBaseOption().xAxis, data: gdpData.map(d => d.date.substring(0, 7)), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: 'GDP 同比 (%)', axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: '#21262d' } } },
    series: [{
      name: 'GDP当季同比', type: 'bar', data: gdpData.map(d => d.value),
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: COLORS.blue }, { offset: 1, color: '#1f6feb' }]), borderRadius: [4, 4, 0, 0] },
      barWidth: '50%',
      label: { show: true, position: 'top', color: '#c9d1d9', fontSize: 11, formatter: '{c}%' },
      markLine: { silent: true, data: [{ yAxis: 5.0, label: { formatter: '目标线 5%' }, lineStyle: { color: COLORS.yellow, type: 'dashed' } }] }
    }]
  });
}
