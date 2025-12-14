/**
 * Client-Side Router
 * Handles navigation and route management
 */

import { authState } from './state/auth-state.js';
import { ROUTES } from './config/constants.js';

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.params = {};
    this.guards = [];
  }

  /**
   * Register a route
   * @param {string} path - Route path (supports :param syntax)
   * @param {Function} handler - Route handler function
   * @param {Object} options - Route options (requiresAuth, etc.)
   */
  register(path, handler, options = {}) {
    this.routes.set(path, {
      handler,
      requiresAuth: options.requiresAuth || false,
      title: options.title || null
    });
  }

  /**
   * Add navigation guard
   * @param {Function} guard - Guard function (to, from, next)
   */
  addGuard(guard) {
    this.guards.push(guard);
  }

  /**
   * Navigate to a path
   * @param {string} path - Path to navigate to
   * @param {Object} params - Additional parameters
   * @param {boolean} replace - Replace history instead of push
   * @returns {Promise<boolean>} Navigation success
   */
  async navigate(path, params = {}, replace = false) {
    try {
      // Find matching route
      const route = this.matchRoute(path);

      if (!route) {
        console.error('Route not found:', path);
        await this.navigate(ROUTES.LOGIN, {}, true);
        return false;
      }

      // Check authentication requirement
      if (route.requiresAuth && !authState.isAuth()) {
        console.log('Route requires authentication, redirecting to login');
        await this.navigate(ROUTES.LOGIN, { redirect: path }, true);
        return false;
      }

      // Run navigation guards
      for (const guard of this.guards) {
        const canNavigate = await guard(path, this.currentRoute, () => {});
        if (canNavigate === false) {
          return false;
        }
      }

      // Store current route for guards
      const from = this.currentRoute;

      // Extract params from path
      const extractedParams = this.extractParams(route.pattern, path);
      this.params = { ...extractedParams, ...params };

      // Update browser history
      if (replace) {
        window.history.replaceState({ path, params: this.params }, '', path);
      } else {
        window.history.pushState({ path, params: this.params }, '', path);
      }

      // Update page title
      if (route.title) {
        document.title = route.title;
      }

      // Call route handler
      await route.handler(this.params, from);

      // Update current route
      this.currentRoute = path;

      return true;
    } catch (error) {
      console.error('Navigation error:', error);
      return false;
    }
  }

  /**
   * Go back in history
   */
  back() {
    window.history.back();
  }

  /**
   * Go forward in history
   */
  forward() {
    window.history.forward();
  }

  /**
   * Replace current route
   * @param {string} path - Path to navigate to
   * @param {Object} params - Additional parameters
   * @returns {Promise<boolean>} Navigation success
   */
  async replace(path, params = {}) {
    return this.navigate(path, params, true);
  }

  /**
   * Match a path to a registered route
   * @param {string} path - Path to match
   * @returns {Object|null} Matched route
   */
  matchRoute(path) {
    // Try exact match first
    if (this.routes.has(path)) {
      return { ...this.routes.get(path), pattern: path };
    }

    // Try pattern matching
    for (const [pattern, route] of this.routes) {
      const regex = this.pathToRegex(pattern);
      if (regex.test(path)) {
        return { ...route, pattern };
      }
    }

    return null;
  }

  /**
   * Convert path pattern to regex
   * @param {string} pattern - Path pattern
   * @returns {RegExp} Regular expression
   */
  pathToRegex(pattern) {
    const regexPattern = pattern
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, '([^\\/]+)');

    return new RegExp(`^${regexPattern}$`);
  }

  /**
   * Extract parameters from path based on pattern
   * @param {string} pattern - Route pattern
   * @param {string} path - Actual path
   * @returns {Object} Extracted parameters
   */
  extractParams(pattern, path) {
    const params = {};
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.slice(1);
        params[paramName] = pathParts[i];
      }
    }

    return params;
  }

  /**
   * Get current route params
   * @returns {Object} Current params
   */
  getParams() {
    return this.params;
  }

  /**
   * Get current route
   * @returns {string|null} Current route
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Initialize router
   * Start listening to browser history events
   */
  init() {
    // Determine if we're using hash routing (default for Capacitor) or HTML5 history
    this.useHashRouting = window.location.protocol === 'capacitor:' ||
                          window.location.protocol === 'ionic:' ||
                          window.location.protocol === 'file:';

    // Handle browser back/forward
    window.addEventListener('popstate', async (e) => {
      if (e.state && e.state.path) {
        await this.navigate(e.state.path, e.state.params || {}, true);
      } else {
        // No state, navigate to current location
        const path = this.getCurrentPath();
        await this.navigate(path, {}, true);
      }
    });

    // Handle hash changes for hash routing
    if (this.useHashRouting) {
      window.addEventListener('hashchange', async () => {
        const path = window.location.hash.slice(1) || ROUTES.LOGIN;
        await this.navigate(path, {}, true);
      });
    }

    // Handle initial route
    const initialPath = this.getCurrentPath();
    const defaultRoute = authState.isAuth() ? '/home' : ROUTES.LOGIN;
    this.navigate(initialPath || defaultRoute, {}, true);

    // Handle link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-link]');
      if (link) {
        e.preventDefault();
        const path = link.getAttribute('href');
        this.navigate(path);
      }
    });
  }

  /**
   * Get current path from URL
   */
  getCurrentPath() {
    if (this.useHashRouting) {
      return window.location.hash.slice(1) || ROUTES.LOGIN;
    } else {
      return window.location.pathname || ROUTES.LOGIN;
    }
  }
}

// Export singleton instance
export const router = new Router();

// Add authentication guard
router.addGuard(async (to, from, next) => {
  // Implement any global navigation logic here
  return true;
});

export default Router;
