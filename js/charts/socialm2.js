/**
 * 社会融资 + M2 增速图
 */
export function renderSocialM2(indicators) {
  const dom = document.getElementById('chartSFM2');
  if (!dom || typeof echarts === 'undefined') return;
  const chart = echarts.init(dom);

  const sfData = indicators.indicators.social_financing?.history || [];
  const m2Data = indicators.indicators.m2?.history || [];

  const option = {
    backgroundColor: 'transparent',
    grid: { top: 40, right: 50, bottom: 30, left: 60 },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['社会融资规模', 'M2同比'],
      textStyle: { color: '#8b949e' },
      top: 0
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', height: 20, bottom: 5, borderColor: '#30363d', textStyle: { color: '#8b949e' } }
    ],
    xAxis: {
      type: 'category',
      data: sfData.map(d => d.date.substring(0, 7)),
      axisLabel: { color: '#8b949e', fontSize: 11 },
      axisLine: { lineStyle: { color: '#30363d' } }
    },
    yAxis: [
      {
        type: 'value',
        name: '社融(亿)',
        axisLabel: { color: '#8b949e' },
        splitLine: { lineStyle: { color: '#21262d' } }
      },
      {
        type: 'value',
        name: 'M2 (%)',
        axisLabel: { color: '#8b949e' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '社会融资规模',
        type: 'bar',
        data: sfData.map(d => d.value),
        yAxisIndex: 0,
        itemStyle: { color: '#3fb950', borderRadius: [2, 2, 0, 0] },
        barWidth: '45%'
      },
      {
        name: 'M2同比',
        type: 'line',
        data: m2Data.map(d => d.value),
        yAxisIndex: 1,
        smooth: true,
        lineStyle: { color: '#a371f7', width: 2 },
        itemStyle: { color: '#a371f7' },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  };
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
}
