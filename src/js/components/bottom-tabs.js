/**
 * Bottom Tab Bar Component
 * Unified navigation bar that switches between Level 1 (main tabs) and Level 2 (sub-tabs)
 */

import { navigationState } from '../state/navigation-state.js';
import { authState } from '../state/auth-state.js';
import { eventBus } from '../utils/events.js';
import { router } from '../router.js';

export class BottomTabs {
  constructor() {
    this.level1Tabs = [
      {
        id: 'home',
        label: 'Home',
        icon: 'home-outline',
        iconActive: 'home',
        route: '/home',
        requiresAuth: false
      },
      {
        id: 'marketplace',
        label: 'Marketplace',
        icon: 'storefront-outline',
        iconActive: 'storefront',
        route: '/marketplace',
        requiresAuth: false
      },
      {
        id: 'opportunities',
        label: 'Opportunities',
        icon: 'briefcase-outline',
        iconActive: 'briefcase',
        route: '/opportunities',
        requiresAuth: false
      },
      {
        id: 'myspace',
        label: 'My Space',
        icon: 'business-outline',
        iconActive: 'business',
        route: '/myspace',
        requiresAuth: true
      },
      {
        id: 'account',
        label: 'Account',
        icon: 'person-outline',
        iconActive: 'person',
        route: '/account',
        requiresAuth: false
      }
    ];

    this.level2Tabs = this.getLevel2TabsConfig();
    this.setupEventListeners();
  }

  /**
   * Get Level 2 tabs configuration for all main tabs
   */
  getLevel2TabsConfig() {
    const isAuthenticated = authState.isAuth();
    const isAdmin = authState.getUser()?.role === 'admin';

    return {
      home: [
        { id: 'back', label: 'Back', icon: 'arrow-back' },
        { id: 'nearme', label: 'Near Me', icon: 'location' },
        { id: 'new', label: 'New', icon: 'sparkles' },
        { id: 'top', label: 'Top', icon: 'star' },
        { id: 'all', label: 'All', icon: 'globe' }
      ],
      marketplace: [
        { id: 'back', label: 'Back', icon: 'arrow-back' },
        { id: 'products', label: 'Products', icon: 'cube' },
        { id: 'services', label: 'Services', icon: 'construct' },
        { id: 'rentals', label: 'Rentals', icon: 'home' },
        { id: 'categories', label: 'Categories', icon: 'list' }
      ],
      opportunities: [
        { id: 'back', label: 'Back', icon: 'arrow-back' },
        { id: 'jobs', label: 'Jobs', icon: 'briefcase' },
        ...(isAuthenticated ? [
          { id: 'applied', label: 'Applied', icon: 'checkmark-circle' },
          { id: 'saved', label: 'Saved', icon: 'bookmark' }
        ] : []),
        ...(isAdmin ? [{ id: 'post', label: 'Post', icon: 'add-circle' }] : [])
      ],
      myspace: [
        { id: 'back', label: 'Back', icon: 'arrow-back' },
        { id: 'dashboard', label: 'Dashboard', icon: 'speedometer', route: '/myspace/dashboard' },
        { id: 'processes', label: 'Processes', icon: 'git-network', route: '/myspace/processes' },
        { id: 'tasks', label: 'My Tasks', icon: 'checkbox', route: '/myspace/tasks' },
        { id: 'analytics', label: 'Analytics', icon: 'analytics', route: '/myspace/analytics' }
      ],
      account: isAuthenticated ? [
        { id: 'back', label: 'Back', icon: 'arrow-back' },
        { id: 'profile', label: 'Profile', icon: 'person' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
        { id: 'notifications', label: 'Alerts', icon: 'notifications' },
        { id: 'logout', label: 'Logout', icon: 'log-out' }
      ] : [
        { id: 'back', label: 'Back', icon: 'arrow-back' },
        { id: 'login', label: 'Login', icon: 'log-in' },
        { id: 'register', label: 'Register', icon: 'person-add' },
        { id: 'about', label: 'About', icon: 'information-circle' },
        { id: 'help', label: 'Help', icon: 'help-circle' }
      ]
    };
  }

  /**
   * Render the bottom tab bar
   */
  render() {
    const tabBar = document.createElement('ion-tab-bar');
    tabBar.setAttribute('slot', 'bottom');
    tabBar.className = 'bottom-tab-bar';
    tabBar.id = 'main-tab-bar';

    this.renderTabButtons(tabBar);
    return tabBar;
  }

  /**
   * Render tab buttons based on current level
   */
  renderTabButtons(container) {
    const currentLevel = navigationState.getCurrentLevel();
    const currentTab = navigationState.getCurrentTab();

    container.innerHTML = '';

    if (currentLevel === 1) {
      // Show Level 1 tabs (main navigation)
      this.level1Tabs.forEach(tab => {
        const button = this.createLevel1Button(tab);
        container.appendChild(button);
      });
    } else {
      // Show Level 2 tabs (sub-navigation)
      const level2Tabs = this.level2Tabs[currentTab] || [];
      level2Tabs.forEach((tab, index) => {
        const button = this.createLevel2Button(tab, currentTab, index === 1);
        container.appendChild(button);
      });
    }
  }

  /**
   * Create Level 1 tab button
   */
  createLevel1Button(tab) {
    const currentTab = navigationState.getCurrentTab();
    const isActive = currentTab === tab.id;
    const isAuthenticated = authState.isAuth();

    const button = document.createElement('ion-tab-button');
    button.setAttribute('tab', tab.id);
    button.className = `tab-${tab.id}`;

    if (isActive) {
      button.classList.add('tab-selected');
    }

    // Icon
    const icon = document.createElement('ion-icon');
    icon.setAttribute('name', isActive ? tab.iconActive : tab.icon);
    button.appendChild(icon);

    // Label
    const label = document.createElement('ion-label');
    label.textContent = tab.label;
    button.appendChild(label);

    // Lock icon for auth-required tabs
    if (tab.requiresAuth && !isAuthenticated) {
      const lockIcon = document.createElement('ion-icon');
      lockIcon.setAttribute('name', 'lock-closed');
      lockIcon.className = 'tab-lock-icon';
      button.appendChild(lockIcon);
    }

    // Click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleLevel1Click(tab);
    });

    return button;
  }

  /**
   * Create Level 2 tab button
   */
  createLevel2Button(tab, parentTab, isDefault) {
    const currentSubTab = navigationState.getCurrentSubTab();
    const isActive = currentSubTab === tab.id || (!currentSubTab && isDefault);

    const button = document.createElement('ion-tab-button');
    button.setAttribute('tab', tab.id);
    button.className = `subtab-${tab.id}`;

    if (isActive && tab.id !== 'back') {
      button.classList.add('tab-selected');
    }

    // Icon
    const icon = document.createElement('ion-icon');
    icon.setAttribute('name', tab.icon);
    button.appendChild(icon);

    // Label
    const label = document.createElement('ion-label');
    label.textContent = tab.label;
    button.appendChild(label);

    // Click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleLevel2Click(tab, parentTab);
    });

    return button;
  }

  /**
   * Handle Level 1 tab click
   */
  handleLevel1Click(tab) {
    const isAuthenticated = authState.isAuth();

    // Check if tab requires authentication
    if (tab.requiresAuth && !isAuthenticated) {
      router.navigate('/login', { redirect: tab.route });
      eventBus.emit('navigation:auth-required', { tab: tab.id });
      return;
    }

    // Set active tab and switch to Level 2
    navigationState.setActiveTab(tab.id);

    // Switch to Level 2 (show sub-tabs)
    navigationState.state.currentLevel = 2;
    navigationState.state.activeSubTab = null;

    // Re-render the bottom bar
    this.refresh();

    // Navigate to tab route
    router.navigate(tab.route);
  }

  /**
   * Handle Level 2 tab click
   */
  handleLevel2Click(tab, parentTab) {
    if (tab.id === 'back') {
      // Go back to Level 1
      navigationState.goBackToLevel1();
      this.refresh();
      return;
    }

    // Set active sub-tab
    navigationState.setActiveSubTab(tab.id);

    // Update visual state
    this.updateActiveSubTab(tab.id);

    // If tab has a route, navigate to it (for BPM pages)
    if (tab.route) {
      router.navigate(tab.route);
    }

    // Emit event for page content to update
    eventBus.emit('navigation:subtab-clicked', {
      tab: parentTab,
      subTab: tab.id
    });
  }

  /**
   * Update active sub-tab styling
   */
  updateActiveSubTab(subTabId) {
    const allButtons = document.querySelectorAll('#main-tab-bar ion-tab-button');

    allButtons.forEach(button => {
      const buttonTabId = button.getAttribute('tab');
      const isActive = buttonTabId === subTabId;

      if (isActive && buttonTabId !== 'back') {
        button.classList.add('tab-selected');
      } else {
        button.classList.remove('tab-selected');
      }
    });
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for level changes
    eventBus.on('navigation:level-changed', () => {
      this.refresh();
    });

    // Listen for auth state changes to update tabs
    eventBus.on('auth:state-changed', () => {
      this.level2Tabs = this.getLevel2TabsConfig();
      this.refresh();
    });
  }

  /**
   * Refresh the tab bar (re-render buttons)
   */
  refresh() {
    const tabBar = document.getElementById('main-tab-bar');
    if (tabBar) {
      this.renderTabButtons(tabBar);
    }
  }
}

export default BottomTabs;
