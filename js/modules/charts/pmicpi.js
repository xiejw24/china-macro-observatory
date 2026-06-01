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

  setChartOption('chartPMICPI', {
    ...getBaseOption(),
    legend: { data: ['制造业PMI', 'CPI同比'], textStyle: { color: '#8b949e' }, top: 0 },
    xAxis: { ...getBaseOption().xAxis, data: cpiDates },
    yAxis: [
      { type: 'value', name: 'PMI (%)', min: 45, max: 55, axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: '#21262d' } } },
      { type: 'value', name: 'CPI (%)', axisLabel: { color: '#8b949e' }, splitLine: { show: false } }
    ],
    series: [
      { name: '制造业PMI', type: 'line', data: pmiAligned, yAxisIndex: 0, smooth: true, lineStyle: { color: COLORS.blue, width: 2 }, itemStyle: { color: COLORS.blue }, markLine: { silent: true, data: [{ yAxis: 50, label: { formatter: '荣枯线 50' }, lineStyle: { color: COLORS.red, type: 'dashed' } }] } },
      { name: 'CPI同比', type: 'bar', data: cpiRaw.map(d => d.value), yAxisIndex: 1, itemStyle: { color: COLORS.yellow, borderRadius: [2, 2, 0, 0] }, barWidth: '40%' }
    ]
  });
}
