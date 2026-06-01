import { renderPMICPI } from './pmicpi.js';
import { renderSocialM2 } from './socialm2.js';
import { renderGDP } from './gdp.js';
import { renderIndustry } from './industry.js';

const CHART_RENDERERS = {
  chartPMICPI: renderPMICPI, chartSFM2: renderSocialM2,
  chartGDP: renderGDP, chartIndustry: renderIndustry
};

export function initCharts(indicators, opts = {}) {
  if (opts.containerId) { const r = CHART_RENDERERS[opts.containerId]; if (r) r(indicators); return; }
  Object.entries(CHART_RENDERERS).forEach(([id, renderer]) => { if (document.getElementById(id)) renderer(indicators); });
}

export { renderPMICPI, renderSocialM2, renderGDP, renderIndustry };
