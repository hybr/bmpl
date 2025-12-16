/**
 * Line Chart Component
 * Simple canvas-based line/area chart with no external dependencies
 */

export class LineChart {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }

    this.ctx = this.canvas.getContext('2d');
    this.options = {
      type: options.type || 'line', // 'line' or 'area'
      title: options.title || '',
      backgroundColor: options.backgroundColor || '#ffffff',
      lineColor: options.lineColor || '#3b82f6',
      lineColors: options.lineColors || null, // Array of colors for multiple series
      fillColor: options.fillColor || 'rgba(59, 130, 246, 0.1)',
      gridColor: options.gridColor || '#e5e7eb',
      textColor: options.textColor || '#374151',
      padding: options.padding || 60,
      lineWidth: options.lineWidth || 2,
      pointRadius: options.pointRadius || 4,
      showPoints: options.showPoints !== false,
      showValues: options.showValues || false,
      showGrid: options.showGrid !== false,
      showLegend: options.showLegend || false,
      smooth: options.smooth || false,
      maxValue: options.maxValue || null,
      minValue: options.minValue || null,
      valuePrefix: options.valuePrefix || '',
      valueSuffix: options.valueSuffix || '',
      animate: options.animate !== false,
      animationDuration: options.animationDuration || 800,
      ...options
    };

    this.data = null;
    this.series = null;
    this.animationFrame = null;
    this.animationProgress = 0;

    // Setup resize handler
    this.resizeHandler = this.handleResize.bind(this);
    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * Set chart data and render
   * @param {Object} data - {labels: [], values: []} or {labels: [], series: [{name, values, color}]}
   */
  setData(data) {
    this.data = data;
    this.animationProgress = 0;

    // Determine if single or multiple series
    if (data.series) {
      this.series = data.series;
    } else if (data.values) {
      this.series = [{
        name: 'Data',
        values: data.values,
        color: this.options.lineColor
      }];
    } else {
      this.series = null;
    }

    this.render();
  }

  /**
   * Update chart data and re-render
   * @param {Object} data - Chart data
   */
  updateData(data) {
    this.setData(data);
  }

  /**
   * Render the chart
   */
  render() {
    if (!this.data || !this.series || this.data.labels.length === 0) {
      this.renderEmpty();
      return;
    }

    // Set canvas size to match display size
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, rect.width, rect.height);

    // Calculate dimensions
    const padding = this.options.padding;
    const legendHeight = this.options.showLegend ? 30 : 0;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2 - legendHeight;

    // Draw title
    if (this.options.title) {
      this.ctx.fillStyle = this.options.textColor;
      this.ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.options.title, rect.width / 2, 25);
    }

    // Calculate min/max values across all series
    let minValue = this.options.minValue;
    let maxValue = this.options.maxValue;

    if (minValue === null || maxValue === null) {
      const allValues = this.series.flatMap(s => s.values);
      if (minValue === null) minValue = Math.min(...allValues, 0);
      if (maxValue === null) maxValue = Math.max(...allValues);
    }

    const valueRange = maxValue - minValue;
    const scale = valueRange > 0 ? chartHeight / valueRange : 0;

    // Animate if enabled
    if (this.options.animate && this.animationProgress < 1) {
      this.animationProgress += 16 / this.options.animationDuration;
      if (this.animationProgress > 1) this.animationProgress = 1;
      this.animationFrame = requestAnimationFrame(() => this.render());
    }

    // Draw grid lines
    if (this.options.showGrid) {
      this.drawGrid(padding, chartWidth, chartHeight, minValue, maxValue);
    }

    // Draw each series
    this.series.forEach((seriesData, seriesIndex) => {
      const color = seriesData.color ||
                    (this.options.lineColors && this.options.lineColors[seriesIndex]) ||
                    this.options.lineColor;

      this.drawSeries(
        seriesData,
        color,
        padding,
        chartWidth,
        chartHeight,
        minValue,
        scale
      );
    });

    // Draw legend
    if (this.options.showLegend && this.series.length > 1) {
      this.drawLegend(rect.width, rect.height - legendHeight);
    }

    // Draw x-axis labels
    this.drawXAxisLabels(padding, chartWidth, chartHeight);
  }

  /**
   * Draw grid lines and y-axis labels
   */
  drawGrid(padding, chartWidth, chartHeight, minValue, maxValue) {
    this.ctx.strokeStyle = this.options.gridColor;
    this.ctx.lineWidth = 1;
    const gridLines = 5;

    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (chartHeight / gridLines) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(padding, y);
      this.ctx.lineTo(padding + chartWidth, y);
      this.ctx.stroke();

      // Draw value labels
      const value = maxValue - ((maxValue - minValue) / gridLines) * i;
      this.ctx.fillStyle = this.options.textColor;
      this.ctx.font = '12px system-ui, -apple-system, sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(
        this.formatValue(value),
        padding - 10,
        y + 4
      );
    }
  }

  /**
   * Draw x-axis labels
   */
  drawXAxisLabels(padding, chartWidth, chartHeight) {
    const labelCount = this.data.labels.length;
    const spacing = chartWidth / (labelCount - 1);

    this.ctx.fillStyle = this.options.textColor;
    this.ctx.font = '12px system-ui, -apple-system, sans-serif';
    this.ctx.textAlign = 'center';

    this.data.labels.forEach((label, index) => {
      const x = padding + index * spacing;
      this.ctx.fillText(label, x, padding + chartHeight + 20);
    });
  }

  /**
   * Draw a single series
   */
  drawSeries(seriesData, color, padding, chartWidth, chartHeight, minValue, scale) {
    const pointCount = seriesData.values.length;
    const spacing = pointCount > 1 ? chartWidth / (pointCount - 1) : chartWidth / 2;

    // Calculate points
    const points = seriesData.values.map((value, index) => ({
      x: padding + index * spacing,
      y: padding + chartHeight - ((value - minValue) * scale)
    }));

    // Apply animation
    const animatedPoints = points.slice(0, Math.ceil(points.length * this.animationProgress));

    // Draw area fill if area type
    if (this.options.type === 'area' && animatedPoints.length > 1) {
      this.ctx.fillStyle = this.options.fillColor || this.hexToRgba(color, 0.1);
      this.ctx.beginPath();
      this.ctx.moveTo(animatedPoints[0].x, padding + chartHeight);
      animatedPoints.forEach(point => {
        this.ctx.lineTo(point.x, point.y);
      });
      this.ctx.lineTo(animatedPoints[animatedPoints.length - 1].x, padding + chartHeight);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // Draw line
    if (animatedPoints.length > 1) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = this.options.lineWidth;
      this.ctx.lineJoin = 'round';
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();

      if (this.options.smooth) {
        this.drawSmoothLine(animatedPoints);
      } else {
        this.drawStraightLine(animatedPoints);
      }

      this.ctx.stroke();
    }

    // Draw points
    if (this.options.showPoints) {
      animatedPoints.forEach((point, index) => {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, this.options.pointRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw value labels
        if (this.options.showValues) {
          this.ctx.fillStyle = this.options.textColor;
          this.ctx.font = '11px system-ui, -apple-system, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(
            this.formatValue(seriesData.values[index]),
            point.x,
            point.y - 10
          );
        }
      });
    }
  }

  /**
   * Draw straight line through points
   */
  drawStraightLine(points) {
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
  }

  /**
   * Draw smooth curve through points using quadratic curves
   */
  drawSmoothLine(points) {
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      const cpy = (prev.y + curr.y) / 2;
      this.ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
    }

    // Draw to last point
    const last = points[points.length - 1];
    this.ctx.lineTo(last.x, last.y);
  }

  /**
   * Draw legend
   */
  drawLegend(width, yPosition) {
    const itemWidth = 150;
    const itemHeight = 20;
    const startX = (width - (this.series.length * itemWidth)) / 2;

    this.series.forEach((seriesData, index) => {
      const x = startX + index * itemWidth;
      const color = seriesData.color ||
                    (this.options.lineColors && this.options.lineColors[index]) ||
                    this.options.lineColor;

      // Draw color box
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, yPosition, 12, 12);

      // Draw label
      this.ctx.fillStyle = this.options.textColor;
      this.ctx.font = '12px system-ui, -apple-system, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(seriesData.name, x + 18, yPosition + 10);
    });
  }

  /**
   * Render empty state
   */
  renderEmpty() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, rect.width, rect.height);

    this.ctx.fillStyle = '#9ca3af';
    this.ctx.font = '14px system-ui, -apple-system, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('No data available', rect.width / 2, rect.height / 2);
  }

  /**
   * Format value with prefix/suffix
   */
  formatValue(value) {
    const formatted = typeof value === 'number' ? value.toLocaleString() : value;
    return `${this.options.valuePrefix}${formatted}${this.options.valueSuffix}`;
  }

  /**
   * Convert hex color to rgba
   */
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (this.data) {
      this.render();
    }
  }

  /**
   * Destroy chart and cleanup
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    window.removeEventListener('resize', this.resizeHandler);
  }
}

export default LineChart;
