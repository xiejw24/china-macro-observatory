/**
 * PMI + CPI 走势图
 * 修复：以 CPI 日期为 X 轴基准，PMI 缺失月份用 null 填充
 */
export function renderPMICPI(indicators) {
  const dom = document.getElementById('chartPMICPI');
  if (!dom || typeof echarts === 'undefined') return;
  const chart = echarts.init(dom);

  const pmiRaw = indicators.indicators.pmi?.history || [];
  const cpiRaw = indicators.indicators.cpi?.history || [];

  // 以 CPI 日期为 X 轴基准
  const cpiDates = cpiRaw.map(d => d.date.substring(0, 7));
  const pmiMap = new Map(pmiRaw.map(d => [d.date.substring(0, 7), d.value]));

  const pmiAligned = cpiDates.map(date => pmiMap.get(date) ?? null);

  const option = {
    backgroundColor: 'transparent',
    grid: { top: 40, right: 50, bottom: 30, left: 50 },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['制造业PMI', 'CPI同比'],
      textStyle: { color: '#8b949e' },
      top: 0
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', height: 20, bottom: 5, borderColor: '#30363d', textStyle: { color: '#8b949e' } }
    ],
    xAxis: {
      type: 'category',
      data: cpiDates,
      axisLabel: { color: '#8b949e', fontSize: 11 },
      axisLine: { lineStyle: { color: '#30363d' } }
    },
    yAxis: [
      {
        type: 'value',
        name: 'PMI (%)',
        min: 45,
        max: 55,
        axisLabel: { color: '#8b949e' },
        splitLine: { lineStyle: { color: '#21262d' } }
      },
      {
        type: 'value',
        name: 'CPI (%)',
        axisLabel: { color: '#8b949e' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '制造业PMI',
        type: 'line',
        data: pmiAligned,
        yAxisIndex: 0,
        smooth: true,
        lineStyle: { color: '#58a6ff', width: 2 },
        itemStyle: { color: '#58a6ff' },
        markLine: {
          silent: true,
          data: [{ yAxis: 50, label: { formatter: '荣枯线 50' }, lineStyle: { color: '#f85149', type: 'dashed' } }]
        }
      },
      {
        name: 'CPI同比',
        type: 'bar',
        data: cpiRaw.map(d => d.value),
        yAxisIndex: 1,
        itemStyle: { color: '#d2991d', borderRadius: [2, 2, 0, 0] },
        barWidth: '40%'
      }
    ]
  };
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
}
