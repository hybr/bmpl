/**
 * Account Page
 * User profile, settings, and account management
 */

import { navigationState } from '../state/navigation-state.js';
import { authState } from '../state/auth-state.js';
import { eventBus } from '../utils/events.js';
import { router } from '../router.js';
import { EVENTS } from '../config/constants.js';

export class AccountPage {
  constructor(params = {}) {
    this.params = params;
    this.currentView = authState.isAuth() ? 'profile' : 'login';
    this.setupEventListeners();
  }

  /**
   * Render the account page
   */
  async render() {
    const page = document.createElement('ion-page');
    page.className = 'account-page';

    // Header
    const header = this.createHeader();
    page.appendChild(header);

    // Content
    const content = document.createElement('ion-content');
    content.className = 'account-content';

    // Main content area
    const mainContent = document.createElement('div');
    mainContent.className = 'account-main-content';
    mainContent.id = 'account-main-content';

    // Initial content
    mainContent.innerHTML = this.getContentForView(this.currentView);

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
    toolbar.className = 'account-toolbar';

    const title = document.createElement('ion-title');
    title.textContent = 'Account';
    toolbar.appendChild(title);

    header.appendChild(toolbar);
    return header;
  }

  /**
   * Get content HTML for a specific view
   */
  getContentForView(view) {
    const isAuthenticated = authState.isAuth();

    if (!isAuthenticated) {
      // Guest views
      const guestContentMap = {
        login: this.getLoginRedirectContent(),
        register: this.getRegisterRedirectContent(),
        about: this.getAboutContent(),
        help: this.getHelpContent()
      };
      return guestContentMap[view] || guestContentMap.login;
    }

    // Authenticated views
    const authContentMap = {
      profile: this.getProfileContent(),
      settings: this.getSettingsContent(),
      notifications: this.getNotificationsContent(),
      logout: this.getLogoutContent()
    };

    return authContentMap[view] || authContentMap.profile;
  }

  /**
   * Get login redirect content (for guests)
   */
  getLoginRedirectContent() {
    return `
      <div class="redirect-content">
        <ion-icon name="log-in" color="primary"></ion-icon>
        <h3>Login to Your Account</h3>
        <p>Access your profile, orders, and organizations</p>
        <ion-button id="goto-login-button" expand="block">
          <ion-icon name="log-in" slot="start"></ion-icon>
          Go to Login
        </ion-button>
      </div>
    `;
  }

  /**
   * Get register redirect content (for guests)
   */
  getRegisterRedirectContent() {
    return `
      <div class="redirect-content">
        <ion-icon name="person-add" color="primary"></ion-icon>
        <h3>Create an Account</h3>
        <p>Join V4L to connect with local businesses</p>
        <ion-button id="goto-register-button" expand="block">
          <ion-icon name="person-add" slot="start"></ion-icon>
          Go to Registration
        </ion-button>
      </div>
    `;
  }

  /**
   * Get about content
   */
  getAboutContent() {
    return `
      <div class="content-section">
        <h2>About V4L</h2>
        <div class="about-content">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Vocal 4 Local</ion-card-title>
              <ion-card-subtitle>Version 1.0.0</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <p>
                V4L (Vocal 4 Local) connects local businesses with their community,
                making it easy to discover, support, and engage with businesses in your area.
              </p>
              <p>
                Our platform enables businesses to showcase products, offer services,
                post job vacancies, and build meaningful relationships with local customers.
              </p>
            </ion-card-content>
          </ion-card>

          <ion-list>
            <ion-list-header>
              <ion-label>Features</ion-label>
            </ion-list-header>
            <ion-item>
              <ion-icon name="storefront" slot="start"></ion-icon>
              <ion-label>Discover local businesses</ion-label>
            </ion-item>
            <ion-item>
              <ion-icon name="cart" slot="start"></ion-icon>
              <ion-label>Buy products & services</ion-label>
            </ion-item>
            <ion-item>
              <ion-icon name="briefcase" slot="start"></ion-icon>
              <ion-label>Find job opportunities</ion-label>
            </ion-item>
            <ion-item>
              <ion-icon name="business" slot="start"></ion-icon>
              <ion-label>Manage organizations</ion-label>
            </ion-item>
          </ion-list>
        </div>
      </div>
    `;
  }

  /**
   * Get help content
   */
  getHelpContent() {
    return `
      <div class="content-section">
        <h2>Help & Support</h2>
        <ion-list>
          <ion-list-header>
            <ion-label>Frequently Asked Questions</ion-label>
          </ion-list-header>

          <ion-item button id="faq-1">
            <ion-icon name="help-circle" slot="start"></ion-icon>
            <ion-label>
              <h3>How do I create an account?</h3>
            </ion-label>
          </ion-item>

          <ion-item button id="faq-2">
            <ion-icon name="help-circle" slot="start"></ion-icon>
            <ion-label>
              <h3>How do I create an organization?</h3>
            </ion-label>
          </ion-item>

          <ion-item button id="faq-3">
            <ion-icon name="help-circle" slot="start"></ion-icon>
            <ion-label>
              <h3>How do I post products or services?</h3>
            </ion-label>
          </ion-item>

          <ion-item button id="faq-4">
            <ion-icon name="help-circle" slot="start"></ion-icon>
            <ion-label>
              <h3>How do I apply for jobs?</h3>
            </ion-label>
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-list-header>
            <ion-label>Contact Support</ion-label>
          </ion-list-header>

          <ion-item button id="contact-email">
            <ion-icon name="mail" slot="start"></ion-icon>
            <ion-label>
              <h3>Email Support</h3>
              <p>support@v4l.app</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    `;
  }

  /**
   * Get profile content (authenticated)
   */
  getProfileContent() {
    const user = authState.getUser();

    return `
      <div class="content-section">
        <div class="profile-header">
          <ion-avatar class="profile-avatar">
            <img src="/images/default-avatar.jpg" alt="Profile" />
          </ion-avatar>
          <h2>${user?.name || user?.email || 'User'}</h2>
          <p>${user?.email || ''}</p>
        </div>

        <ion-list>
          <ion-list-header>
            <ion-label>Personal Information</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-label position="stacked">Full Name</ion-label>
            <ion-input value="${user?.name || ''}" id="profile-name"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Email</ion-label>
            <ion-input value="${user?.email || ''}" type="email" id="profile-email" readonly></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Phone</ion-label>
            <ion-input value="${user?.phone || ''}" type="tel" id="profile-phone"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Location</ion-label>
            <ion-input value="${user?.location || ''}" id="profile-location"></ion-input>
          </ion-item>
        </ion-list>

        <div class="form-actions">
          <ion-button expand="block" id="save-profile-button">
            <ion-icon name="save" slot="start"></ion-icon>
            Save Changes
          </ion-button>
        </div>
      </div>
    `;
  }

  /**
   * Get settings content (authenticated)
   */
  getSettingsContent() {
    return `
      <div class="content-section">
        <h2>Settings</h2>

        <ion-list>
          <ion-list-header>
            <ion-label>Preferences</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-label>Dark Mode</ion-label>
            <ion-toggle id="dark-mode-toggle"></ion-toggle>
          </ion-item>

          <ion-item>
            <ion-label>Push Notifications</ion-label>
            <ion-toggle id="notifications-toggle" checked></ion-toggle>
          </ion-item>

          <ion-item>
            <ion-label>Email Notifications</ion-label>
            <ion-toggle id="email-notifications-toggle" checked></ion-toggle>
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-list-header>
            <ion-label>Privacy</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-label>Show Profile to Public</ion-label>
            <ion-toggle id="public-profile-toggle" checked></ion-toggle>
          </ion-item>

          <ion-item>
            <ion-label>Show Location</ion-label>
            <ion-toggle id="show-location-toggle" checked></ion-toggle>
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-list-header>
            <ion-label>Account</ion-label>
          </ion-list-header>

          <ion-item button id="change-password-button">
            <ion-icon name="key" slot="start"></ion-icon>
            <ion-label>Change Password</ion-label>
          </ion-item>

          <ion-item button id="delete-account-button" color="danger">
            <ion-icon name="trash" slot="start"></ion-icon>
            <ion-label>Delete Account</ion-label>
          </ion-item>
        </ion-list>
      </div>
    `;
  }

  /**
   * Get notifications content (authenticated)
   */
  getNotificationsContent() {
    return `
      <div class="content-section">
        <h2>Notifications</h2>

        <ion-segment value="all" id="notifications-segment">
          <ion-segment-button value="all">
            <ion-label>All</ion-label>
          </ion-segment-button>
          <ion-segment-button value="unread">
            <ion-label>Unread</ion-label>
          </ion-segment-button>
        </ion-segment>

        <ion-list id="notifications-list">
          <ion-item class="notification-item unread" data-notification-id="1">
            <ion-icon name="cart" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Order Shipped</h3>
              <p>Your order #1234 has been shipped</p>
              <p class="notification-time">2 hours ago</p>
            </ion-label>
          </ion-item>

          <ion-item class="notification-item unread" data-notification-id="2">
            <ion-icon name="checkmark-circle" slot="start" color="success"></ion-icon>
            <ion-label>
              <h3>Application Received</h3>
              <p>Your job application has been received</p>
              <p class="notification-time">1 day ago</p>
            </ion-label>
          </ion-item>

          <ion-item class="notification-item" data-notification-id="3">
            <ion-icon name="person-add" slot="start" color="tertiary"></ion-icon>
            <ion-label>
              <h3>New Member</h3>
              <p>John Doe joined your organization</p>
              <p class="notification-time">3 days ago</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <div class="empty-state" style="display: none;">
          <ion-icon name="notifications-outline" color="medium"></ion-icon>
          <h3>No Notifications</h3>
          <p>You're all caught up!</p>
        </div>
      </div>
    `;
  }

  /**
   * Get logout content (authenticated)
   */
  getLogoutContent() {
    return `
      <div class="redirect-content">
        <ion-icon name="log-out" color="danger"></ion-icon>
        <h3>Logout</h3>
        <p>Are you sure you want to logout?</p>
        <ion-button id="confirm-logout-button" color="danger" expand="block">
          <ion-icon name="log-out" slot="start"></ion-icon>
          Logout
        </ion-button>
        <ion-button id="cancel-logout-button" fill="outline" expand="block">
          Cancel
        </ion-button>
      </div>
    `;
  }

  /**
   * Update content based on view
   */
  updateContent(view) {
    this.currentView = view;
    const mainContent = document.getElementById('account-main-content');
    if (mainContent) {
      mainContent.innerHTML = this.getContentForView(view);
      this.attachEventListeners();
    }
  }

  /**
   * Attach event listeners to dynamic content
   */
  attachEventListeners() {
    // Login/Register redirects
    const gotoLoginButton = document.getElementById('goto-login-button');
    if (gotoLoginButton) {
      gotoLoginButton.addEventListener('click', () => {
        router.navigate('/login');
      });
    }

    const gotoRegisterButton = document.getElementById('goto-register-button');
    if (gotoRegisterButton) {
      gotoRegisterButton.addEventListener('click', () => {
        router.navigate('/register');
      });
    }

    // Save profile
    const saveProfileButton = document.getElementById('save-profile-button');
    if (saveProfileButton) {
      saveProfileButton.addEventListener('click', () => {
        this.handleSaveProfile();
      });
    }

    // Logout
    const confirmLogoutButton = document.getElementById('confirm-logout-button');
    if (confirmLogoutButton) {
      confirmLogoutButton.addEventListener('click', () => {
        this.handleLogout();
      });
    }

    const cancelLogoutButton = document.getElementById('cancel-logout-button');
    if (cancelLogoutButton) {
      cancelLogoutButton.addEventListener('click', () => {
        this.updateContent('profile');
      });
    }
  }

  /**
   * Handle save profile
   */
  handleSaveProfile() {
    const name = document.getElementById('profile-name')?.value;
    const phone = document.getElementById('profile-phone')?.value;
    const location = document.getElementById('profile-location')?.value;

    console.log('Saving profile:', { name, phone, location });
    // TODO: Implement profile update
  }

  /**
   * Handle logout
   */
  handleLogout() {
    console.log('Logging out...');
    authState.logout();
    eventBus.emit(EVENTS.AUTH_STATE_CHANGED, { authenticated: false });
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    eventBus.on('navigation:subtab-clicked', ({ tab, subTab }) => {
      if (tab === 'account') {
        this.updateContent(subTab);
      }
    });

    // Listen for auth changes
    eventBus.on(EVENTS.AUTH_STATE_CHANGED, () => {
      // Content will be updated based on auth state
    });
  }

  /**
   * Called after page is mounted
   */
  async mounted() {
    console.log('Account page mounted');
    navigationState.setActiveTab('account');
    this.attachEventListeners();
  }

  /**
   * Clean up when page is destroyed
   */
  destroy() {
    eventBus.off('navigation:subtab-clicked');
    eventBus.off(EVENTS.AUTH_STATE_CHANGED);
  }
}

export default AccountPage;
