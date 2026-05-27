/**
 * China Macro Observatory — 入口模块
 */
import { renderDashboard } from './dashboard.js';
import { renderPMICPI } from './charts/pmicpi.js';
import { renderSocialM2 } from './charts/socialm2.js';
import { renderGDP } from './charts/gdp.js';
import { renderTimeline } from './timeline.js';
import { setupFilters } from './filters.js';

async function loadData() {
  try {
    const [indicatorsRes, timelineRes, configRes] = await Promise.all([
      fetch('data/indicators.json'),
      fetch('data/timeline.json'),
      fetch('data/config.json')
    ]);
    return {
      indicators: await indicatorsRes.json(),
      timeline: await timelineRes.json(),
      config: await configRes.json()
    };
  } catch (err) {
    console.error('[LoadData] Failed:', err);
    return null;
  }
}

function initLazyCharts(indicators) {
  if (!('IntersectionObserver' in window)) {
    renderPMICPI(indicators);
    renderSocialM2(indicators);
    renderGDP(indicators);
    return;
  }

  const chartObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        if (id === 'chartPMICPI') renderPMICPI(indicators);
        else if (id === 'chartSFM2') renderSocialM2(indicators);
        else if (id === 'chartGDP') renderGDP(indicators);
        chartObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '200px' });

  ['chartPMICPI', 'chartSFM2', 'chartGDP'].forEach(id => {
    const el = document.getElementById(id);
    if (el) chartObserver.observe(el);
  });
}

async function init() {
  try {
    const data = await loadData();
    if (!data) {
      document.getElementById('timeline').innerHTML =
        '<div class="timeline-empty"><p>数据加载失败，请检查网络连接</p></div>';
      return;
    }

    renderDashboard(data.indicators, data.config);
    initLazyCharts(data.indicators);
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
