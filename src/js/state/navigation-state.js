/**
 * Navigation State Management
 * Manages the two-level navigation system state
 */

import { eventBus } from '../utils/events.js';
import { authState } from './auth-state.js';

class NavigationState {
  constructor() {
    this.state = {
      currentLevel: 1,
      activeTab: 'home',
      activeSubTab: null,
      history: [],
      previousTab: null
    };
  }

  /**
   * Get current navigation state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Set active tab (Level 1)
   * @param {string} tab - Tab name (home, marketplace, opportunities, myspace, account)
   */
  setActiveTab(tab) {
    if (this.state.activeTab !== tab) {
      this.state.previousTab = this.state.activeTab;
      this.state.activeTab = tab;
      this.state.currentLevel = 1;
      this.state.activeSubTab = null;

      eventBus.emit('navigation:tab-changed', {
        tab,
        previousTab: this.state.previousTab
      });
    }
  }

  /**
   * Set active sub-tab (Level 2)
   * @param {string} subTab - Sub-tab name
   */
  setActiveSubTab(subTab) {
    if (subTab === 'back') {
      this.goBackToLevel1();
    } else {
      this.state.activeSubTab = subTab;
      this.state.currentLevel = 2;

      eventBus.emit('navigation:subtab-changed', {
        tab: this.state.activeTab,
        subTab
      });
    }
  }

  /**
   * Go back to Level 1 navigation
   */
  goBackToLevel1() {
    this.state.currentLevel = 1;
    this.state.activeSubTab = null;

    eventBus.emit('navigation:level-changed', {
      level: 1,
      tab: this.state.activeTab
    });
  }

  /**
   * Get current tab
   */
  getCurrentTab() {
    return this.state.activeTab;
  }

  /**
   * Get current sub-tab
   */
  getCurrentSubTab() {
    return this.state.activeSubTab;
  }

  /**
   * Get current level
   */
  getCurrentLevel() {
    return this.state.currentLevel;
  }

  /**
   * Check if a tab requires authentication
   * @param {string} tab - Tab name
   */
  requiresAuth(tab) {
    const authRequiredTabs = ['myspace'];
    return authRequiredTabs.includes(tab);
  }

  /**
   * Check if user can access a tab
   * @param {string} tab - Tab name
   */
  canAccessTab(tab) {
    if (this.requiresAuth(tab)) {
      return authState.isAuth();
    }
    return true;
  }

  /**
   * Add to navigation history
   * @param {Object} entry - History entry
   */
  addToHistory(entry) {
    this.state.history.push({
      ...entry,
      timestamp: Date.now()
    });

    // Keep only last 50 entries
    if (this.state.history.length > 50) {
      this.state.history.shift();
    }
  }

  /**
   * Get navigation history
   */
  getHistory() {
    return [...this.state.history];
  }

  /**
   * Clear navigation history
   */
  clearHistory() {
    this.state.history = [];
  }
}

export const navigationState = new NavigationState();
export default NavigationState;
