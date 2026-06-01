/**
 * China Macro Observatory — 入口模块 (v2.0)
 */
import { loadAllData } from './core/data-loader.js';
import { getConfig } from './core/config.js';
import { emit, Events } from './core/event-bus.js';
import { renderDashboard } from './modules/indicators/index.js';
import { renderPMICPI } from './modules/charts/pmicpi.js';
import { renderSocialM2 } from './modules/charts/socialm2.js';
import { renderGDP } from './modules/charts/gdp.js';
import { renderIndustry } from './modules/charts/industry.js';
import { renderTimeline } from './modules/timeline/index.js';
import { setupFilters } from './modules/timeline/filters.js';
import { setupAnalytics } from './modules/analytics/index.js';
import { setupExport } from './modules/export/index.js';

function initLazyCharts(data) {
  const indicators = data.indicators;
  const industryData = data.industry;

  const chartRenderers = {
    chartPMICPI: () => renderPMICPI(indicators),
    chartSFM2: () => renderSocialM2(indicators),
    chartGDP: () => renderGDP(indicators),
    chartIndustry: () => renderIndustry({ ...indicators, industry: industryData })
  };

  if (!('IntersectionObserver' in window)) {
    Object.values(chartRenderers).forEach(fn => fn());
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        if (chartRenderers[id]) chartRenderers[id]();
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '200px' });

  Object.keys(chartRenderers).forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

async function init() {
  try {
    const data = await loadAllData();
    if (!data.indicators) {
      const timelineEl = document.getElementById('timeline');
      if (timelineEl) {
        timelineEl.innerHTML = '<div class="timeline-empty"><p>数据加载失败，请检查网络连接</p></div>';
      }
      return;
    }

    const appConfig = getConfig(data.config);
    emit(Events.DATA_LOADED, { data, config: appConfig });

    renderDashboard(data.indicators, appConfig);
    initLazyCharts(data);
    renderTimeline(data.timeline);
    setupFilters();
    setupAnalytics(data.indicators);
    setupExport(data.indicators);

    const updateEl = document.getElementById('updateTime');
    if (updateEl && data.indicators.last_updated) {
      const t = new Date(data.indicators.last_updated);
      updateEl.textContent = t.toLocaleString('zh-CN', { hour12: false });
    }
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
