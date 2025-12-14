/**
 * Home/Discover Page
 * Main discovery feed with featured businesses, trending products, and job postings
 */

import { navigationState } from '../state/navigation-state.js';
import { eventBus } from '../utils/events.js';

export class HomePage {
  constructor(params = {}) {
    this.params = params;
    this.currentFilter = 'all';
    this.setupEventListeners();
  }

  /**
   * Render the home page
   */
  async render() {
    const page = document.createElement('ion-page');
    page.className = 'home-page';

    // Header
    const header = this.createHeader();
    page.appendChild(header);

    // Content
    const content = document.createElement('ion-content');
    content.className = 'home-content';

    // Main content area
    const mainContent = document.createElement('div');
    mainContent.className = 'home-main-content';
    mainContent.id = 'home-main-content';

    // Initial content
    mainContent.innerHTML = this.getContentForFilter('all');

    content.appendChild(mainContent);
    page.appendChild(content);

    return page;
  }

  /**
   * Create page header
   */
  createHeader() {
    const header = document.createElement('ion-header');

    const toolbar = document.createElement('ion-toolbar');
    toolbar.className = 'home-toolbar';

    const title = document.createElement('ion-title');
    title.textContent = 'Discover';
    toolbar.appendChild(title);

    // Search button
    const searchButton = document.createElement('ion-button');
    searchButton.setAttribute('slot', 'end');
    searchButton.setAttribute('fill', 'clear');

    const searchIcon = document.createElement('ion-icon');
    searchIcon.setAttribute('name', 'search');
    searchButton.appendChild(searchIcon);

    searchButton.addEventListener('click', () => {
      this.openSearch();
    });

    toolbar.appendChild(searchButton);

    header.appendChild(toolbar);
    return header;
  }

  /**
   * Get content HTML for a specific filter
   */
  getContentForFilter(filter) {
    const contentMap = {
      all: this.getAllContent(),
      nearme: this.getNearMeContent(),
      new: this.getNewContent(),
      top: this.getTopRatedContent()
    };

    return contentMap[filter] || contentMap.all;
  }

  /**
   * Get "All" content
   */
  getAllContent() {
    return `
      <div class="content-section">
        <h2>Featured Businesses</h2>
        <div class="card-grid">
          <ion-card class="business-card">
            <img src="/images/placeholder-business.jpg" alt="Business" />
            <ion-card-header>
              <ion-card-title>Local Coffee Shop</ion-card-title>
              <ion-card-subtitle>Coffee & Bakery</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div class="rating">
                <ion-icon name="star"></ion-icon>
                <span>4.8 (120 reviews)</span>
              </div>
              <div class="location">
                <ion-icon name="location"></ion-icon>
                <span>2.3 km away</span>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="business-card">
            <img src="/images/placeholder-business.jpg" alt="Business" />
            <ion-card-header>
              <ion-card-title>Fresh Produce Market</ion-card-title>
              <ion-card-subtitle>Grocery & Produce</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div class="rating">
                <ion-icon name="star"></ion-icon>
                <span>4.6 (85 reviews)</span>
              </div>
              <div class="location">
                <ion-icon name="location"></ion-icon>
                <span>1.8 km away</span>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <h2>Trending Products</h2>
        <div class="card-grid">
          <ion-card class="product-card">
            <img src="/images/placeholder-product.jpg" alt="Product" />
            <ion-card-header>
              <ion-card-title>Handmade Pottery</ion-card-title>
              <ion-card-subtitle>$45.00</ion-card-subtitle>
            </ion-card-header>
          </ion-card>

          <ion-card class="product-card">
            <img src="/images/placeholder-product.jpg" alt="Product" />
            <ion-card-header>
              <ion-card-title>Organic Honey</ion-card-title>
              <ion-card-subtitle>$12.00</ion-card-subtitle>
            </ion-card-header>
          </ion-card>
        </div>

        <h2>Recent Job Postings</h2>
        <div class="list-section">
          <ion-list>
            <ion-item>
              <ion-icon name="briefcase" slot="start"></ion-icon>
              <ion-label>
                <h3>Barista</h3>
                <p>Local Coffee Shop • Full-time</p>
              </ion-label>
              <ion-badge color="success">New</ion-badge>
            </ion-item>

            <ion-item>
              <ion-icon name="briefcase" slot="start"></ion-icon>
              <ion-label>
                <h3>Delivery Driver</h3>
                <p>Fresh Produce Market • Part-time</p>
              </ion-label>
              <ion-badge color="success">New</ion-badge>
            </ion-item>
          </ion-list>
        </div>
      </div>
    `;
  }

  /**
   * Get "Near Me" content
   */
  getNearMeContent() {
    return `
      <div class="content-section">
        <h2>Businesses Near You</h2>
        <div class="card-grid">
          <ion-card class="business-card">
            <img src="/images/placeholder-business.jpg" alt="Business" />
            <ion-card-header>
              <ion-card-title>Corner Bakery</ion-card-title>
              <ion-card-subtitle>Bakery</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div class="rating">
                <ion-icon name="star"></ion-icon>
                <span>4.9 (200 reviews)</span>
              </div>
              <div class="location">
                <ion-icon name="location"></ion-icon>
                <span>0.5 km away</span>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    `;
  }

  /**
   * Get "New" content
   */
  getNewContent() {
    return `
      <div class="content-section">
        <h2>Recently Added</h2>
        <div class="card-grid">
          <ion-card class="business-card">
            <ion-badge color="success" class="new-badge">New</ion-badge>
            <img src="/images/placeholder-business.jpg" alt="Business" />
            <ion-card-header>
              <ion-card-title>Tech Repair Shop</ion-card-title>
              <ion-card-subtitle>Electronics Repair</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div class="location">
                <ion-icon name="location"></ion-icon>
                <span>3.2 km away</span>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    `;
  }

  /**
   * Get "Top Rated" content
   */
  getTopRatedContent() {
    return `
      <div class="content-section">
        <h2>Top Rated Businesses</h2>
        <div class="card-grid">
          <ion-card class="business-card">
            <img src="/images/placeholder-business.jpg" alt="Business" />
            <ion-card-header>
              <ion-card-title>Premium Coffee House</ion-card-title>
              <ion-card-subtitle>Coffee & Tea</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div class="rating">
                <ion-icon name="star"></ion-icon>
                <span>5.0 (500 reviews)</span>
              </div>
              <div class="location">
                <ion-icon name="location"></ion-icon>
                <span>4.1 km away</span>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    `;
  }

  /**
   * Update content based on filter
   */
  updateContent(filter) {
    this.currentFilter = filter;
    const mainContent = document.getElementById('home-main-content');
    if (mainContent) {
      mainContent.innerHTML = this.getContentForFilter(filter);
    }
  }

  /**
   * Open search
   */
  openSearch() {
    console.log('Opening search...');
    // TODO: Implement search functionality
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    eventBus.on('navigation:subtab-clicked', ({ tab, subTab }) => {
      if (tab === 'home') {
        this.updateContent(subTab);
      }
    });
  }

  /**
   * Called after page is mounted
   */
  async mounted() {
    console.log('Home page mounted');
    navigationState.setActiveTab('home');
  }

  /**
   * Clean up when page is destroyed
   */
  destroy() {
    eventBus.off('navigation:subtab-clicked');
  }
}

export default HomePage;
