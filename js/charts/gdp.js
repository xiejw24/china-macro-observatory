/**
 * GDP 季度同比增速图
 */
export function renderGDP(indicators) {
  const dom = document.getElementById('chartGDP');
  if (!dom || typeof echarts === 'undefined') return;
  const chart = echarts.init(dom);

  const gdpData = (indicators.indicators.gdp?.history || []).slice().reverse().slice(0, 16);

  const option = {
    backgroundColor: 'transparent',
    grid: { top: 30, right: 40, bottom: 30, left: 60 },
    tooltip: { trigger: 'axis' },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', height: 20, bottom: 5, borderColor: '#30363d', textStyle: { color: '#8b949e' } }
    ],
    xAxis: {
      type: 'category',
      data: gdpData.map(d => d.date.substring(0, 7)),
      axisLabel: { color: '#8b949e', fontSize: 11, rotate: 30 },
      axisLine: { lineStyle: { color: '#30363d' } }
    },
    yAxis: {
      type: 'value',
      name: 'GDP 同比 (%)',
      axisLabel: { color: '#8b949e' },
      splitLine: { lineStyle: { color: '#21262d' } }
    },
    series: [
      {
        name: 'GDP当季同比',
        type: 'bar',
        data: gdpData.map(d => d.value),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#58a6ff' },
            { offset: 1, color: '#1f6feb' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          color: '#c9d1d9',
          fontSize: 11,
          formatter: '{c}%'
        },
        markLine: {
          silent: true,
          data: [
            { yAxis: 5.0, label: { formatter: '目标线 5%' }, lineStyle: { color: '#d2991d', type: 'dashed' } }
          ]
        }
      }
    ]
  };
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
}
