/**
 * My Space Page
 * User's organizations, orders, and tasks
 */

import { navigationState } from '../state/navigation-state.js';
import { authState } from '../state/auth-state.js';
import { orgState } from '../state/org-state.js';
import { memberState } from '../state/member-state.js';
import { organizationPersistence } from '../services/organization-persistence.js';
import { eventBus } from '../utils/events.js';
import { router } from '../router.js';

export class MySpacePage {
  constructor(params = {}) {
    this.params = params;
    this.currentView = 'orgs';
    this.setupEventListeners();
  }

  /**
   * Render the myspace page
   */
  async render() {
    const page = document.createElement('ion-page');
    page.className = 'myspace-page';

    // Check auth
    if (!authState.isAuth()) {
      return this.renderAuthRequired();
    }

    // Header
    const header = this.createHeader();
    page.appendChild(header);

    // Content
    const content = document.createElement('ion-content');
    content.className = 'myspace-content';

    // Main content area
    const mainContent = document.createElement('div');
    mainContent.className = 'myspace-main-content';
    mainContent.id = 'myspace-main-content';

    // Initial content (load async)
    const initialContent = await this.getContentForView('orgs');
    mainContent.innerHTML = initialContent;

    content.appendChild(mainContent);
    page.appendChild(content);

    return page;
  }

  /**
   * Render auth required page
   */
  renderAuthRequired() {
    const page = document.createElement('ion-page');
    page.className = 'myspace-page';

    const content = document.createElement('ion-content');
    content.className = 'auth-required-page';

    content.innerHTML = `
      <div class="auth-required-container">
        <ion-icon name="lock-closed" color="medium"></ion-icon>
        <h2>Login Required</h2>
        <p>You need to be logged in to access Work</p>
        <ion-button id="auth-login-button">
          <ion-icon name="log-in" slot="start"></ion-icon>
          Login
        </ion-button>
      </div>
    `;

    page.appendChild(content);
    return page;
  }

  /**
   * Create page header
   */
  createHeader() {
    const header = document.createElement('ion-header');

    const toolbar = document.createElement('ion-toolbar');
    toolbar.className = 'myspace-toolbar';

    const title = document.createElement('ion-title');
    title.textContent = 'Work';
    toolbar.appendChild(title);

    header.appendChild(toolbar);
    return header;
  }

  /**
   * Get content HTML for a specific view
   */
  async getContentForView(view) {
    if (view === 'orgs') {
      return await this.getOrganizationsContent();
    }

    const contentMap = {
      orders: this.getOrdersContent(),
      tasks: this.getTasksContent(),
      addorg: this.getAddOrgContent()
    };

    return contentMap[view] || await this.getOrganizationsContent();
  }

  /**
   * Get organizations content (with real data from PouchDB)
   */
  async getOrganizationsContent() {
    // Load organizations from state or PouchDB
    let organizations = orgState.getAllOrganizations();

    // If state is empty, load from PouchDB
    if (organizations.length === 0) {
      try {
        organizations = await organizationPersistence.getAllOrganizations();
        orgState.setOrganizations(organizations);
      } catch (error) {
        console.error('Error loading organizations:', error);
        organizations = [];
      }
    }

    const user = authState.getUser();

    // Empty state
    if (organizations.length === 0) {
      return `
        <div class="content-section">
          <h2>My Organizations</h2>
          <div class="empty-state">
            <ion-icon name="business-outline" color="medium"></ion-icon>
            <h3>No Organizations Yet</h3>
            <p>Create or join an organization to get started</p>
            <ion-button id="create-org-button">
              <ion-icon name="add-circle" slot="start"></ion-icon>
              Create Organization
            </ion-button>
          </div>
        </div>
      `;
    }

    // Render org list with real data
    const orgListHTML = organizations.map(org => {
      // Get user's role in this org
      const orgIdentifier = org._id ? org._id.replace('org:', '') : '';
      const userRole = memberState.getCurrentUserRole(orgIdentifier);
      const canEdit = userRole === 'owner' || userRole === 'admin';

      // Get member count (if available)
      const members = memberState.getOrgMembers(orgIdentifier);
      const memberCount = members ? members.length : 0;

      return `
        <ion-item class="org-item" data-org-id="${org._id}">
          <ion-avatar slot="start">
            <img src="${org.logo || '/images/placeholder-org.jpg'}" alt="${org.fullName}" />
          </ion-avatar>
          <ion-label>
            <h3>${org.fullName}</h3>
            <p>${userRole || 'Member'} • ${memberCount} members</p>
            ${org.tagLine ? `<p class="org-tagline">${org.tagLine}</p>` : ''}
          </ion-label>
          ${canEdit ? `
            <ion-button slot="end" fill="clear" class="edit-org-btn" data-org-id="${org._id}">
              <ion-icon name="create" slot="icon-only"></ion-icon>
            </ion-button>
          ` : ''}
        </ion-item>
      `;
    }).join('');

    return `
      <div class="content-section">
        <div class="section-header">
          <h2>My Organizations</h2>
          <ion-button id="add-org-button" fill="outline" size="small">
            <ion-icon name="add" slot="start"></ion-icon>
            Add Organization
          </ion-button>
        </div>
        <ion-list>
          ${orgListHTML}
        </ion-list>
      </div>
    `;
  }

  /**
   * Get orders content
   */
  getOrdersContent() {
    return `
      <div class="content-section">
        <h2>My Orders</h2>
        <ion-segment value="active" id="orders-segment">
          <ion-segment-button value="active">
            <ion-label>Active</ion-label>
          </ion-segment-button>
          <ion-segment-button value="completed">
            <ion-label>Completed</ion-label>
          </ion-segment-button>
          <ion-segment-button value="cancelled">
            <ion-label>Cancelled</ion-label>
          </ion-segment-button>
        </ion-segment>

        <ion-list id="orders-list">
          <ion-item class="order-item" data-order-id="1">
            <ion-icon name="cube" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Order #1234</h3>
              <p>Handmade Pottery Set</p>
              <p class="order-meta">Local Coffee Shop • $45.00</p>
            </ion-label>
            <div slot="end">
              <ion-badge color="warning">Processing</ion-badge>
              <p class="order-date">2 days ago</p>
            </div>
          </ion-item>

          <ion-item class="order-item" data-order-id="2">
            <ion-icon name="cube" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Order #1233</h3>
              <p>Organic Honey (2 jars)</p>
              <p class="order-meta">Fresh Produce Market • $24.00</p>
            </ion-label>
            <div slot="end">
              <ion-badge color="primary">Shipped</ion-badge>
              <p class="order-date">5 days ago</p>
            </div>
          </ion-item>
        </ion-list>

        <div class="empty-state" style="display: none;">
          <ion-icon name="cart-outline" color="medium"></ion-icon>
          <h3>No Orders Yet</h3>
          <p>Start shopping to see your orders here</p>
          <ion-button id="browse-marketplace-button">
            <ion-icon name="storefront" slot="start"></ion-icon>
            Browse Marketplace
          </ion-button>
        </div>
      </div>
    `;
  }

  /**
   * Get tasks content
   */
  getTasksContent() {
    return `
      <div class="content-section">
        <h2>My Tasks</h2>
        <ion-segment value="pending" id="tasks-segment">
          <ion-segment-button value="pending">
            <ion-label>Pending</ion-label>
          </ion-segment-button>
          <ion-segment-button value="completed">
            <ion-label>Completed</ion-label>
          </ion-segment-button>
        </ion-segment>

        <ion-list id="tasks-list">
          <ion-item class="task-item" data-task-id="1">
            <ion-checkbox slot="start"></ion-checkbox>
            <ion-label>
              <h3>Update product inventory</h3>
              <p>Local Coffee Shop</p>
              <p class="task-meta">
                <ion-chip color="danger">
                  <ion-icon name="time"></ion-icon>
                  <ion-label>Due today</ion-label>
                </ion-chip>
              </p>
            </ion-label>
          </ion-item>

          <ion-item class="task-item" data-task-id="2">
            <ion-checkbox slot="start"></ion-checkbox>
            <ion-label>
              <h3>Review job applications</h3>
              <p>Local Coffee Shop</p>
              <p class="task-meta">
                <ion-chip color="warning">
                  <ion-icon name="time"></ion-icon>
                  <ion-label>Due tomorrow</ion-label>
                </ion-chip>
              </p>
            </ion-label>
          </ion-item>

          <ion-item class="task-item" data-task-id="3">
            <ion-checkbox slot="start"></ion-checkbox>
            <ion-label>
              <h3>Prepare weekly report</h3>
              <p>Fresh Produce Market</p>
              <p class="task-meta">
                <ion-chip>
                  <ion-icon name="time"></ion-icon>
                  <ion-label>Due in 3 days</ion-label>
                </ion-chip>
              </p>
            </ion-label>
          </ion-item>
        </ion-list>

        <div class="empty-state" style="display: none;">
          <ion-icon name="checkbox-outline" color="medium"></ion-icon>
          <h3>No Tasks Assigned</h3>
          <p>You don't have any tasks at the moment</p>
        </div>
      </div>
    `;
  }

  /**
   * Get add organization content
   */
  getAddOrgContent() {
    return `
      <div class="content-section">
        <h2>Create New Organization</h2>
        <div class="org-form">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Organization Name</ion-label>
              <ion-input placeholder="e.g. My Coffee Shop" id="org-name"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Business Type</ion-label>
              <ion-select placeholder="Select type" id="org-type">
                <ion-select-option value="retail">Retail</ion-select-option>
                <ion-select-option value="food">Food & Beverage</ion-select-option>
                <ion-select-option value="services">Services</ion-select-option>
                <ion-select-option value="manufacturing">Manufacturing</ion-select-option>
                <ion-select-option value="other">Other</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Description</ion-label>
              <ion-textarea rows="4" placeholder="Brief description of your business" id="org-description"></ion-textarea>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Address</ion-label>
              <ion-textarea rows="3" placeholder="Business address" id="org-address"></ion-textarea>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Phone</ion-label>
              <ion-input type="tel" placeholder="Business phone number" id="org-phone"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Email</ion-label>
              <ion-input type="email" placeholder="Business email" id="org-email"></ion-input>
            </ion-item>
          </ion-list>

          <div class="form-actions">
            <ion-button expand="block" id="create-org-submit-button">
              <ion-icon name="add-circle" slot="start"></ion-icon>
              Create Organization
            </ion-button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update content based on view
   */
  async updateContent(view) {
    this.currentView = view;
    const mainContent = document.getElementById('myspace-main-content');
    if (mainContent) {
      const content = await this.getContentForView(view);
      mainContent.innerHTML = content;
      this.attachEventListeners();
    }
  }

  /**
   * Attach event listeners to dynamic content
   */
  attachEventListeners() {
    // Organization items
    document.querySelectorAll('.org-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't navigate if clicking the edit button
        if (e.target.closest('.edit-org-btn')) {
          return;
        }
        const orgId = e.currentTarget.getAttribute('data-org-id');
        router.navigate(`/organizations/${orgId}`);
      });
    });

    // Add organization button
    const addOrgButton = document.getElementById('add-org-button');
    if (addOrgButton) {
      addOrgButton.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/organizations/add');
      });
    }

    // Create organization button (empty state)
    const createOrgButton = document.getElementById('create-org-button');
    if (createOrgButton) {
      createOrgButton.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/organizations/add');
      });
    }

    // Edit organization buttons
    document.querySelectorAll('.edit-org-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent org item click
        const orgId = e.currentTarget.getAttribute('data-org-id');
        router.navigate(`/organizations/${orgId}/edit`);
      });
    });

    // Create org submit button (old addorg view)
    const createOrgSubmitButton = document.getElementById('create-org-submit-button');
    if (createOrgSubmitButton) {
      createOrgSubmitButton.addEventListener('click', () => {
        this.handleCreateOrg();
      });
    }

    // Auth login button
    const authLoginButton = document.getElementById('auth-login-button');
    if (authLoginButton) {
      authLoginButton.addEventListener('click', () => {
        router.navigate('/login', { redirect: '/work' });
      });
    }

    // Browse marketplace button
    const browseButton = document.getElementById('browse-marketplace-button');
    if (browseButton) {
      browseButton.addEventListener('click', () => {
        router.navigate('/marketplace');
      });
    }

    // Task checkboxes
    document.querySelectorAll('.task-item ion-checkbox').forEach(checkbox => {
      checkbox.addEventListener('ionChange', (e) => {
        this.handleTaskToggle(e);
      });
    });
  }

  /**
   * Handle create organization
   */
  handleCreateOrg() {
    const name = document.getElementById('org-name')?.value;
    const type = document.getElementById('org-type')?.value;
    const description = document.getElementById('org-description')?.value;
    const address = document.getElementById('org-address')?.value;
    const phone = document.getElementById('org-phone')?.value;
    const email = document.getElementById('org-email')?.value;

    if (!name || !type) {
      alert('Please fill in required fields');
      return;
    }

    console.log('Creating organization:', { name, type, description, address, phone, email });
    // TODO: Implement organization creation
  }

  /**
   * Handle task toggle
   */
  handleTaskToggle(e) {
    const isChecked = e.detail.checked;
    console.log('Task toggled:', isChecked);
    // TODO: Implement task update
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    eventBus.on('navigation:subtab-clicked', ({ tab, subTab }) => {
      if (tab === 'myspace') {
        this.updateContent(subTab);
      }
    });
  }

  /**
   * Called after page is mounted
   */
  async mounted() {
    console.log('MySpace page mounted');
    navigationState.setActiveTab('myspace');
    this.attachEventListeners();
  }

  /**
   * Clean up when page is destroyed
   */
  destroy() {
    eventBus.off('navigation:subtab-clicked');
  }
}

export default MySpacePage;
