/**
 * Base Page Class
 * Base class for all pages with common functionality
 */

export class BasePage {
  constructor(params = {}) {
    this.params = params;
  }

  /**
   * Render the page (must be implemented by subclass)
   */
  async render() {
    throw new Error('render() must be implemented by subclass');
  }

  /**
   * Called after page is mounted to DOM
   */
  async mounted() {
    // Override in subclass if needed
  }

  /**
   * Called before page is removed from DOM
   */
  onWillLeave() {
    // Override in subclass if needed
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error(message);
    // TODO: Show toast notification
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    console.log(message);
    // TODO: Show toast notification
  }

  /**
   * Show loading indicator
   */
  showLoading() {
    // TODO: Implement loading indicator
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    // TODO: Implement loading indicator
  }
}

export default BasePage;
