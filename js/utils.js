/**
 * China Macro Observatory — 工具函数
 */

/**
 * 格式化指标数值
 */
export function formatValue(val, unit) {
  if (val === null || val === undefined) return '--';
  if (unit === '亿元' && val >= 10000) return (val / 10000).toFixed(2) + '万亿';
  if (unit === '亿元' && val >= 1000) return val.toFixed(0) + '亿';
  if (unit === '亿美元' && val >= 1000) return val.toFixed(0) + '亿';
  return val;
}

/**
 * 根据分类返回边框 CSS 类名
 */
export function getBorderClass(category) {
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

/**
 * 根据分类返回标签 CSS 类名
 */
export function getTagClass(category) {
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

/**
 * 绘制 sparkline 迷你趋势线
 */
export function drawSparkline(canvas, data, color = '#58a6ff') {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const values = data.map(d => d.value);

  if (values.length < 2) return;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  values.forEach((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}
