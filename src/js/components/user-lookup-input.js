/**
 * User Lookup Input Component
 * Reusable component for searching and verifying users by email/username/phone
 * Stores the verified userId for foreign key relationships
 */

import { eventBus } from '../utils/events.js';

// Mock user data for development - replace with actual API calls
const mockUsers = [
  { id: 'user_001', name: 'John Smith', email: 'john.smith@company.com', phone: '555-0101', department: 'Engineering', username: 'jsmith' },
  { id: 'user_002', name: 'Sarah Johnson', email: 'sarah.j@company.com', phone: '555-0102', department: 'Marketing', username: 'sjohnson' },
  { id: 'user_003', name: 'Mike Wilson', email: 'mike.w@company.com', phone: '555-0103', department: 'Sales', username: 'mwilson' },
  { id: 'user_004', name: 'Emily Davis', email: 'emily.d@company.com', phone: '555-0104', department: 'HR', username: 'edavis' },
  { id: 'user_005', name: 'Robert Brown', email: 'robert.b@company.com', phone: '555-0105', department: 'Finance', username: 'rbrown' },
  { id: 'user_006', name: 'Lisa Anderson', email: 'lisa.a@company.com', phone: '555-0106', department: 'Operations', username: 'landerson' },
  { id: 'user_007', name: 'David Martinez', email: 'david.m@company.com', phone: '555-0107', department: 'Engineering', username: 'dmartinez' },
  { id: 'user_008', name: 'Jennifer Taylor', email: 'jennifer.t@company.com', phone: '555-0108', department: 'Marketing', username: 'jtaylor' },
  { id: 'user_009', name: 'Chris Lee', email: 'chris.l@company.com', phone: '555-0109', department: 'Sales', username: 'clee' },
  { id: 'user_010', name: 'Amanda White', email: 'amanda.w@company.com', phone: '555-0110', department: 'HR', username: 'awhite' },
  { id: 'user_011', name: 'Yogesh Kumar', email: 'yogesh@company.com', phone: '555-0111', department: 'Engineering', username: 'yogesh' },
  { id: 'user_012', name: 'Priya Sharma', email: 'priya.s@company.com', phone: '555-0112', department: 'Finance', username: 'psharma' }
];

/**
 * User Lookup Service
 * Handles searching and fetching user data
 */
export const userLookupService = {
  /**
   * Search users by query (email, username, phone, or name)
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<Array>} Matching users
   */
  async search(query, options = {}) {
    const { searchFields = ['email', 'username', 'phone', 'name'], limit = 10 } = options;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) return [];

    // Search across specified fields
    const results = mockUsers.filter(user => {
      return searchFields.some(field => {
        const value = user[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerQuery);
        }
        return false;
      });
    });

    return results.slice(0, limit);
  },

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} User object or null
   */
  async getById(userId) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockUsers.find(u => u.id === userId) || null;
  },

  /**
   * Verify user exists by exact match on email/username/phone
   * @param {string} query - Search query (email, username, or phone)
   * @returns {Promise<object>} Result with success and user
   */
  async verify(query) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const lowerQuery = query.toLowerCase().trim();

    // Try exact match first
    let user = mockUsers.find(u =>
      u.email.toLowerCase() === lowerQuery ||
      u.username.toLowerCase() === lowerQuery ||
      u.phone === lowerQuery
    );

    // If no exact match, try partial match on name
    if (!user) {
      user = mockUsers.find(u =>
        u.name.toLowerCase().includes(lowerQuery) ||
        u.email.toLowerCase().includes(lowerQuery)
      );
    }

    if (user) {
      return { success: true, user };
    }

    return { success: false, message: 'User not found. Please check the email/username and try again.' };
  }
};

/**
 * User Lookup Input Component
 */
export class UserLookupInput extends HTMLElement {
  constructor() {
    super();
    this.user = null;
    this.config = {
      placeholder: 'Enter email, username, or phone',
      displayFields: ['name', 'email'],
      searchFields: ['email', 'username', 'phone', 'name'],
      required: false,
      label: 'User'
    };
  }

  /**
   * Observed attributes
   */
  static get observedAttributes() {
    return ['name', 'value', 'required', 'placeholder', 'label', 'display-fields', 'search-fields'];
  }

  /**
   * Attribute changed callback
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'name':
        this.updateHiddenInputName(newValue);
        break;
      case 'value':
        if (newValue) this.loadUserById(newValue);
        break;
      case 'required':
        this.config.required = newValue !== null && newValue !== 'false';
        break;
      case 'placeholder':
        this.config.placeholder = newValue;
        this.updatePlaceholder();
        break;
      case 'label':
        this.config.label = newValue;
        break;
      case 'display-fields':
        this.config.displayFields = newValue.split(',').map(f => f.trim());
        break;
      case 'search-fields':
        this.config.searchFields = newValue.split(',').map(f => f.trim());
        break;
    }
  }

  /**
   * Connected callback - render component
   */
  connectedCallback() {
    this.render();
    this.setupEventListeners();

    // Load existing value if set
    const value = this.getAttribute('value');
    if (value) {
      this.loadUserById(value);
    }
  }

  /**
   * Render the component
   */
  render() {
    const name = this.getAttribute('name') || 'userId';
    const placeholder = this.getAttribute('placeholder') || this.config.placeholder;
    const required = this.hasAttribute('required');

    this.innerHTML = `
      <div class="user-lookup-component">
        <!-- Verified User Display -->
        <div class="user-lookup-verified hidden">
          <div class="verified-user-card">
            <div class="verified-user-avatar">
              <ion-icon name="person-circle"></ion-icon>
            </div>
            <div class="verified-user-info">
              <span class="verified-user-name"></span>
              <span class="verified-user-details"></span>
            </div>
            <ion-button fill="clear" size="small" class="clear-user-btn" title="Clear selection">
              <ion-icon name="close-circle"></ion-icon>
            </ion-button>
          </div>
        </div>

        <!-- Search Input Row -->
        <div class="user-lookup-search-row">
          <ion-input
            type="text"
            placeholder="${placeholder}"
            class="user-lookup-input"
            ${required ? 'required' : ''}
          ></ion-input>
          <ion-button class="user-lookup-verify-btn" color="primary">
            <ion-icon name="search" slot="start"></ion-icon>
            Verify
          </ion-button>
        </div>

        <!-- Search Results Dropdown -->
        <div class="user-lookup-results hidden">
          <div class="user-lookup-results-list"></div>
        </div>

        <!-- Status Message -->
        <div class="user-lookup-status hidden"></div>

        <!-- Hidden Input for Form Value -->
        <input type="hidden" name="${name}" id="${name}" class="user-lookup-value" />
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const searchInput = this.querySelector('.user-lookup-input');
    const verifyBtn = this.querySelector('.user-lookup-verify-btn');
    const clearBtn = this.querySelector('.clear-user-btn');
    const resultsContainer = this.querySelector('.user-lookup-results');

    // Verify button click
    verifyBtn?.addEventListener('click', () => this.handleVerify());

    // Enter key to verify
    searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleVerify();
      }
    });

    // Live search on input
    searchInput?.addEventListener('ionInput', (e) => {
      const query = e.detail.value || '';
      if (query.length >= 2) {
        this.handleSearch(query);
      } else {
        this.hideResults();
      }
    });

    // Clear button
    clearBtn?.addEventListener('click', () => this.clearSelection());

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target)) {
        this.hideResults();
      }
    });

    // Handle result selection
    resultsContainer?.addEventListener('click', (e) => {
      const item = e.target.closest('.user-lookup-result-item');
      if (item) {
        const userId = item.dataset.userId;
        this.selectUserById(userId);
      }
    });
  }

  /**
   * Handle verify button click
   */
  async handleVerify() {
    const searchInput = this.querySelector('.user-lookup-input');
    const verifyBtn = this.querySelector('.user-lookup-verify-btn');
    const query = searchInput?.value?.trim();

    if (!query) {
      this.showStatus('Please enter an email, username, or phone number', 'warning');
      return;
    }

    // Show loading state
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<ion-spinner name="crescent"></ion-spinner>';
    this.hideStatus();

    try {
      const result = await userLookupService.verify(query);

      if (result.success && result.user) {
        this.setUser(result.user);
        this.showStatus('User verified successfully', 'success');
        setTimeout(() => this.hideStatus(), 2000);
      } else {
        this.showStatus(result.message || 'User not found', 'error');
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      this.showStatus('Error verifying user. Please try again.', 'error');
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = '<ion-icon name="search" slot="start"></ion-icon> Verify';
    }
  }

  /**
   * Handle live search
   */
  async handleSearch(query) {
    try {
      const results = await userLookupService.search(query, {
        searchFields: this.config.searchFields,
        limit: 5
      });

      this.showResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  }

  /**
   * Show search results
   */
  showResults(users) {
    const resultsContainer = this.querySelector('.user-lookup-results');
    const resultsList = this.querySelector('.user-lookup-results-list');

    if (!users || users.length === 0) {
      resultsList.innerHTML = `
        <div class="user-lookup-no-results">
          No users found. Click "Verify" to search.
        </div>
      `;
    } else {
      resultsList.innerHTML = users.map(user => `
        <div class="user-lookup-result-item" data-user-id="${user.id}">
          <div class="result-avatar">
            <ion-icon name="person-circle"></ion-icon>
          </div>
          <div class="result-info">
            <span class="result-name">${user.name}</span>
            <span class="result-email">${user.email}</span>
          </div>
          <span class="result-department">${user.department || ''}</span>
        </div>
      `).join('');
    }

    resultsContainer?.classList.remove('hidden');
  }

  /**
   * Hide search results
   */
  hideResults() {
    const resultsContainer = this.querySelector('.user-lookup-results');
    resultsContainer?.classList.add('hidden');
  }

  /**
   * Select user by ID from results
   */
  async selectUserById(userId) {
    const user = await userLookupService.getById(userId);
    if (user) {
      this.setUser(user);
      this.hideResults();
    }
  }

  /**
   * Load user by ID (for pre-populated values)
   */
  async loadUserById(userId) {
    if (!userId) return;

    try {
      const user = await userLookupService.getById(userId);
      if (user) {
        this.setUser(user, false);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }

  /**
   * Set the selected user
   */
  setUser(user, emitEvent = true) {
    this.user = user;

    // Update hidden input
    const hiddenInput = this.querySelector('.user-lookup-value');
    if (hiddenInput) {
      hiddenInput.value = user.id;
      if (emitEvent) {
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // Update verified display
    const verifiedContainer = this.querySelector('.user-lookup-verified');
    const searchRow = this.querySelector('.user-lookup-search-row');
    const nameEl = this.querySelector('.verified-user-name');
    const detailsEl = this.querySelector('.verified-user-details');

    if (nameEl) nameEl.textContent = user.name;
    if (detailsEl) {
      const details = this.config.displayFields
        .filter(f => f !== 'name' && user[f])
        .map(f => user[f])
        .join(' • ');
      detailsEl.textContent = details || user.email;
    }

    verifiedContainer?.classList.remove('hidden');
    searchRow?.classList.add('hidden');

    // Emit custom event
    if (emitEvent) {
      this.dispatchEvent(new CustomEvent('userSelected', {
        bubbles: true,
        detail: { user }
      }));
    }
  }

  /**
   * Clear the selection
   */
  clearSelection() {
    this.user = null;

    // Clear hidden input
    const hiddenInput = this.querySelector('.user-lookup-value');
    if (hiddenInput) {
      hiddenInput.value = '';
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Clear search input
    const searchInput = this.querySelector('.user-lookup-input');
    if (searchInput) searchInput.value = '';

    // Update display
    const verifiedContainer = this.querySelector('.user-lookup-verified');
    const searchRow = this.querySelector('.user-lookup-search-row');

    verifiedContainer?.classList.add('hidden');
    searchRow?.classList.remove('hidden');

    this.hideStatus();

    // Emit custom event
    this.dispatchEvent(new CustomEvent('userCleared', { bubbles: true }));
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    const statusEl = this.querySelector('.user-lookup-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `user-lookup-status ${type}`;
    }
  }

  /**
   * Hide status message
   */
  hideStatus() {
    const statusEl = this.querySelector('.user-lookup-status');
    if (statusEl) {
      statusEl.className = 'user-lookup-status hidden';
    }
  }

  /**
   * Update hidden input name
   */
  updateHiddenInputName(name) {
    const hiddenInput = this.querySelector('.user-lookup-value');
    if (hiddenInput) {
      hiddenInput.name = name;
      hiddenInput.id = name;
    }
  }

  /**
   * Update placeholder
   */
  updatePlaceholder() {
    const searchInput = this.querySelector('.user-lookup-input');
    if (searchInput) {
      searchInput.placeholder = this.config.placeholder;
    }
  }

  /**
   * Get current value
   */
  get value() {
    return this.user?.id || '';
  }

  /**
   * Set value
   */
  set value(userId) {
    if (userId) {
      this.loadUserById(userId);
    } else {
      this.clearSelection();
    }
  }

  /**
   * Get selected user
   */
  getUser() {
    return this.user;
  }
}

// Register custom element
customElements.define('user-lookup-input', UserLookupInput);

export default UserLookupInput;
