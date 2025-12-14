/**
 * Navigation State Management
 * Manages current tab, level, and navigation history
 */

import { Store } from './store.js';
import { authState } from './auth-state.js';

class NavigationState extends Store {
  constructor() {
    super();
    this.state = {
      currentLevel: 1, // 1 or 2
      activeTab: 'home', // home, marketplace, opportunities, myspace, account
      activeSubTab: null, // Sub-tab when level 2 is active
      history: [],
      previousTab: null,
      badges: {
        home: 0,
        marketplace: 0,
        opportunities: 0,
        myspace: 0,
        account: 0
      }
    };
  }

  /**
   * Navigate to Level 1 tab
   */
  navigateToTab(tab) {
    // Check if tab requires authentication
    if (tab === 'myspace' && !authState.isAuth()) {
      console.warn('My Space requires authentication');
      return false;
    }

    this.state.previousTab = this.state.activeTab;
    this.state.activeTab = tab;
    this.state.currentLevel = 1;
    this.state.activeSubTab = null;

    this.emit('tab-changed', {
      tab,
      level: 1,
      previousTab: this.state.previousTab
    });

    return true;
  }

  /**
   * Navigate to Level 2 (expand sub-navigation)
   */
  expandToLevel2(subTab = null) {
    this.state.currentLevel = 2;
    this.state.activeSubTab = subTab;

    // Add to history
    this.state.history.push({
      tab: this.state.activeTab,
      level: 2,
      subTab
    });

    this.emit('level-changed', {
      level: 2,
      tab: this.state.activeTab,
      subTab
    });
  }

  /**
   * Navigate to sub-tab (within Level 2)
   */
  navigateToSubTab(subTab) {
    if (this.state.currentLevel !== 2) {
      this.expandToLevel2(subTab);
      return;
    }

    this.state.activeSubTab = subTab;

    this.emit('subtab-changed', {
      subTab,
      tab: this.state.activeTab
    });
  }

  /**
   * Go back to Level 1
   */
  collapseToLevel1() {
    this.state.currentLevel = 1;
    this.state.activeSubTab = null;

    // Remove from history
    if (this.state.history.length > 0) {
      this.state.history.pop();
    }

    this.emit('level-changed', {
      level: 1,
      tab: this.state.activeTab
    });
  }

  /**
   * Go back in navigation
   */
  goBack() {
    if (this.state.currentLevel === 2) {
      this.collapseToLevel1();
      return true;
    }

    if (this.state.history.length > 0) {
      const previous = this.state.history.pop();
      this.state.activeTab = previous.tab;
      this.state.currentLevel = previous.level;
      this.state.activeSubTab = previous.subTab;

      this.emit('navigation-back', {
        tab: this.state.activeTab,
        level: this.state.currentLevel,
        subTab: this.state.activeSubTab
      });

      return true;
    }

    return false;
  }

  /**
   * Update badge count for a tab
   */
  updateBadge(tab, count) {
    this.state.badges[tab] = count;
    this.emit('badge-updated', { tab, count });
  }

  /**
   * Increment badge count
   */
  incrementBadge(tab) {
    this.state.badges[tab]++;
    this.emit('badge-updated', { tab, count: this.state.badges[tab] });
  }

  /**
   * Clear badge for a tab
   */
  clearBadge(tab) {
    this.state.badges[tab] = 0;
    this.emit('badge-updated', { tab, count: 0 });
  }

  /**
   * Get current navigation state
   */
  getCurrentState() {
    return {
      level: this.state.currentLevel,
      tab: this.state.activeTab,
      subTab: this.state.activeSubTab,
      badges: { ...this.state.badges }
    };
  }

  /**
   * Get available sub-tabs for current tab
   */
  getSubTabs() {
    const isAuthenticated = authState.isAuth();
    const user = authState.getUser();
    const isAdmin = user?.role === 'admin' || user?.role === 'owner';

    switch (this.state.activeTab) {
      case 'home':
        return [
          { id: 'nearme', label: 'Near Me', icon: 'location-outline' },
          { id: 'new', label: 'New', icon: 'sparkles-outline' },
          { id: 'top', label: 'Top Rated', icon: 'star-outline' },
          { id: 'all', label: 'All', icon: 'globe-outline' }
        ];

      case 'marketplace':
        return [
          { id: 'products', label: 'Products', icon: 'cube-outline' },
          { id: 'services', label: 'Services', icon: 'construct-outline' },
          { id: 'rentals', label: 'Rentals', icon: 'home-outline' },
          { id: 'categories', label: 'Categories', icon: 'list-outline' }
        ];

      case 'opportunities':
        return [
          { id: 'browse', label: 'Browse', icon: 'briefcase-outline' },
          { id: 'applied', label: 'Applied', icon: 'checkmark-done-outline', requiresAuth: true },
          { id: 'saved', label: 'Saved', icon: 'bookmark-outline', requiresAuth: true },
          { id: 'post', label: 'Post Job', icon: 'add-circle-outline', requiresAdmin: true }
        ].filter(item => {
          if (item.requiresAuth && !isAuthenticated) return false;
          if (item.requiresAdmin && !isAdmin) return false;
          return true;
        });

      case 'myspace':
        return [
          { id: 'organizations', label: 'Organizations', icon: 'business-outline' },
          { id: 'orders', label: 'Orders', icon: 'cart-outline' },
          { id: 'tasks', label: 'Tasks', icon: 'checkmark-circle-outline' },
          { id: 'addorg', label: 'Add Org', icon: 'add-circle-outline' }
        ];

      case 'account':
        if (isAuthenticated) {
          return [
            { id: 'profile', label: 'Profile', icon: 'person-outline' },
            { id: 'settings', label: 'Settings', icon: 'settings-outline' },
            { id: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
            { id: 'logout', label: 'Logout', icon: 'log-out-outline' }
          ];
        } else {
          return [
            { id: 'login', label: 'Login', icon: 'log-in-outline' },
            { id: 'register', label: 'Register', icon: 'person-add-outline' },
            { id: 'about', label: 'About', icon: 'information-circle-outline' },
            { id: 'help', label: 'Help', icon: 'help-circle-outline' }
          ];
        }

      default:
        return [];
    }
  }

  /**
   * Check if current tab is active
   */
  isTabActive(tab) {
    return this.state.activeTab === tab;
  }

  /**
   * Check if current sub-tab is active
   */
  isSubTabActive(subTab) {
    return this.state.activeSubTab === subTab;
  }

  /**
   * Get badge count for a tab
   */
  getBadgeCount(tab) {
    return this.state.badges[tab];
  }
}

// Export singleton instance
export const navState = new NavigationState();

export default NavigationState;
