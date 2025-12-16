/**
 * Pie Chart Component
 * Simple canvas-based pie/donut chart with no external dependencies
 */

export class PieChart {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }

    this.ctx = this.canvas.getContext('2d');
    this.options = {
      type: options.type || 'pie', // 'pie' or 'donut'
      title: options.title || '',
      backgroundColor: options.backgroundColor || '#ffffff',
      colors: options.colors || [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
      ],
      textColor: options.textColor || '#374151',
      showLabels: options.showLabels !== false,
      showPercentages: options.showPercentages !== false,
      showLegend: options.showLegend !== false,
      showValues: options.showValues || false,
      donutWidth: options.donutWidth || 60,
      legendPosition: options.legendPosition || 'right', // 'right', 'bottom'
      valuePrefix: options.valuePrefix || '',
      valueSuffix: options.valueSuffix || '',
      animate: options.animate !== false,
      animationDuration: options.animationDuration || 1000,
      ...options
    };

    this.data = null;
    this.total = 0;
    this.animationFrame = null;
    this.animationProgress = 0;
    this.hoveredSlice = null;

    // Setup resize handler
    this.resizeHandler = this.handleResize.bind(this);
    window.addEventListener('resize', this.resizeHandler);

    // Setup hover handler
    this.hoverHandler = this.handleHover.bind(this);
    this.canvas.addEventListener('mousemove', this.hoverHandler);
  }

  /**
   * Set chart data and render
   * @param {Array} data - Array of {label, value, color?} objects
   */
  setData(data) {
    this.data = data;
    this.total = data.reduce((sum, item) => sum + item.value, 0);
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

    // Draw title
    if (this.options.title) {
      this.ctx.fillStyle = this.options.textColor;
      this.ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.options.title, rect.width / 2, 25);
    }

    // Animate if enabled
    if (this.options.animate && this.animationProgress < 1) {
      this.animationProgress += 16 / this.options.animationDuration;
      if (this.animationProgress > 1) this.animationProgress = 1;
      this.animationFrame = requestAnimationFrame(() => this.render());
    }

    // Calculate dimensions based on legend position
    let chartArea, legendArea;
    if (this.options.showLegend && this.options.legendPosition === 'right') {
      const legendWidth = 200;
      chartArea = {
        x: 0,
        y: this.options.title ? 40 : 0,
        width: rect.width - legendWidth,
        height: rect.height - (this.options.title ? 40 : 0)
      };
      legendArea = {
        x: rect.width - legendWidth,
        y: chartArea.y,
        width: legendWidth,
        height: chartArea.height
      };
    } else {
      const legendHeight = this.options.showLegend ? 100 : 0;
      chartArea = {
        x: 0,
        y: this.options.title ? 40 : 0,
        width: rect.width,
        height: rect.height - legendHeight - (this.options.title ? 40 : 0)
      };
      legendArea = {
        x: 0,
        y: chartArea.y + chartArea.height,
        width: rect.width,
        height: legendHeight
      };
    }

    // Calculate pie center and radius
    const centerX = chartArea.x + chartArea.width / 2;
    const centerY = chartArea.y + chartArea.height / 2;
    const radius = Math.min(chartArea.width, chartArea.height) / 2 - 20;

    // Draw slices
    this.drawSlices(centerX, centerY, radius);

    // Draw center for donut chart
    if (this.options.type === 'donut') {
      this.drawDonutCenter(centerX, centerY, radius);
    }

    // Draw legend
    if (this.options.showLegend) {
      this.drawLegend(legendArea);
    }
  }

  /**
   * Draw pie/donut slices
   */
  drawSlices(centerX, centerY, radius) {
    let startAngle = -Math.PI / 2; // Start at top
    const endAngle = startAngle + (2 * Math.PI * this.animationProgress);

    this.data.forEach((item, index) => {
      const sliceAngle = (item.value / this.total) * 2 * Math.PI * this.animationProgress;
      const currentEndAngle = Math.min(startAngle + sliceAngle, endAngle);

      if (currentEndAngle <= startAngle) return;

      // Get slice color
      const color = item.color || this.options.colors[index % this.options.colors.length];

      // Draw slice
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.arc(centerX, centerY, radius, startAngle, currentEndAngle);
      this.ctx.closePath();
      this.ctx.fill();

      // Add slight border
      this.ctx.strokeStyle = this.options.backgroundColor;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Draw label if enabled and slice is large enough
      if (this.options.showLabels && sliceAngle > 0.2) {
        const labelAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        if (this.options.showPercentages) {
          const percentage = ((item.value / this.total) * 100).toFixed(1);
          this.ctx.fillText(`${percentage}%`, labelX, labelY);
        } else if (this.options.showValues) {
          this.ctx.fillText(this.formatValue(item.value), labelX, labelY);
        }
      }

      startAngle = currentEndAngle;
    });
  }

  /**
   * Draw donut center
   */
  drawDonutCenter(centerX, centerY, radius) {
    const innerRadius = radius - this.options.donutWidth;

    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    this.ctx.fill();

    // Draw total in center
    if (this.animationProgress === 1) {
      this.ctx.fillStyle = this.options.textColor;
      this.ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(this.formatValue(this.total), centerX, centerY - 10);

      this.ctx.font = '12px system-ui, -apple-system, sans-serif';
      this.ctx.fillText('Total', centerX, centerY + 15);
    }
  }

  /**
   * Draw legend
   */
  drawLegend(legendArea) {
    const itemHeight = 25;
    const maxItems = Math.floor(legendArea.height / itemHeight);
    const items = this.data.slice(0, maxItems);

    if (this.options.legendPosition === 'right') {
      // Vertical legend
      items.forEach((item, index) => {
        const y = legendArea.y + index * itemHeight + 10;
        const color = item.color || this.options.colors[index % this.options.colors.length];

        // Draw color box
        this.ctx.fillStyle = color;
        this.ctx.fillRect(legendArea.x + 10, y, 12, 12);

        // Draw label
        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = '12px system-ui, -apple-system, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        const percentage = ((item.value / this.total) * 100).toFixed(1);
        const text = `${item.label} (${percentage}%)`;
        const maxWidth = legendArea.width - 35;

        // Truncate if too long
        let displayText = text;
        if (this.ctx.measureText(text).width > maxWidth) {
          let truncated = text;
          while (this.ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
          }
          displayText = truncated + '...';
        }

        this.ctx.fillText(displayText, legendArea.x + 28, y + 6);
      });
    } else {
      // Horizontal legend
      const itemsPerRow = Math.floor(legendArea.width / 150);
      const rows = Math.ceil(items.length / itemsPerRow);
      const startY = legendArea.y + 10;

      items.forEach((item, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const x = legendArea.x + 10 + col * 150;
        const y = startY + row * itemHeight;
        const color = item.color || this.options.colors[index % this.options.colors.length];

        // Draw color box
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, 12, 12);

        // Draw label
        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = '12px system-ui, -apple-system, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        const percentage = ((item.value / this.total) * 100).toFixed(1);
        const text = `${item.label} (${percentage}%)`;
        const maxWidth = 120;

        // Truncate if too long
        let displayText = text;
        if (this.ctx.measureText(text).width > maxWidth) {
          let truncated = text;
          while (this.ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
          }
          displayText = truncated + '...';
        }

        this.ctx.fillText(displayText, x + 18, y + 6);
      });
    }
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
   * Handle hover events
   */
  handleHover(event) {
    // TODO: Implement hover highlighting
    // For now, this is a placeholder for future interactivity
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
    this.canvas.removeEventListener('mousemove', this.hoverHandler);
  }
}

export default PieChart;
