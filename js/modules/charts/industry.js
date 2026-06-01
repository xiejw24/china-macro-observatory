import { setChartOption, getBaseOption, COLORS, SERIES_COLORS } from './factory.js';

export function renderIndustry(indicators) {
  const dom = document.getElementById('chartIndustry');
  if (!dom || typeof echarts === 'undefined') return;
  const industryData = indicators.industry?.manufacturing;
  if (!industryData) { dom.parentElement.style.display = 'none'; return; }
  const subcategories = industryData.subcategories || [];
  const datasets = subcategories.map(sc => industryData.data?.[sc]);
  const firstDataset = datasets.find(d => d?.history?.length > 0);
  if (!firstDataset) return;
  const dates = firstDataset.history.map(d => d.date.substring(0, 7));

  const series = subcategories.map((sc, i) => {
    const data = industryData.data?.[sc];
    if (!data) return null;
    const map = new Map(data.history.map(d => [d.date.substring(0, 7), d.value]));
    return { name: sc, type: 'line', data: dates.map(d => map.get(d) ?? null), smooth: true, lineStyle: { width: 2, color: SERIES_COLORS[i % SERIES_COLORS.length] }, itemStyle: { color: SERIES_COLORS[i % SERIES_COLORS.length] }, symbol: 'circle', symbolSize: 4 };
  }).filter(Boolean);

  if (series.length === 0) return;

  setChartOption('chartIndustry', {
    ...getBaseOption(),
    legend: { data: subcategories, textStyle: { color: '#8b949e', fontSize: 11 }, top: 0, type: 'scroll' },
    xAxis: { ...getBaseOption().xAxis, data: dates },
    yAxis: { type: 'value', name: 'PMI (%)', min: 40, max: 56, axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: '#21262d' } } },
    series: [...series, { name: '荣枯线', type: 'line', data: dates.map(() => 50), lineStyle: { color: COLORS.red, type: 'dashed', width: 1 }, symbol: 'none', silent: true, tooltip: { show: false } }]
  });
}
