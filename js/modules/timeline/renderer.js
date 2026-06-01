import { getBorderClass, getTagClass } from './filters.js';

export function renderTimeline(timeline) {
  const container = document.getElementById('timeline');
  const emptyEl = document.getElementById('timelineEmpty');
  if (!container) return;
  const events = timeline?.events;
  if (!events || events.length === 0) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  container.innerHTML = events.map(day => {
    const dateEntries = day.entries.map(entry => {
      const borderClass = getBorderClass(entry.category);
      const tagClass = getTagClass(entry.category);
      const importanceBadge = entry.importance === 'high' ? '<span class="importance-badge">重要</span>' : '';
      const relatedChips = (entry.related_indicators || []).map(ind => `<span class="indicator-chip">📊 ${ind}</span>`).join('');
      const tagsHtml = (entry.tags || []).map(tag => `<span class="tag-chip">${tag}</span>`).join('');
      return `
        <div class="timeline-entry ${borderClass}" data-category="${entry.category}" data-importance="${entry.importance || 'normal'}">
          <span class="timeline-entry-tag ${tagClass}">${entry.category}</span>
          ${importanceBadge}
          <div class="timeline-entry-body">
            <div class="timeline-entry-time">${entry.time}</div>
            <div class="timeline-entry-title">${entry.title}</div>
            <div class="timeline-entry-summary">${entry.summary || ''}</div>
            ${entry.analysis ? `<div class="timeline-entry-analysis">${entry.analysis}</div>` : ''}
            ${tagsHtml ? `<div class="tags-row">${tagsHtml}</div>` : ''}
            ${relatedChips ? `<div class="indicators-row">${relatedChips}</div>` : ''}
            <div class="timeline-entry-source">来源：${entry.source || ''}</div>
          </div>
        </div>`;
    }).join('');
    return `
      <div class="timeline-date-block" data-date="${day.date}">
        <div class="timeline-date-header">
          <div class="timeline-date-dot"></div>
          <span class="timeline-date-text">${day.date} ${day.day_of_week || ''}</span>
          <div class="timeline-date-divider"></div>
        </div>
        ${dateEntries}
      </div>`;
  }).join('');
}
