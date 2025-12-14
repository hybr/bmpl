/**
 * Sub-Navigation Component (Level 2 Navigation)
 * Context-aware sub-navigation for each main tab
 */

import { navigationState } from '../state/navigation-state.js';
import { authState } from '../state/auth-state.js';
import { eventBus } from '../utils/events.js';

export class SubNavigation {
  constructor(tabId) {
    this.tabId = tabId;
    this.subTabs = this.getSubTabsForTab(tabId);
  }

  /**
   * Get sub-tabs configuration for a specific tab
   */
  getSubTabsForTab(tabId) {
    const isAuthenticated = authState.isAuth();
    const isAdmin = authState.getUser()?.role === 'admin';

    const subTabConfigs = {
      home: [
        { id: 'back', label: 'Back', icon: 'arrow-back', alwaysShow: true },
        { id: 'nearme', label: 'Near Me', icon: 'location', alwaysShow: true },
        { id: 'new', label: 'New', icon: 'sparkles', alwaysShow: true },
        { id: 'top', label: 'Top Rated', icon: 'star', alwaysShow: true },
        { id: 'all', label: 'All', icon: 'globe', alwaysShow: true }
      ],
      marketplace: [
        { id: 'back', label: 'Back', icon: 'arrow-back', alwaysShow: true },
        { id: 'products', label: 'Products', icon: 'cube', alwaysShow: true },
        { id: 'services', label: 'Services', icon: 'construct', alwaysShow: true },
        { id: 'rentals', label: 'Rentals', icon: 'home', alwaysShow: true },
        { id: 'categories', label: 'Categories', icon: 'list', alwaysShow: true }
      ],
      opportunities: [
        { id: 'back', label: 'Back', icon: 'arrow-back', alwaysShow: true },
        { id: 'jobs', label: 'Jobs', icon: 'briefcase', alwaysShow: true },
        { id: 'applied', label: 'Applied', icon: 'checkmark-circle', requiresAuth: true },
        { id: 'saved', label: 'Saved', icon: 'bookmark', requiresAuth: true },
        { id: 'post', label: 'Post Job', icon: 'add-circle', requiresAdmin: true }
      ],
      myspace: [
        { id: 'back', label: 'Back', icon: 'arrow-back', alwaysShow: true },
        { id: 'orgs', label: 'Organizations', icon: 'business', alwaysShow: true },
        { id: 'orders', label: 'Orders', icon: 'cart', alwaysShow: true },
        { id: 'tasks', label: 'Tasks', icon: 'checkbox', alwaysShow: true },
        { id: 'addorg', label: 'Add Org', icon: 'add-circle', alwaysShow: true }
      ],
      account: isAuthenticated ? [
        { id: 'back', label: 'Back', icon: 'arrow-back', alwaysShow: true },
        { id: 'profile', label: 'Profile', icon: 'person', alwaysShow: true },
        { id: 'settings', label: 'Settings', icon: 'settings', alwaysShow: true },
        { id: 'notifications', label: 'Notifications', icon: 'notifications', alwaysShow: true },
        { id: 'logout', label: 'Logout', icon: 'log-out', alwaysShow: true }
      ] : [
        { id: 'back', label: 'Back', icon: 'arrow-back', alwaysShow: true },
        { id: 'login', label: 'Login', icon: 'log-in', alwaysShow: true },
        { id: 'register', label: 'Register', icon: 'person-add', alwaysShow: true },
        { id: 'about', label: 'About', icon: 'information-circle', alwaysShow: true },
        { id: 'help', label: 'Help', icon: 'help-circle', alwaysShow: true }
      ]
    };

    let tabs = subTabConfigs[tabId] || [];

    // Filter tabs based on auth requirements
    return tabs.filter(tab => {
      if (tab.alwaysShow) return true;
      if (tab.requiresAuth && !isAuthenticated) return false;
      if (tab.requiresAdmin && !isAdmin) return false;
      return true;
    });
  }

  /**
   * Render the sub-navigation bar
   */
  render() {
    const container = document.createElement('div');
    container.className = 'sub-navigation';
    container.id = `sub-nav-${this.tabId}`;

    const segment = document.createElement('ion-segment');
    segment.className = 'sub-nav-segment';
    segment.setAttribute('scrollable', 'true');

    this.subTabs.forEach((subTab, index) => {
      const button = this.createSubTabButton(subTab, index === 0);
      segment.appendChild(button);
    });

    container.appendChild(segment);
    return container;
  }

  /**
   * Create individual sub-tab button
   */
  createSubTabButton(subTab, isFirst) {
    const currentSubTab = navigationState.getCurrentSubTab();
    const isActive = currentSubTab === subTab.id || (isFirst && !currentSubTab);

    if (subTab.id === 'back') {
      // Special styling for back button
      const button = document.createElement('ion-button');
      button.className = 'sub-nav-back-button';
      button.setAttribute('fill', 'clear');
      button.setAttribute('size', 'small');

      const icon = document.createElement('ion-icon');
      icon.setAttribute('name', subTab.icon);
      icon.setAttribute('slot', 'start');

      const label = document.createElement('span');
      label.textContent = subTab.label;

      button.appendChild(icon);
      button.appendChild(label);

      button.addEventListener('click', () => {
        this.handleSubTabClick(subTab);
      });

      return button;
    }

    // Regular sub-tab segment button
    const button = document.createElement('ion-segment-button');
    button.setAttribute('value', subTab.id);
    button.className = `sub-tab-${subTab.id}`;

    if (isActive) {
      button.classList.add('segment-button-checked');
    }

    // Icon
    const icon = document.createElement('ion-icon');
    icon.setAttribute('name', subTab.icon);
    button.appendChild(icon);

    // Label
    const label = document.createElement('ion-label');
    label.textContent = subTab.label;
    button.appendChild(label);

    // Click handler
    button.addEventListener('click', () => {
      this.handleSubTabClick(subTab);
    });

    return button;
  }

  /**
   * Handle sub-tab button click
   */
  handleSubTabClick(subTab) {
    if (subTab.id === 'back') {
      navigationState.goBackToLevel1();
      eventBus.emit('navigation:back-to-level-1');
      return;
    }

    // Check auth requirements
    if (subTab.requiresAuth && !authState.isAuth()) {
      eventBus.emit('navigation:auth-required', { subTab: subTab.id });
      return;
    }

    // Set active sub-tab
    navigationState.setActiveSubTab(subTab.id);

    // Emit event for parent page to handle
    eventBus.emit('navigation:subtab-clicked', {
      tab: this.tabId,
      subTab: subTab.id
    });
  }

  /**
   * Update active sub-tab styling
   */
  updateActiveSubTab(subTabId) {
    const allButtons = document.querySelectorAll(`#sub-nav-${this.tabId} ion-segment-button`);

    allButtons.forEach(button => {
      const buttonValue = button.getAttribute('value');
      if (buttonValue === subTabId) {
        button.classList.add('segment-button-checked');
      } else {
        button.classList.remove('segment-button-checked');
      }
    });
  }

  /**
   * Show the sub-navigation
   */
  show() {
    const container = document.getElementById(`sub-nav-${this.tabId}`);
    if (container) {
      container.style.display = 'block';
    }
  }

  /**
   * Hide the sub-navigation
   */
  hide() {
    const container = document.getElementById(`sub-nav-${this.tabId}`);
    if (container) {
      container.style.display = 'none';
    }
  }
}

export default SubNavigation;
