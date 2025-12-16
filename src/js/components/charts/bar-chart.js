/**
 * Bar Chart Component
 * Simple canvas-based bar/column chart with no external dependencies
 */

export class BarChart {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }

    this.ctx = this.canvas.getContext('2d');
    this.options = {
      type: options.type || 'vertical', // 'vertical' or 'horizontal'
      title: options.title || '',
      backgroundColor: options.backgroundColor || '#ffffff',
      barColor: options.barColor || '#3b82f6',
      barColors: options.barColors || null, // Array of colors for each bar
      gridColor: options.gridColor || '#e5e7eb',
      textColor: options.textColor || '#374151',
      padding: options.padding || 60,
      barSpacing: options.barSpacing || 10,
      showValues: options.showValues !== false,
      showGrid: options.showGrid !== false,
      showLegend: options.showLegend || false,
      maxValue: options.maxValue || null,
      valuePrefix: options.valuePrefix || '',
      valueSuffix: options.valueSuffix || '',
      animate: options.animate !== false,
      animationDuration: options.animationDuration || 800,
      ...options
    };

    this.data = null;
    this.animationFrame = null;
    this.animationProgress = 0;

    // Setup resize handler
    this.resizeHandler = this.handleResize.bind(this);
    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * Set chart data and render
   * @param {Array} data - Array of {label, value, color?} objects
   */
  setData(data) {
    this.data = data;
    this.animationProgress = 0;
    this.render();
  }

  /**
   * Update chart data and re-render
   * @param {Array} data - Array of {label, value, color?} objects
   */
  updateData(data) {
    this.setData(data);
  }

  /**
   * Render the chart
   */
  render() {
    if (!this.data || this.data.length === 0) {
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
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;

    // Draw title
    if (this.options.title) {
      this.ctx.fillStyle = this.options.textColor;
      this.ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.options.title, rect.width / 2, 25);
    }

    // Calculate max value
    const maxValue = this.options.maxValue || Math.max(...this.data.map(d => d.value));
    const scale = maxValue > 0 ? chartHeight / maxValue : 0;

    // Animate if enabled
    if (this.options.animate && this.animationProgress < 1) {
      this.animationProgress += 16 / this.options.animationDuration;
      if (this.animationProgress > 1) this.animationProgress = 1;
      this.animationFrame = requestAnimationFrame(() => this.render());
    }

    const animatedScale = scale * this.animationProgress;

    if (this.options.type === 'vertical') {
      this.renderVerticalBars(padding, chartWidth, chartHeight, maxValue, animatedScale);
    } else {
      this.renderHorizontalBars(padding, chartWidth, chartHeight, maxValue, animatedScale);
    }
  }

  /**
   * Render vertical bars
   */
  renderVerticalBars(padding, chartWidth, chartHeight, maxValue, scale) {
    const barCount = this.data.length;
    const totalSpacing = this.options.barSpacing * (barCount - 1);
    const barWidth = (chartWidth - totalSpacing) / barCount;

    // Draw grid lines
    if (this.options.showGrid) {
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
        const value = maxValue - (maxValue / gridLines) * i;
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

    // Draw bars
    this.data.forEach((item, index) => {
      const x = padding + index * (barWidth + this.options.barSpacing);
      const barHeight = item.value * scale;
      const y = padding + chartHeight - barHeight;

      // Get bar color
      let barColor = this.options.barColor;
      if (item.color) {
        barColor = item.color;
      } else if (this.options.barColors && this.options.barColors[index]) {
        barColor = this.options.barColors[index];
      }

      // Draw bar
      this.ctx.fillStyle = barColor;
      this.ctx.fillRect(x, y, barWidth, barHeight);

      // Draw value on top of bar
      if (this.options.showValues && barHeight > 20) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
          this.formatValue(item.value),
          x + barWidth / 2,
          y + barHeight / 2 + 4
        );
      }

      // Draw label below bar
      this.ctx.fillStyle = this.options.textColor;
      this.ctx.font = '12px system-ui, -apple-system, sans-serif';
      this.ctx.textAlign = 'center';

      // Wrap long labels
      const maxLabelWidth = barWidth;
      const words = item.label.split(' ');
      let line = '';
      let lineY = padding + chartHeight + 20;

      words.forEach(word => {
        const testLine = line + (line ? ' ' : '') + word;
        const metrics = this.ctx.measureText(testLine);
        if (metrics.width > maxLabelWidth && line) {
          this.ctx.fillText(line, x + barWidth / 2, lineY);
          line = word;
          lineY += 14;
        } else {
          line = testLine;
        }
      });
      this.ctx.fillText(line, x + barWidth / 2, lineY);
    });
  }

  /**
   * Render horizontal bars
   */
  renderHorizontalBars(padding, chartWidth, chartHeight, maxValue, scale) {
    const barCount = this.data.length;
    const totalSpacing = this.options.barSpacing * (barCount - 1);
    const barHeight = (chartHeight - totalSpacing) / barCount;
    const horizontalScale = maxValue > 0 ? chartWidth / maxValue : 0;
    const animatedHorizontalScale = horizontalScale * this.animationProgress;

    // Draw grid lines
    if (this.options.showGrid) {
      this.ctx.strokeStyle = this.options.gridColor;
      this.ctx.lineWidth = 1;
      const gridLines = 5;
      for (let i = 0; i <= gridLines; i++) {
        const x = padding + (chartWidth / gridLines) * i;
        this.ctx.beginPath();
        this.ctx.moveTo(x, padding);
        this.ctx.lineTo(x, padding + chartHeight);
        this.ctx.stroke();

        // Draw value labels
        const value = (maxValue / gridLines) * i;
        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = '12px system-ui, -apple-system, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
          this.formatValue(value),
          x,
          padding + chartHeight + 20
        );
      }
    }

    // Draw bars
    this.data.forEach((item, index) => {
      const y = padding + index * (barHeight + this.options.barSpacing);
      const barWidth = item.value * animatedHorizontalScale;
      const x = padding;

      // Get bar color
      let barColor = this.options.barColor;
      if (item.color) {
        barColor = item.color;
      } else if (this.options.barColors && this.options.barColors[index]) {
        barColor = this.options.barColors[index];
      }

      // Draw bar
      this.ctx.fillStyle = barColor;
      this.ctx.fillRect(x, y, barWidth, barHeight);

      // Draw value on bar
      if (this.options.showValues && barWidth > 40) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
          this.formatValue(item.value),
          x + 10,
          y + barHeight / 2 + 4
        );
      }

      // Draw label before bar
      this.ctx.fillStyle = this.options.textColor;
      this.ctx.font = '12px system-ui, -apple-system, sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(
        item.label,
        x - 10,
        y + barHeight / 2 + 4
      );
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

export default BarChart;
