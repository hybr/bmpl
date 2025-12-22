/**
 * Marketplace Page
 * Browse products, services, and rentals
 */

import { navigationState } from '../state/navigation-state.js';
import { authState } from '../state/auth-state.js';
import { eventBus } from '../utils/events.js';
import { router } from '../router.js';

export class MarketplacePage {
  constructor(params = {}) {
    this.params = params;
    this.currentView = 'products';
    this.setupEventListeners();
  }

  /**
   * Render the marketplace page
   */
  async render() {
    const page = document.createElement('ion-page');
    page.className = 'marketplace-page';

    // Header
    const header = this.createHeader();
    page.appendChild(header);

    // Content
    const content = document.createElement('ion-content');
    content.className = 'marketplace-content';

    // Main content area
    const mainContent = document.createElement('div');
    mainContent.className = 'marketplace-main-content';
    mainContent.id = 'marketplace-main-content';

    // Initial content
    mainContent.innerHTML = this.getContentForView('products');

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
    toolbar.className = 'marketplace-toolbar';

    const title = document.createElement('ion-title');
    title.textContent = 'Marketplace';
    toolbar.appendChild(title);

    // Filter button
    const filterButton = document.createElement('ion-button');
    filterButton.setAttribute('slot', 'end');
    filterButton.setAttribute('fill', 'clear');

    const filterIcon = document.createElement('ion-icon');
    filterIcon.setAttribute('name', 'filter');
    filterButton.appendChild(filterIcon);

    filterButton.addEventListener('click', () => {
      this.openFilters();
    });

    toolbar.appendChild(filterButton);

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
   * Get content HTML for a specific view
   */
  getContentForView(view) {
    const contentMap = {
      products: this.getProductsContent(),
      services: this.getServicesContent(),
      rentals: this.getRentalsContent(),
      categories: this.getCategoriesContent()
    };

    return contentMap[view] || contentMap.products;
  }

  /**
   * Get products content
   */
  getProductsContent() {
    return `
      <div class="content-section">
        <h2>Products for Sale</h2>
        <div class="row g-3">
          <div class="col-12 col-sm-6 col-lg-4">
            <ion-card class="product-card" data-product-id="1">
              <img src="/images/placeholder-product.jpg" alt="Product" />
              <ion-card-header>
                <ion-card-title>Handmade Pottery Set</ion-card-title>
                <ion-card-subtitle>$45.00</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <p>Beautiful handcrafted pottery set</p>
                <ion-button size="small" class="buy-button">
                  <ion-icon name="cart" slot="start"></ion-icon>
                  Add to Cart
                </ion-button>
              </ion-card-content>
            </ion-card>
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <ion-card class="product-card" data-product-id="2">
              <img src="/images/placeholder-product.jpg" alt="Product" />
              <ion-card-header>
                <ion-card-title>Organic Honey</ion-card-title>
                <ion-card-subtitle>$12.00</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <p>Pure local honey, 500g jar</p>
                <ion-button size="small" class="buy-button">
                  <ion-icon name="cart" slot="start"></ion-icon>
                  Add to Cart
                </ion-button>
              </ion-card-content>
            </ion-card>
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <ion-card class="product-card" data-product-id="3">
              <img src="/images/placeholder-product.jpg" alt="Product" />
              <ion-card-header>
                <ion-card-title>Leather Wallet</ion-card-title>
                <ion-card-subtitle>$35.00</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <p>Handcrafted genuine leather</p>
                <ion-button size="small" class="buy-button">
                  <ion-icon name="cart" slot="start"></ion-icon>
                  Add to Cart
                </ion-button>
              </ion-card-content>
            </ion-card>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get services content
   */
  getServicesContent() {
    return `
      <div class="content-section">
        <h2>Services Offered</h2>
        <ion-list>
          <ion-item class="service-item" data-service-id="1">
            <ion-icon name="construct" slot="start"></ion-icon>
            <ion-label>
              <h3>Home Repair Services</h3>
              <p>Professional handyman services</p>
              <p class="price">Starting at $50/hour</p>
            </ion-label>
            <ion-button slot="end" class="book-button">Book</ion-button>
          </ion-item>

          <ion-item class="service-item" data-service-id="2">
            <ion-icon name="cut" slot="start"></ion-icon>
            <ion-label>
              <h3>Hair Styling</h3>
              <p>Professional hair and beauty services</p>
              <p class="price">Starting at $30</p>
            </ion-label>
            <ion-button slot="end" class="book-button">Book</ion-button>
          </ion-item>

          <ion-item class="service-item" data-service-id="3">
            <ion-icon name="car" slot="start"></ion-icon>
            <ion-label>
              <h3>Car Wash & Detail</h3>
              <p>Complete car cleaning service</p>
              <p class="price">Starting at $25</p>
            </ion-label>
            <ion-button slot="end" class="book-button">Book</ion-button>
          </ion-item>
        </ion-list>
      </div>
    `;
  }

  /**
   * Get rentals content
   */
  getRentalsContent() {
    return `
      <div class="content-section">
        <h2>Items for Rent</h2>
        <div class="row g-3">
          <div class="col-12 col-sm-6 col-lg-4">
            <ion-card class="rental-card" data-rental-id="1">
              <img src="/images/placeholder-rental.jpg" alt="Rental" />
              <ion-card-header>
                <ion-card-title>Party Tent</ion-card-title>
                <ion-card-subtitle>$75/day</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <p>Large outdoor event tent</p>
                <ion-button size="small" class="rent-button">
                  <ion-icon name="calendar" slot="start"></ion-icon>
                  Rent Now
                </ion-button>
              </ion-card-content>
            </ion-card>
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <ion-card class="rental-card" data-rental-id="2">
              <img src="/images/placeholder-rental.jpg" alt="Rental" />
              <ion-card-header>
                <ion-card-title>Power Tools Set</ion-card-title>
                <ion-card-subtitle>$40/day</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <p>Complete power tools collection</p>
                <ion-button size="small" class="rent-button">
                  <ion-icon name="calendar" slot="start"></ion-icon>
                  Rent Now
                </ion-button>
              </ion-card-content>
            </ion-card>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get categories content
   */
  getCategoriesContent() {
    return `
      <div class="content-section">
        <h2>Browse by Category</h2>
        <div class="row g-3">
          <div class="col-6 col-md-4 col-lg-3">
            <ion-card class="category-card" data-category="food">
              <ion-icon name="fast-food"></ion-icon>
              <h3>Food & Beverages</h3>
              <p>120 items</p>
            </ion-card>
          </div>

          <div class="col-6 col-md-4 col-lg-3">
            <ion-card class="category-card" data-category="crafts">
              <ion-icon name="color-palette"></ion-icon>
              <h3>Arts & Crafts</h3>
              <p>85 items</p>
            </ion-card>
          </div>

          <div class="col-6 col-md-4 col-lg-3">
            <ion-card class="category-card" data-category="home">
              <ion-icon name="home"></ion-icon>
              <h3>Home & Garden</h3>
              <p>95 items</p>
            </ion-card>
          </div>

          <div class="col-6 col-md-4 col-lg-3">
            <ion-card class="category-card" data-category="electronics">
              <ion-icon name="phone-portrait"></ion-icon>
              <h3>Electronics</h3>
              <p>45 items</p>
            </ion-card>
          </div>

          <div class="col-6 col-md-4 col-lg-3">
            <ion-card class="category-card" data-category="clothing">
              <ion-icon name="shirt"></ion-icon>
              <h3>Clothing</h3>
              <p>150 items</p>
            </ion-card>
          </div>

          <div class="col-6 col-md-4 col-lg-3">
            <ion-card class="category-card" data-category="services">
              <ion-icon name="build"></ion-icon>
              <h3>Services</h3>
              <p>60 services</p>
            </ion-card>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update content based on view
   */
  updateContent(view) {
    this.currentView = view;
    const mainContent = document.getElementById('marketplace-main-content');
    if (mainContent) {
      mainContent.innerHTML = this.getContentForView(view);
      this.attachEventListeners();
    }
  }

  /**
   * Attach event listeners to dynamic content
   */
  attachEventListeners() {
    // Buy buttons
    document.querySelectorAll('.buy-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleAddToCart(e);
      });
    });

    // Book buttons
    document.querySelectorAll('.book-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleBookService(e);
      });
    });

    // Rent buttons
    document.querySelectorAll('.rent-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleRentItem(e);
      });
    });

    // Category cards
    document.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', (e) => {
        this.handleCategoryClick(e);
      });
    });
  }

  /**
   * Handle add to cart
   */
  handleAddToCart(e) {
    if (!authState.isAuth()) {
      router.navigate('/login', { redirect: '/marketplace' });
      return;
    }

    console.log('Adding to cart...');
    // TODO: Implement add to cart functionality
  }

  /**
   * Handle book service
   */
  handleBookService(e) {
    if (!authState.isAuth()) {
      router.navigate('/login', { redirect: '/marketplace' });
      return;
    }

    console.log('Booking service...');
    // TODO: Implement service booking
  }

  /**
   * Handle rent item
   */
  handleRentItem(e) {
    if (!authState.isAuth()) {
      router.navigate('/login', { redirect: '/marketplace' });
      return;
    }

    console.log('Renting item...');
    // TODO: Implement rental booking
  }

  /**
   * Handle category click
   */
  handleCategoryClick(e) {
    const category = e.currentTarget.getAttribute('data-category');
    console.log('Opening category:', category);
    // TODO: Navigate to category page
  }

  /**
   * Open filters
   */
  openFilters() {
    console.log('Opening filters...');
    // TODO: Implement filter modal
  }

  /**
   * Open search
   */
  openSearch() {
    console.log('Opening search...');
    // TODO: Implement search
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    eventBus.on('navigation:subtab-clicked', ({ tab, subTab }) => {
      if (tab === 'marketplace') {
        this.updateContent(subTab);
      }
    });
  }

  /**
   * Called after page is mounted
   */
  async mounted() {
    navigationState.setActiveTab('marketplace');
    this.attachEventListeners();
  }

  /**
   * Clean up when page is destroyed
   */
  destroy() {
    eventBus.off('navigation:subtab-clicked');
  }
}

export default MarketplacePage;
