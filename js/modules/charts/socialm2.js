import { setChartOption, getBaseOption, COLORS } from './factory.js';

export function renderSocialM2(indicators) {
  const dom = document.getElementById('chartSFM2');
  if (!dom || typeof echarts === 'undefined') return;
  const sfData = indicators.indicators.social_financing?.history || [];
  const m2Data = indicators.indicators.m2?.history || [];
  if (sfData.length === 0) return;

  setChartOption('chartSFM2', {
    ...getBaseOption(),
    legend: { data: ['社会融资规模', 'M2同比'], textStyle: { color: '#8b949e' }, top: 0 },
    xAxis: { ...getBaseOption().xAxis, data: sfData.map(d => d.date.substring(0, 7)) },
    yAxis: [
      { type: 'value', name: '社融(亿)', axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: '#21262d' } } },
      { type: 'value', name: 'M2 (%)', axisLabel: { color: '#8b949e' }, splitLine: { show: false } }
    ],
    series: [
      { name: '社会融资规模', type: 'bar', data: sfData.map(d => d.value), yAxisIndex: 0, itemStyle: { color: COLORS.green, borderRadius: [2, 2, 0, 0] }, barWidth: '45%' },
      { name: 'M2同比', type: 'line', data: m2Data.map(d => d.value), yAxisIndex: 1, smooth: true, lineStyle: { color: COLORS.purple, width: 2 }, itemStyle: { color: COLORS.purple }, symbol: 'circle', symbolSize: 6 }
    ]
  });
}
