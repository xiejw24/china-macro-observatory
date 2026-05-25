/**
 * China Macro Observatory — 数据加载 & 图表渲染
 */

// ============================================================
// 数据加载
// ============================================================
async function loadData() {
    try {
        const [indicatorsRes, timelineRes] = await Promise.all([
            fetch('data/indicators.json'),
            fetch('data/timeline.json')
        ]);
        const indicators = await indicatorsRes.json();
        const timeline = await timelineRes.json();
        return { indicators, timeline };
    } catch (err) {
        console.error('Failed to load data:', err);
        return null;
    }
}

// ============================================================
// Dashboard 渲染
// ============================================================
function renderDashboard(indicators) {
    const grid = document.getElementById('dashboardGrid');
    if (!grid) return;

    const inds = indicators.indicators;
    const order = ['gdp', 'cpi', 'pmi', 'social_financing', 'm2', 'lpr'];

    grid.innerHTML = order.map(key => {
        const item = inds[key];
        if (!item) return '';
        const latest = item.latest;
        const changeClass = latest.change.startsWith('↑') ? 'change-up' :
                           latest.change.startsWith('↓') ? 'change-down' : 'change-flat';
        return `
            <div class="indicator-card">
                <div class="indicator-name">${item.name}</div>
                <div>
                    <span class="indicator-value">${formatValue(latest.value, item.unit)}</span>
                    <span class="indicator-unit">${item.unit}</span>
                </div>
                <div class="indicator-change ${changeClass}">${latest.change}</div>
                <div class="indicator-date">${latest.date}</div>
                <div class="indicator-desc">${latest.desc}</div>
            </div>
        `;
    }).join('');

    // 更新时间
    const updateEl = document.getElementById('updateTime');
    if (updateEl) {
        const t = new Date(indicators.last_updated);
        updateEl.textContent = t.toLocaleString('zh-CN', { hour12: false });
    }
}

function formatValue(val, unit) {
    if (val === null || val === undefined) return '--';
    if (unit === '亿元' && val >= 10000) return (val / 10000).toFixed(2) + '万亿';
    if (unit === '亿元' && val >= 1000) return val.toFixed(0) + '亿';
    if (unit === '亿美元' && val >= 1000) return val.toFixed(0) + '亿';
    return val;
}

// ============================================================
// ECharts 图表
// ============================================================
function renderCharts(indicators) {
    try { renderPMICPIChat(indicators); } catch (e) { console.error('[Chart PMI+CPI] Error:', e); }
    try { renderSFM2Chat(indicators); } catch (e) { console.error('[Chart SF+M2] Error:', e); }
    try { renderGDPChat(indicators); } catch (e) { console.error('[Chart GDP] Error:', e); }
}

function renderPMICPIChat(indicators) {
    const dom = document.getElementById('chartPMICPI');
    if (!dom) return;
    if (typeof echarts === 'undefined') { console.error('ECharts not loaded'); return; }
    const chart = echarts.init(dom);

    const pmiData = indicators.indicators.pmi?.history || [];
    const cpiData = indicators.indicators.cpi?.history || [];

    const option = {
        backgroundColor: 'transparent',
        grid: { top: 10, right: 50, bottom: 30, left: 50 },
        tooltip: { trigger: 'axis' },
        legend: {
            data: ['制造业PMI', 'CPI同比'],
            textStyle: { color: '#8b949e' },
            top: 0
        },
        xAxis: {
            type: 'category',
            data: pmiData.map(d => d.date.substring(0, 7)),
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
                data: pmiData.map(d => d.value),
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
                data: cpiData.map(d => d.value),
                yAxisIndex: 1,
                itemStyle: { color: '#d2991d', borderRadius: [2, 2, 0, 0] },
                barWidth: '40%'
            }
        ]
    };
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

function renderSFM2Chat(indicators) {
    const dom = document.getElementById('chartSFM2');
    if (!dom) return;
    if (typeof echarts === 'undefined') return;
    const chart = echarts.init(dom);

    const sfData = indicators.indicators.social_financing?.history || [];
    const m2Data = indicators.indicators.m2?.history || [];

    const option = {
        backgroundColor: 'transparent',
        grid: { top: 10, right: 50, bottom: 30, left: 60 },
        tooltip: { trigger: 'axis' },
        legend: {
            data: ['社会融资规模', 'M2同比'],
            textStyle: { color: '#8b949e' },
            top: 0
        },
        xAxis: {
            type: 'category',
            data: sfData.map(d => d.date.substring(0, 7)),
            axisLabel: { color: '#8b949e', fontSize: 11 },
            axisLine: { lineStyle: { color: '#30363d' } }
        },
        yAxis: [
            {
                type: 'value',
                name: '社融(万亿)',
                axisLabel: {
                    color: '#8b949e',
                    formatter: v => (v / 10000).toFixed(1)
                },
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

function renderGDPChat(indicators) {
    const dom = document.getElementById('chartGDP');
    if (!dom) return;
    if (typeof echarts === 'undefined') return;
    const chart = echarts.init(dom);

    const gdpData = (indicators.indicators.gdp?.history || []).slice().reverse().slice(0, 16);

    const option = {
        darkMode: true,
        grid: { top: 20, right: 40, bottom: 30, left: 60 },
        tooltip: { trigger: 'axis' },
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

// ============================================================
// 时间线渲染
// ============================================================
function renderTimeline(timeline) {
    const container = document.getElementById('timeline');
    const emptyEl = document.getElementById('timelineEmpty');
    if (!container) return;

    const events = timeline.events;
    if (!events || events.length === 0) {
        container.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    container.innerHTML = events.map(day => {
        const dateEntries = day.entries.map(entry => {
            const categoryEn = entry.category;
            const borderClass = getBorderClass(categoryEn);
            const tagClass = getTagClass(categoryEn);
            return `
                <div class="timeline-entry ${borderClass}" data-category="${categoryEn}">
                    <span class="timeline-entry-tag ${tagClass}">${entry.category}</span>
                    <div class="timeline-entry-body">
                        <div class="timeline-entry-time">${entry.time}</div>
                        <div class="timeline-entry-title">${entry.title}</div>
                        <div class="timeline-entry-summary">${entry.summary}</div>
                        ${entry.analysis ? `<div class="timeline-entry-analysis">${entry.analysis}</div>` : ''}
                        <div class="timeline-entry-source">来源：${entry.source}</div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="timeline-date-block" data-date="${day.date}">
                <div class="timeline-date-header">
                    <div class="timeline-date-dot"></div>
                    <span class="timeline-date-text">${day.date} ${day.day_of_week}</span>
                    <div class="timeline-date-divider"></div>
                </div>
                ${dateEntries}
            </div>
        `;
    }).join('');
}

function getBorderClass(category) {
    const map = {
        '货币政策': 'border-moneypolicy',
        '财政政策': 'border-fiscal',
        '宏观经济': 'border-macro',
        '产业政策': 'border-industry',
        '房地产': 'border-realestate',
        '国际贸易': 'border-trade'
    };
    return map[category] || 'border-macro';
}

function getTagClass(category) {
    const map = {
        '货币政策': 'tag-moneypolicy',
        '财政政策': 'tag-fiscal',
        '宏观经济': 'tag-macro',
        '产业政策': 'tag-industry',
        '房地产': 'tag-realestate',
        '国际贸易': 'tag-trade'
    };
    return map[category] || 'tag-macro';
}

// ============================================================
// 筛选功能
// ============================================================
function setupFilters() {
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

            // 隐藏没有任何条目的日期区块
            dateBlocks.forEach(block => {
                const visibleEntries = block.querySelectorAll('.timeline-entry:not(.filtered-out)');
                if (visibleEntries.length === 0) {
                    block.style.display = 'none';
                } else {
                    block.style.display = '';
                }
            });
        });
    });
}

// ============================================================
// 主入口
// ============================================================
async function init() {
    try {
        const data = await loadData();
        if (!data) {
            document.getElementById('timeline').innerHTML = '<div class="timeline-empty"><p>数据加载失败，请检查网络连接</p></div>';
            return;
        }

        renderDashboard(data.indicators);
        renderCharts(data.indicators);
        renderTimeline(data.timeline);
        setupFilters();
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
