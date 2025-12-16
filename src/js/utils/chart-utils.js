/**
 * Chart Utilities
 * Simple chart rendering helpers using Canvas API
 */

/**
 * Render a bar chart
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {object} data - Chart data
 * @param {object} options - Chart options
 */
export function renderBarChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Default options
  const opts = {
    barColor: options.barColor || '#3880ff',
    textColor: options.textColor || '#333',
    gridColor: options.gridColor || '#ddd',
    padding: options.padding || 40,
    barSpacing: options.barSpacing || 10,
    showValues: options.showValues !== false,
    showGrid: options.showGrid !== false,
    ...options
  };

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (!data || !data.labels || !data.values || data.labels.length === 0) {
    ctx.fillStyle = opts.textColor;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No data', width / 2, height / 2);
    return;
  }

  const labels = data.labels;
  const values = data.values;
  const maxValue = Math.max(...values, 1);

  // Calculate dimensions
  const chartWidth = width - opts.padding * 2;
  const chartHeight = height - opts.padding * 2;
  const barWidth = (chartWidth - (labels.length - 1) * opts.barSpacing) / labels.length;

  // Draw grid lines
  if (opts.showGrid) {
    ctx.strokeStyle = opts.gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = opts.padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(opts.padding, y);
      ctx.lineTo(width - opts.padding, y);
      ctx.stroke();
    }
  }

  // Draw bars
  labels.forEach((label, index) => {
    const value = values[index];
    const barHeight = (value / maxValue) * chartHeight;
    const x = opts.padding + index * (barWidth + opts.barSpacing);
    const y = height - opts.padding - barHeight;

    // Draw bar
    ctx.fillStyle = Array.isArray(opts.barColor) ? opts.barColor[index % opts.barColor.length] : opts.barColor;
    ctx.fillRect(x, y, barWidth, barHeight);

    // Draw value on top
    if (opts.showValues && value > 0) {
      ctx.fillStyle = opts.textColor;
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(value, x + barWidth / 2, y - 5);
    }

    // Draw label
    ctx.fillStyle = opts.textColor;
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(x + barWidth / 2, height - opts.padding + 15);
    if (opts.rotateLabels) {
      ctx.rotate(-Math.PI / 4);
    }
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  // Draw Y-axis labels
  ctx.fillStyle = opts.textColor;
  ctx.font = '10px Arial';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const value = Math.round((maxValue / 5) * (5 - i));
    const y = opts.padding + (chartHeight / 5) * i;
    ctx.fillText(value, opts.padding - 10, y + 4);
  }
}

/**
 * Render a line chart
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {object} data - Chart data
 * @param {object} options - Chart options
 */
export function renderLineChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Default options
  const opts = {
    lineColor: options.lineColor || '#3880ff',
    pointColor: options.pointColor || '#3880ff',
    textColor: options.textColor || '#333',
    gridColor: options.gridColor || '#ddd',
    padding: options.padding || 40,
    lineWidth: options.lineWidth || 2,
    pointRadius: options.pointRadius || 4,
    showPoints: options.showPoints !== false,
    showGrid: options.showGrid !== false,
    ...options
  };

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (!data || !data.labels || !data.values || data.labels.length === 0) {
    ctx.fillStyle = opts.textColor;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No data', width / 2, height / 2);
    return;
  }

  const labels = data.labels;
  const values = data.values;
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);

  // Calculate dimensions
  const chartWidth = width - opts.padding * 2;
  const chartHeight = height - opts.padding * 2;
  const xStep = chartWidth / (labels.length - 1 || 1);

  // Draw grid lines
  if (opts.showGrid) {
    ctx.strokeStyle = opts.gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = opts.padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(opts.padding, y);
      ctx.lineTo(width - opts.padding, y);
      ctx.stroke();
    }
  }

  // Draw line
  ctx.strokeStyle = opts.lineColor;
  ctx.lineWidth = opts.lineWidth;
  ctx.beginPath();

  values.forEach((value, index) => {
    const x = opts.padding + index * xStep;
    const y = height - opts.padding - ((value - minValue) / (maxValue - minValue)) * chartHeight;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // Draw points
  if (opts.showPoints) {
    ctx.fillStyle = opts.pointColor;
    values.forEach((value, index) => {
      const x = opts.padding + index * xStep;
      const y = height - opts.padding - ((value - minValue) / (maxValue - minValue)) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, opts.pointRadius, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  // Draw labels
  ctx.fillStyle = opts.textColor;
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';

  labels.forEach((label, index) => {
    const x = opts.padding + index * xStep;
    ctx.fillText(label, x, height - opts.padding + 15);
  });

  // Draw Y-axis labels
  ctx.textAlign = 'right';
  ctx.font = '10px Arial';
  for (let i = 0; i <= 5; i++) {
    const value = Math.round((maxValue / 5) * (5 - i));
    const y = opts.padding + (chartHeight / 5) * i;
    ctx.fillText(value, opts.padding - 10, y + 4);
  }
}

/**
 * Render a pie chart
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {object} data - Chart data
 * @param {object} options - Chart options
 */
export function renderPieChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Default options
  const opts = {
    colors: options.colors || ['#3880ff', '#5260ff', '#5856d6', '#50c8ff', '#42b983'],
    textColor: options.textColor || '#333',
    padding: options.padding || 20,
    showLabels: options.showLabels !== false,
    showPercentages: options.showPercentages !== false,
    ...options
  };

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (!data || !data.labels || !data.values || data.labels.length === 0) {
    ctx.fillStyle = opts.textColor;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No data', width / 2, height / 2);
    return;
  }

  const labels = data.labels;
  const values = data.values;
  const total = values.reduce((sum, val) => sum + val, 0);

  if (total === 0) {
    ctx.fillStyle = opts.textColor;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No data', width / 2, height / 2);
    return;
  }

  // Calculate center and radius
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - opts.padding;

  // Draw slices
  let currentAngle = -Math.PI / 2; // Start from top

  values.forEach((value, index) => {
    const sliceAngle = (value / total) * 2 * Math.PI;
    const color = opts.colors[index % opts.colors.length];

    // Draw slice
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();

    // Draw label
    if (opts.showLabels || opts.showPercentages) {
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (opts.showPercentages) {
        const percentage = ((value / total) * 100).toFixed(1);
        ctx.fillText(`${percentage}%`, labelX, labelY);
      }
    }

    currentAngle += sliceAngle;
  });

  // Draw legend
  if (opts.showLabels) {
    const legendX = width - 120;
    const legendY = opts.padding;

    labels.forEach((label, index) => {
      const y = legendY + index * 20;
      const color = opts.colors[index % opts.colors.length];

      // Color box
      ctx.fillStyle = color;
      ctx.fillRect(legendX, y, 15, 15);

      // Label text
      ctx.fillStyle = opts.textColor;
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(label, legendX + 20, y + 11);
    });
  }
}

/**
 * Create canvas element
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {HTMLCanvasElement} Canvas element
 */
export function createCanvas(width = 400, height = 300) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export default {
  renderBarChart,
  renderLineChart,
  renderPieChart,
  createCanvas
};
