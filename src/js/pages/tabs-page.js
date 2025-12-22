/**
 * Main Tabs Page
 * Wrapper for the tab-based navigation system
 */

import { BottomTabs } from '../components/bottom-tabs.js';
import { HomePage } from './home-page.js';
import { MarketplacePage } from './marketplace-page.js';
import { OpportunitiesPage } from './opportunities-page.js';
import { MySpacePage } from './myspace-page.js';
import { AccountPage } from './account-page.js';
import { navigationState } from '../state/navigation-state.js';
import { eventBus } from '../utils/events.js';

export class TabsPage {
  constructor(params = {}) {
    this.params = params;
    this.currentTab = params.tab || 'home';
    this.currentPage = null;
    this.bottomTabs = new BottomTabs();
    this.setupEventListeners();
  }

  /**
   * Render the tabs page
   */
  async render() {
    const container = document.createElement('div');
    container.className = 'tabs-container';

    // Create tab pages container
    const pagesContainer = document.createElement('div');
    pagesContainer.className = 'tab-pages';
    pagesContainer.id = 'tab-pages';

    // Render initial tab page (without calling mounted yet)
    await this.loadTabPage(this.currentTab, pagesContainer, false);

    container.appendChild(pagesContainer);

    // Add bottom tabs
    const tabBar = this.bottomTabs.render();
    container.appendChild(tabBar);

    return container;
  }

  /**
   * Load a specific tab page
   */
  async loadTabPage(tabId, container = null, callMounted = true) {
    const targetContainer = container || document.getElementById('tab-pages');
    if (!targetContainer) return;

    // Clean up previous page
    if (this.currentPage && this.currentPage.destroy) {
      this.currentPage.destroy();
    }

    // Create page based on tab
    let PageClass;
    switch (tabId) {
      case 'home':
        PageClass = HomePage;
        break;
      case 'marketplace':
        PageClass = MarketplacePage;
        break;
      case 'opportunities':
        PageClass = OpportunitiesPage;
        break;
      case 'myspace':
        PageClass = MySpacePage;
        break;
      case 'account':
        PageClass = AccountPage;
        break;
      default:
        PageClass = HomePage;
    }

    // Create and render page
    this.currentPage = new PageClass(this.params);
    this.currentPage._isMounted = false; // Initialize mounted flag
    const pageElement = await this.currentPage.render();

    // Clear container and append new page
    targetContainer.innerHTML = '';
    targetContainer.appendChild(pageElement);

    // Call mounted hook (only if requested)
    if (callMounted && this.currentPage.mounted && !this.currentPage._isMounted) {
      this.currentPage._isMounted = true;
      await this.currentPage.mounted();
    }

    this.currentTab = tabId;
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for tab changes
    eventBus.on('navigation:tab-changed', ({ tab }) => {
      this.loadTabPage(tab);
    });
  }

  /**
   * Called after page is mounted
   */
  async mounted() {
    // Call mounted on the current page now that it's in the DOM
    // Only if it hasn't been mounted yet
    if (this.currentPage && this.currentPage.mounted && !this.currentPage._isMounted) {
      this.currentPage._isMounted = true;
      await this.currentPage.mounted();
    }

    // If subTab is specified in params, set to Level 2 and activate subtab
    if (this.params.subTab) {
      navigationState.setActiveTab(this.currentTab);
      navigationState.state.currentLevel = 2;
      navigationState.setActiveSubTab(this.params.subTab);
      this.bottomTabs.refresh();

      // Emit event for page content to update
      eventBus.emit('navigation:subtab-clicked', {
        tab: this.currentTab,
        subTab: this.params.subTab
      });
    } else if (navigationState.getCurrentLevel() !== 1) {
      // Ensure we're at Level 1 when first loading without subTab
      navigationState.state.currentLevel = 1;
      navigationState.state.activeSubTab = null;
    }
  }

  /**
   * Clean up when page is destroyed
   */
  destroy() {
    if (this.currentPage && this.currentPage.destroy) {
      this.currentPage.destroy();
    }
    eventBus.off('navigation:tab-changed');
  }
}

export default TabsPage;
