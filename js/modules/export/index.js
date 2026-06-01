import { on, Events } from '../../core/event-bus.js';

let appIndicators = null;

export function setupExport(indicators) {
  appIndicators = indicators;
  const exportBtns = document.querySelectorAll('.export-btn');
  exportBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format;
      exportData(format);
    });
  });
}

function exportData(format) {
  if (!appIndicators) return;
  const keys = Object.keys(appIndicators.indicators || {});
  const headers = ['日期'];
  const keyList = [];
  keys.forEach(key => {
    const ind = appIndicators.indicators[key];
    if (!ind || !ind.history?.length) return;
    headers.push(`${ind.name}(${ind.unit})`);
    keyList.push(key);
  });
  if (keyList.length === 0) return;

  const dataMap = {};
  keyList.forEach(key => {
    (appIndicators.indicators[key].history || []).forEach(d => {
      if (!dataMap[d.date]) dataMap[d.date] = {};
      dataMap[d.date][key] = d.value;
    });
  });
  const dates = Object.keys(dataMap).sort();
  const rows = [headers.join(',')];
  dates.forEach(date => {
    const row = [date];
    keyList.forEach(key => row.push(dataMap[date]?.[key] ?? ''));
    rows.push(row.join(','));
  });

  if (format === 'csv') {
    downloadCSV(rows.join('\n'), 'macro-data.csv');
  } else if (format === 'excel') {
    downloadExcel(headers, dates, dataMap, keyList);
  }
}

function downloadCSV(content, filename) {
  const BOM = '﻿';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(headers, dates, dataMap, keyList) {
  if (typeof XLSX === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = () => {
      const data = [headers];
      dates.forEach(date => {
        const row = [date];
        keyList.forEach(key => row.push(dataMap[date]?.[key] ?? ''));
        data.push(row);
      });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, '宏观数据');
      XLSX.writeFile(wb, 'macro-data.xlsx');
    };
    document.head.appendChild(script);
  } else {
    const data = [headers];
    dates.forEach(date => {
      const row = [date];
      keyList.forEach(key => row.push(dataMap[date]?.[key] ?? ''));
      data.push(row);
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, '宏观数据');
    XLSX.writeFile(wb, 'macro-data.xlsx');
  }
}
