import { emit, Events } from '../../core/event-bus.js';

const CATEGORY_MAP = {
  '货币政策': { border: 'border-moneypolicy', tag: 'tag-moneypolicy' },
  '财政政策': { border: 'border-fiscal', tag: 'tag-fiscal' },
  '宏观经济': { border: 'border-macro', tag: 'tag-macro' },
  '产业政策': { border: 'border-industry', tag: 'tag-industry' },
  '房地产':   { border: 'border-realestate', tag: 'tag-realestate' },
  '国际贸易': { border: 'border-trade', tag: 'tag-trade' }
};

export function getBorderClass(category) {
  return CATEGORY_MAP[category]?.border || 'border-macro';
}

export function getTagClass(category) {
  return CATEGORY_MAP[category]?.tag || 'tag-macro';
}

export function setupFilters() {
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
      dateBlocks.forEach(block => {
        const visible = block.querySelectorAll('.timeline-entry:not(.filtered-out)');
        block.style.display = visible.length === 0 ? 'none' : '';
      });
      emit(Events.FILTER_CHANGED, { filter });
    });
  });
}
