/**
 * China Macro Observatory — 筛选交互
 */
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
        const visibleEntries = block.querySelectorAll('.timeline-entry:not(.filtered-out)');
        block.style.display = visibleEntries.length === 0 ? 'none' : '';
      });
    });
  });
}
