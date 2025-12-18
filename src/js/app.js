/**
 * V4L Application Entry Point
 * Initializes the app, sets up routing, and loads initial state
 */

import { router } from './router.js';
import { authState } from './state/auth-state.js';
import { orgState } from './state/org-state.js';
import { memberState } from './state/member-state.js';
import { navigationState } from './state/navigation-state.js';
import { notificationState } from './state/notification-state.js';
import { storageService } from './services/storage-service.js';
import { memberService } from './services/member-service.js';
import { notificationService } from './services/notification-service.js';
import { syncConfigService } from './services/sync-config.js';
import { processSync } from './services/bpm/process-sync.js';
import { userPersistence } from './services/user-persistence.js';
import { ROUTES, ROUTES_AUTH, EVENTS, COUCHDB_CONFIG } from './config/constants.js';
import ENV from './config/env.js';
import { eventBus } from './utils/events.js';
import { initializeBPM, exposeBPMGlobally } from './services/bpm/index.js';
import { BottomTabs } from './components/bottom-tabs.js';

class App {
  constructor() {
    this.initialized = false;
    this.currentPage = null;
    this.bottomTabs = null;
    // Preload page modules using Vite's import.meta.glob
    this.pageModules = import.meta.glob('./pages/**/*.js');
  }

  /**
   * Navigate to a route
   */
  navigate(path, params = {}) {
    return router.navigate(path, params);
  }

  /**
   * Go back in history
   */
  goBack() {
    window.history.back();
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this.initialized) return;

    console.log('Initializing V4L app...');

    try {
      // Show loading overlay
      this.showLoading();

      // Initialize Ionic components
      await this.initIonic();

      // Load stored session
      await this.loadStoredSession();

      // Set up router
      this.setupRouter();

      // Initialize router
      router.init();

      // Set up global event listeners
      this.setupEventListeners();

      // Set up network monitoring
      this.setupNetworkMonitoring();

      // Initialize BPM Framework
      await initializeBPM();

      // Initialize notification service
      await notificationService.init();

      // Initialize CouchDB sync configuration
      await this.initializeCouchDBSync();

      // Expose BPM globally in debug mode for testing
      if (ENV.DEBUG) {
        exposeBPMGlobally();
        // Also expose sync services for debugging
        window.syncConfigService = syncConfigService;
        window.processSync = processSync;
        window.userPersistence = userPersistence;
      }

      this.initialized = true;

      // Register service worker for PWA (web only)
      this.registerServiceWorker();

      // Show mock mode banner if in development
      if (ENV.DEBUG) {
        this.showMockModeBanner();
      }

      console.log('V4L app initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
      this.showError('Failed to initialize app');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Register service worker for PWA support
   */
  async registerServiceWorker() {
    // Only register service worker in production web environment
    if ('serviceWorker' in navigator && !ENV.DEBUG) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, prompt user to refresh
              this.showToast('New version available! Refresh to update.', 'info');
            }
          });
        });
      } catch (error) {
        console.log('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Initialize Ionic components
   */
  async initIonic() {
    // Ionic components are auto-initialized via CDN
    // Wait for them to be ready
    await customElements.whenDefined('ion-app');
  }

  /**
   * Load stored session from storage
   */
  async loadStoredSession() {
    try {
      const [user, accessToken, refreshToken, activeOrgId] = await Promise.all([
        storageService.getUser(),
        storageService.getAccessToken(),
        storageService.getRefreshToken(),
        storageService.getActiveOrgId()
      ]);

      if (user && accessToken) {
        // Restore auth state
        authState.setAuthenticated(user, accessToken, refreshToken);

        // TODO: Load organizations from local DB or API
        // For now, we'll load them when needed

        console.log('Session restored for user:', user.email);
      }
    } catch (error) {
      console.error('Error loading stored session:', error);
    }
  }

  /**
   * Set up router and register routes
   */
  setupRouter() {
    // Login page
    router.register(
      ROUTES.LOGIN,
      async () => {
        await this.loadPage('login-page');
      },
      { title: 'Login - V4L' }
    );

    // Registration page
    router.register(
      ROUTES_AUTH.REGISTER,
      async () => {
        await this.loadPage('register-page');
      },
      { title: 'Sign Up - V4L' }
    );

    // Password reset page
    router.register(
      ROUTES_AUTH.PASSWORD_RESET,
      async () => {
        await this.loadPage('password-reset-page');
      },
      { title: 'Reset Password - V4L' }
    );

    // Password reset confirmation page
    router.register(
      ROUTES_AUTH.PASSWORD_RESET_CONFIRM,
      async () => {
        await this.loadPage('password-reset-confirm-page');
      },
      { title: 'Set New Password - V4L' }
    );

    // Main navigation tabs
    router.register(
      ROUTES.HOME,
      async () => {
        await this.loadPage('tabs-page', { tab: 'home' });
      },
      { title: 'Home - V4L' }
    );

    router.register(
      ROUTES.MARKETPLACE,
      async () => {
        await this.loadPage('tabs-page', { tab: 'marketplace' });
      },
      { title: 'Marketplace - V4L' }
    );

    router.register(
      ROUTES.OPPORTUNITIES,
      async () => {
        await this.loadPage('tabs-page', { tab: 'opportunities' });
      },
      { title: 'Opportunities - V4L' }
    );

    router.register(
      ROUTES.MYSPACE,
      async () => {
        await this.loadPage('tabs-page', { tab: 'myspace' });
      },
      { requiresAuth: true, title: 'My Space - V4L' }
    );

    router.register(
      ROUTES.ACCOUNT,
      async () => {
        await this.loadPage('tabs-page', { tab: 'account' });
      },
      { title: 'Account - V4L' }
    );

    // Account sub-routes (user processes/records)
    router.register(
      ROUTES.ACCOUNT_PROCESSES,
      async () => {
        await this.loadPage('tabs-page', { tab: 'account', subTab: 'processes' });
      },
      { requiresAuth: true, title: 'My Records - V4L' }
    );

    router.register(
      ROUTES.ACCOUNT_EDUCATION,
      async () => {
        await this.loadPage('education-records-page');
      },
      { requiresAuth: true, title: 'Education Records - V4L' }
    );

    // Dashboard (requires auth) - redirect to home
    router.register(
      ROUTES.DASHBOARD,
      async () => {
        await router.navigate(ROUTES.HOME);
      },
      { requiresAuth: true, title: 'Dashboard - V4L' }
    );

    // Organizations list (requires auth)
    router.register(
      ROUTES.ORG_LIST,
      async () => {
        await this.loadPage('org-list-page');
      },
      { requiresAuth: true, title: 'Organizations - V4L' }
    );

    // Organization detail (requires auth)
    router.register(
      ROUTES.ORG_DETAIL,
      async (params) => {
        await this.loadPage('org-detail-page', params);
      },
      { requiresAuth: true, title: 'Organization - V4L' }
    );

    // Organization settings (requires auth)
    router.register(
      ROUTES.ORG_SETTINGS,
      async (params) => {
        await this.loadPage('org-settings-page', params);
      },
      { requiresAuth: true, title: 'Organization Settings - V4L' }
    );

    // Organization members (requires auth)
    router.register(
      ROUTES.ORG_MEMBERS,
      async (params) => {
        await this.loadPage('org-members-page', params);
      },
      { requiresAuth: true, title: 'Organization Members - V4L' }
    );

    // BPM - Dashboard (requires auth)
    router.register(
      '/myspace/dashboard',
      async () => {
        await this.loadPage('myspace/myspace-dashboard-page');
      },
      { requiresAuth: true, title: 'Dashboard - V4L' }
    );

    // BPM - Processes List (requires auth)
    router.register(
      '/myspace/processes',
      async () => {
        await this.loadPage('myspace/myspace-processes-page');
      },
      { requiresAuth: true, title: 'Processes - V4L' }
    );

    // BPM - My Tasks (requires auth)
    router.register(
      '/myspace/tasks',
      async () => {
        await this.loadPage('myspace/myspace-tasks-page');
      },
      { requiresAuth: true, title: 'My Tasks - V4L' }
    );

    // BPM - Reports (requires auth)
    router.register(
      '/myspace/reports',
      async () => {
        await this.loadPage('myspace/myspace-reports-page');
      },
      { requiresAuth: true, title: 'Reports - V4L' }
    );

    // BPM - Analytics (requires auth) - Phase 5
    router.register(
      '/myspace/analytics',
      async () => {
        await this.loadPage('myspace/myspace-analytics-page');
      },
      { requiresAuth: true, title: 'Analytics - V4L' }
    );

    // BPM - Process Detail (requires auth)
    router.register(
      '/process/:id',
      async (params) => {
        await this.loadPage('process/process-detail-page', params);
      },
      { requiresAuth: true, title: 'Process Detail - V4L' }
    );

    // BPM - Process Create (requires auth)
    router.register(
      '/process/create',
      async () => {
        await this.loadPage('process/process-create-page');
      },
      { requiresAuth: true, title: 'Create Process - V4L' }
    );

    // Profile (requires auth)
    router.register(
      ROUTES.PROFILE,
      async () => {
        await this.loadPage('profile-page');
      },
      { requiresAuth: true, title: 'Profile - V4L' }
    );

    // Settings (requires auth)
    router.register(
      ROUTES.SETTINGS,
      async () => {
        await this.loadPage('settings-page');
      },
      { requiresAuth: true, title: 'Settings - V4L' }
    );
  }

  /**
   * Load a page component
   * @param {string} pageName - Page component name
   * @param {Object} params - Route parameters
   */
  async loadPage(pageName, params = {}) {
    try {
      const outlet = document.getElementById('main-outlet');
      if (!outlet) return;

      // Get page module loader
      const modulePath = `./pages/${pageName}.js`;
      const moduleLoader = this.pageModules[modulePath];

      if (!moduleLoader) {
        console.error(`Page module not found: ${pageName}`);
        this.showError('Page not found');
        return;
      }

      // Import page module
      const module = await moduleLoader();
      const PageClass = module.default;

      // Create page instance
      const page = new PageClass(params);

      // Store current page for access from templates
      this.currentPage = page;

      // Check if this is a myspace page that needs bottom tabs
      const isMySpacePage = pageName.startsWith('myspace/');

      // Render page
      outlet.innerHTML = '';

      if (isMySpacePage) {
        // Set navigation state for myspace
        navigationState.setActiveTab('myspace');
        navigationState.state.currentLevel = 2;

        // Set active subtab based on page
        const subTabMap = {
          'myspace/myspace-dashboard-page': 'dashboard',
          'myspace/myspace-processes-page': 'processes',
          'myspace/myspace-tasks-page': 'tasks',
          'myspace/myspace-analytics-page': 'analytics'
        };
        if (subTabMap[pageName]) {
          navigationState.setActiveSubTab(subTabMap[pageName]);
        }

        // Create wrapper with page and bottom tabs
        const wrapper = document.createElement('div');
        wrapper.className = 'myspace-wrapper';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.height = '100%';

        // Page content container
        const pageContainer = document.createElement('div');
        pageContainer.className = 'myspace-page-container';
        pageContainer.style.flex = '1';
        pageContainer.style.overflow = 'auto';

        const element = await page.render();
        pageContainer.appendChild(element);
        wrapper.appendChild(pageContainer);

        // Add bottom tabs
        if (!this.bottomTabs) {
          this.bottomTabs = new BottomTabs();
        }
        const tabBar = this.bottomTabs.render();
        wrapper.appendChild(tabBar);

        outlet.appendChild(wrapper);
      } else {
        const element = await page.render();
        outlet.appendChild(element);
      }

      // Call page mounted hook
      if (page.mounted) {
        await page.mounted();
      }
    } catch (error) {
      console.error(`Error loading page ${pageName}:`, error);
      this.showError('Failed to load page');
    }
  }

  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    // Listen for auth state changes
    eventBus.on(EVENTS.AUTH_STATE_CHANGED, async (data) => {
      console.log('Auth state changed:', data);

      if (data.authenticated) {
        // Load member data for all organizations
        await this.initializeMemberData();

        // Redirect to home after login
        router.navigate(ROUTES.HOME);
      } else {
        // Clear member state on logout
        memberState.clear();

        // Clear notification state on logout
        notificationState.clear();

        // Redirect to login after logout
        router.navigate(ROUTES.LOGIN);
      }
    });

    // Listen for organization switch
    eventBus.on(EVENTS.ORG_SWITCHED, async (data) => {
      console.log('Organization switched:', data);

      // Load member data for new organization
      if (data.to && data.to.id) {
        try {
          await memberService.getOrgMembers(data.to.id);
          await memberService.getCurrentUserMembership(data.to.id);

          // Re-initialize sync for new organization
          if (syncConfigService.isConnected) {
            await syncConfigService.ensureDatabase(data.to.id);
            const remoteUrl = syncConfigService.getRemoteDbUrl(data.to.id);
            await processSync.switchOrganization(data.to.id, remoteUrl, syncConfigService.credentials);
            console.log('Sync switched to org:', data.to.id);
          } else {
            await processSync.switchOrganization(data.to.id, null, null);
          }
        } catch (err) {
          console.warn('Failed to load member data or sync for org:', err);
        }
      }
    });

    // Listen for errors
    eventBus.on(EVENTS.ERROR, (error) => {
      console.error('App error:', error);
      this.showError(error.message || 'An error occurred');
    });
  }

  /**
   * Initialize member data for all user organizations
   */
  async initializeMemberData() {
    try {
      const orgs = orgState.getAllOrganizations();

      // If no orgs in state, try to load default demo org
      if (orgs.length === 0) {
        await memberService.getOrgMembers('org_1');
        await memberService.getCurrentUserMembership('org_1');
      } else {
        for (const org of orgs) {
          await memberService.getOrgMembers(org.id);
          await memberService.getCurrentUserMembership(org.id);
        }
      }

      console.log('Member data initialized');
    } catch (error) {
      console.error('Error initializing member data:', error);
    }
  }

  /**
   * Initialize CouchDB sync
   */
  async initializeCouchDBSync() {
    try {
      // Initialize sync config service
      await syncConfigService.initialize();

      // Initialize user persistence (PouchDB)
      await userPersistence.ensureInitialized();

      // Check if we have an active organization
      const activeOrg = orgState.getActiveOrganization();

      if (syncConfigService.isConnected) {
        // Setup user database sync
        const userDbUrl = `${COUCHDB_CONFIG.DIRECT_URL}/bmpl_users`;
        await userPersistence.setupSync(userDbUrl, syncConfigService.credentials);
        console.log('User sync started');

        if (activeOrg) {
          // Ensure remote database exists for org
          await syncConfigService.ensureDatabase(activeOrg.id);

          // Get remote database URL
          const remoteUrl = syncConfigService.getRemoteDbUrl(activeOrg.id);

          // Initialize process sync with remote URL
          await processSync.initialize(activeOrg.id, remoteUrl, syncConfigService.credentials);

          console.log('CouchDB sync initialized for org:', activeOrg.id);
        }

        this.showToast('Database sync connected', 'success');
      } else {
        console.log('CouchDB not available, running in offline mode');
        // Initialize local-only sync
        if (activeOrg) {
          await processSync.initialize(activeOrg.id, null, null);
        }
      }

      // Listen for sync state changes
      eventBus.on(EVENTS.SYNC_STATE_CHANGED, (data) => {
        if (data.connected) {
          console.log('CouchDB connected');
        } else {
          console.log('CouchDB disconnected:', data.error);
        }
      });

    } catch (error) {
      console.error('Error initializing CouchDB sync:', error);
      // Continue without sync - local storage will still work
    }
  }

  /**
   * Set up network monitoring
   */
  async setupNetworkMonitoring() {
    // TODO: Implement Capacitor Network plugin monitoring
    // For now, use browser API
    window.addEventListener('online', () => {
      console.log('Network: Online');
      eventBus.emit(EVENTS.NETWORK_STATE_CHANGED, { connected: true });
      this.showToast('You are back online', 'success');
    });

    window.addEventListener('offline', () => {
      console.log('Network: Offline');
      eventBus.emit(EVENTS.NETWORK_STATE_CHANGED, { connected: false });
      this.showToast('You are offline', 'warning');
    });
  }

  /**
   * Show loading overlay
   */
  showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, warning, info)
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  /**
   * Show error toast
   * @param {string} message - Error message
   */
  showError(message) {
    this.showToast(message, 'error');
  }

  /**
   * Show mock mode banner
   */
  showMockModeBanner() {
    const banner = document.getElementById('mock-mode-banner');
    if (banner) {
      banner.classList.remove('hidden');
      console.log('🔧 Mock mode banner displayed');
    }
  }

  /**
   * Hide mock mode banner
   */
  hideMockModeBanner() {
    const banner = document.getElementById('mock-mode-banner');
    if (banner) {
      banner.classList.add('hidden');
    }
  }
}

// Create app instance
const app = new App();

// Expose app globally for onclick handlers in templates
window.app = app;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Export app instance
export default app;
