/**
 * Organization Lookup Input Component
 * Reusable component for searching and verifying organizations by name
 * Stores the verified organizationId for foreign key relationships
 */

import { eventBus } from '../utils/events.js';
import { organizationPersistence } from '../services/organization-persistence.js';
import { DOC_TYPES } from '../config/constants.js';

/**
 * Organization Lookup Service
 * Handles searching and fetching organization data from CouchDB/PouchDB
 */
export const organizationLookupService = {
  /**
   * Transform PouchDB organization document to component format
   */
  transformOrganization(doc) {
    if (!doc) return null;
    return {
      id: doc._id,
      shortName: doc.shortName,
      fullName: doc.fullName,
      legalType: doc.legalType,
      industry: doc.industry || '',
      logo: doc.logo || '',
      tagLine: doc.tagLine || '',
      subdomain: doc.subdomain || '',
      _rev: doc._rev
    };
  },

  /**
   * Search organizations by query
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<Array>} Matching organizations
   */
  async search(query, options = {}) {
    const { limit = 10 } = options;

    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return [];

    try {
      await organizationPersistence.ensureInitialized();
      const results = await organizationPersistence.searchOrganizations(query, { limit });
      return results.map(doc => this.transformOrganization(doc));
    } catch (error) {
      console.error('Error searching organizations:', error);
      return [];
    }
  },

  /**
   * Get organization by ID
   * @param {string} orgId - Organization ID (e.g., "org:techcorp")
   * @returns {Promise<object|null>} Organization object or null
   */
  async getById(orgId) {
    try {
      await organizationPersistence.ensureInitialized();
      const doc = await organizationPersistence.getOrganizationById(orgId);
      return this.transformOrganization(doc);
    } catch (error) {
      if (error.name === 'not_found') {
        return null;
      }
      console.error('Error getting organization by ID:', error);
      return null;
    }
  },

  /**
   * Verify organization exists by exact match on full name
   * @param {string} query - Organization full name
   * @returns {Promise<object>} Result with success and organization
   */
  async verify(query) {
    const trimmedQuery = query.trim();

    try {
      await organizationPersistence.ensureInitialized();

      // Try exact full name match first
      let org = await organizationPersistence.getOrganizationByFullName(trimmedQuery);
      if (org) {
        return { success: true, organization: this.transformOrganization(org) };
      }

      // Try partial match as fallback
      const db = organizationPersistence.db;
      const partialResult = await db.find({
        selector: {
          type: DOC_TYPES.ORGANIZATION,
          $or: [
            { fullName: { $regex: new RegExp(trimmedQuery, 'i') } },
            { shortName: { $regex: new RegExp(trimmedQuery, 'i') } }
          ]
        },
        limit: 1
      });

      if (partialResult.docs.length > 0) {
        return { success: true, organization: this.transformOrganization(partialResult.docs[0]) };
      }

      return {
        success: false,
        message: 'Organization not found. Please check the name and try again.'
      };
    } catch (error) {
      console.error('Error verifying organization:', error);
      return {
        success: false,
        message: 'Error searching for organization. Please try again.'
      };
    }
  }
};

/**
 * Organization Lookup Input Component
 */
export class OrganizationLookupInput extends HTMLElement {
  constructor() {
    super();
    this.organization = null;
    this.config = {
      placeholder: 'Enter organization name',
      displayFields: ['fullName', 'industry'],
      searchFields: ['fullName', 'shortName', 'tagLine'],
      required: false,
      label: 'Organization'
    };
  }

  /**
   * Observed attributes
   */
  static get observedAttributes() {
    return ['name', 'value', 'required', 'placeholder', 'label', 'display-fields'];
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
        if (newValue) this.loadOrganizationById(newValue);
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
      this.loadOrganizationById(value);
    }
  }

  /**
   * Render the component
   */
  render() {
    const name = this.getAttribute('name') || 'organizationId';
    const placeholder = this.getAttribute('placeholder') || this.config.placeholder;
    const required = this.hasAttribute('required');

    this.innerHTML = `
      <div class="org-lookup-component">
        <!-- Verified Organization Display -->
        <div class="org-lookup-verified hidden">
          <div class="verified-org-card">
            <div class="verified-org-logo">
              <img src="" alt="" class="org-logo-img hidden" />
              <ion-icon name="business" class="org-logo-placeholder"></ion-icon>
            </div>
            <div class="verified-org-info">
              <span class="verified-org-name"></span>
              <span class="verified-org-details"></span>
            </div>
            <ion-button fill="clear" size="small" class="clear-org-btn" title="Clear selection">
              <ion-icon name="close-circle"></ion-icon>
            </ion-button>
          </div>
        </div>

        <!-- Search Input Row -->
        <div class="org-lookup-search-row">
          <ion-input
            type="text"
            placeholder="${placeholder}"
            class="org-lookup-input"
            ${required ? 'required' : ''}
          ></ion-input>
          <ion-button class="org-lookup-verify-btn" color="primary">
            <ion-icon name="search" slot="start"></ion-icon>
            Verify
          </ion-button>
        </div>

        <!-- Search Results Dropdown -->
        <div class="org-lookup-results hidden">
          <div class="org-lookup-results-list"></div>
        </div>

        <!-- Status Message -->
        <div class="org-lookup-status hidden"></div>

        <!-- Hidden Input for Form Value -->
        <input type="hidden" name="${name}" id="${name}" class="org-lookup-value" />
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const searchInput = this.querySelector('.org-lookup-input');
    const verifyBtn = this.querySelector('.org-lookup-verify-btn');
    const clearBtn = this.querySelector('.clear-org-btn');
    const resultsContainer = this.querySelector('.org-lookup-results');

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
      const item = e.target.closest('.org-lookup-result-item');
      if (item) {
        const orgId = item.dataset.orgId;
        this.selectOrganizationById(orgId);
      }
    });
  }

  /**
   * Handle verify button click
   */
  async handleVerify() {
    const searchInput = this.querySelector('.org-lookup-input');
    const verifyBtn = this.querySelector('.org-lookup-verify-btn');
    const query = searchInput?.value?.trim();

    if (!query) {
      this.showStatus('Please enter an organization name', 'warning');
      return;
    }

    // Show loading state
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<ion-spinner name="crescent"></ion-spinner>';
    this.hideStatus();

    try {
      const result = await organizationLookupService.verify(query);

      if (result.success && result.organization) {
        this.setOrganization(result.organization);
        this.showStatus('Organization verified successfully', 'success');
        setTimeout(() => this.hideStatus(), 2000);
      } else {
        this.showStatus(result.message || 'Organization not found', 'error');
      }
    } catch (error) {
      console.error('Error verifying organization:', error);
      this.showStatus('Error verifying organization. Please try again.', 'error');
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
      const results = await organizationLookupService.search(query, {
        searchFields: this.config.searchFields,
        limit: 5
      });

      this.showResults(results);
    } catch (error) {
      console.error('Error searching organizations:', error);
    }
  }

  /**
   * Show search results
   */
  showResults(organizations) {
    const resultsContainer = this.querySelector('.org-lookup-results');
    const resultsList = this.querySelector('.org-lookup-results-list');

    if (!organizations || organizations.length === 0) {
      resultsList.innerHTML = `
        <div class="org-lookup-no-results">
          No organizations found. Click "Verify" to search.
        </div>
      `;
    } else {
      resultsList.innerHTML = organizations.map(org => `
        <div class="org-lookup-result-item" data-org-id="${org.id}">
          <div class="result-logo">
            ${org.logo
              ? `<img src="${org.logo}" alt="${org.shortName}" />`
              : `<ion-icon name="business"></ion-icon>`
            }
          </div>
          <div class="result-info">
            <span class="result-name">${org.fullName}</span>
            <span class="result-industry">${org.industry || ''}</span>
          </div>
        </div>
      `).join('');
    }

    resultsContainer?.classList.remove('hidden');
  }

  /**
   * Hide search results
   */
  hideResults() {
    const resultsContainer = this.querySelector('.org-lookup-results');
    resultsContainer?.classList.add('hidden');
  }

  /**
   * Select organization by ID from results
   */
  async selectOrganizationById(orgId) {
    const org = await organizationLookupService.getById(orgId);
    if (org) {
      this.setOrganization(org);
      this.hideResults();
    }
  }

  /**
   * Load organization by ID (for pre-populated values)
   */
  async loadOrganizationById(orgId) {
    if (!orgId) return;

    try {
      const org = await organizationLookupService.getById(orgId);
      if (org) {
        this.setOrganization(org, false);
      }
    } catch (error) {
      console.error('Error loading organization:', error);
    }
  }

  /**
   * Set the selected organization
   */
  setOrganization(org, emitEvent = true) {
    this.organization = org;

    // Update hidden input
    const hiddenInput = this.querySelector('.org-lookup-value');
    if (hiddenInput) {
      hiddenInput.value = org.id;
      if (emitEvent) {
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // Update verified display
    const verifiedContainer = this.querySelector('.org-lookup-verified');
    const searchRow = this.querySelector('.org-lookup-search-row');
    const nameEl = this.querySelector('.verified-org-name');
    const detailsEl = this.querySelector('.verified-org-details');
    const logoImg = this.querySelector('.org-logo-img');
    const logoPlaceholder = this.querySelector('.org-logo-placeholder');

    if (nameEl) nameEl.textContent = org.fullName;
    if (detailsEl) {
      const details = this.config.displayFields
        .filter(f => f !== 'fullName' && org[f])
        .map(f => org[f])
        .join(' | ');
      detailsEl.textContent = details || org.industry || '';
    }

    // Handle logo display
    if (org.logo && logoImg) {
      logoImg.src = org.logo;
      logoImg.classList.remove('hidden');
      logoPlaceholder?.classList.add('hidden');
    } else {
      logoImg?.classList.add('hidden');
      logoPlaceholder?.classList.remove('hidden');
    }

    verifiedContainer?.classList.remove('hidden');
    searchRow?.classList.add('hidden');

    // Emit custom event
    if (emitEvent) {
      this.dispatchEvent(new CustomEvent('organizationSelected', {
        bubbles: true,
        detail: { organization: org }
      }));
    }
  }

  /**
   * Clear the selection
   */
  clearSelection() {
    this.organization = null;

    // Clear hidden input
    const hiddenInput = this.querySelector('.org-lookup-value');
    if (hiddenInput) {
      hiddenInput.value = '';
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Clear search input
    const searchInput = this.querySelector('.org-lookup-input');
    if (searchInput) searchInput.value = '';

    // Update display
    const verifiedContainer = this.querySelector('.org-lookup-verified');
    const searchRow = this.querySelector('.org-lookup-search-row');

    verifiedContainer?.classList.add('hidden');
    searchRow?.classList.remove('hidden');

    this.hideStatus();

    // Emit custom event
    this.dispatchEvent(new CustomEvent('organizationCleared', { bubbles: true }));
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    const statusEl = this.querySelector('.org-lookup-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `org-lookup-status ${type}`;
    }
  }

  /**
   * Hide status message
   */
  hideStatus() {
    const statusEl = this.querySelector('.org-lookup-status');
    if (statusEl) {
      statusEl.className = 'org-lookup-status hidden';
    }
  }

  /**
   * Update hidden input name
   */
  updateHiddenInputName(name) {
    const hiddenInput = this.querySelector('.org-lookup-value');
    if (hiddenInput) {
      hiddenInput.name = name;
      hiddenInput.id = name;
    }
  }

  /**
   * Update placeholder
   */
  updatePlaceholder() {
    const searchInput = this.querySelector('.org-lookup-input');
    if (searchInput) {
      searchInput.placeholder = this.config.placeholder;
    }
  }

  /**
   * Get current value
   */
  get value() {
    return this.organization?.id || '';
  }

  /**
   * Set value
   */
  set value(orgId) {
    if (orgId) {
      this.loadOrganizationById(orgId);
    } else {
      this.clearSelection();
    }
  }

  /**
   * Get selected organization
   */
  getOrganization() {
    return this.organization;
  }
}

// Register custom element
customElements.define('organization-lookup-input', OrganizationLookupInput);

export default OrganizationLookupInput;
