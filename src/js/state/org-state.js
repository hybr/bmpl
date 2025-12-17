/**
 * Organization State Management
 */

import Store from './store.js';
import { EVENTS } from '../config/constants.js';
import { memberState } from './member-state.js';

class OrganizationState extends Store {
  constructor() {
    super({
      organizations: [],
      activeOrg: null,
      loading: false,
      error: null,
      syncStatus: {} // orgId -> sync status
    });
  }

  /**
   * Set organizations list
   * @param {Array} organizations - Organizations array
   */
  setOrganizations(organizations) {
    this.setState({ organizations, error: null });
  }

  /**
   * Set active organization
   * @param {Object} org - Organization object
   */
  setActiveOrganization(org) {
    const oldOrg = this._state.activeOrg;

    this.setState({ activeOrg: org });

    this.emitEvent(EVENTS.ORG_SWITCHED, {
      from: oldOrg,
      to: org
    });
  }

  /**
   * Add organization to list
   * @param {Object} org - Organization object
   */
  addOrganization(org) {
    const organizations = [...this._state.organizations, org];
    this.setState({ organizations });
  }

  /**
   * Update organization in list
   * @param {string} orgId - Organization ID
   * @param {Object} updates - Organization updates
   */
  updateOrganization(orgId, updates) {
    const organizations = this._state.organizations.map(org =>
      org.id === orgId ? { ...org, ...updates } : org
    );

    this.setState({ organizations });

    // Update active org if it's the one being updated
    if (this._state.activeOrg && this._state.activeOrg.id === orgId) {
      this.setState({
        activeOrg: { ...this._state.activeOrg, ...updates }
      });
    }
  }

  /**
   * Remove organization from list
   * @param {string} orgId - Organization ID
   */
  removeOrganization(orgId) {
    const organizations = this._state.organizations.filter(
      org => org.id !== orgId
    );

    this.setState({ organizations });

    // Clear active org if it was removed
    if (this._state.activeOrg && this._state.activeOrg.id === orgId) {
      this.setState({ activeOrg: null });
    }
  }

  /**
   * Set loading state
   * @param {boolean} loading - Loading state
   */
  setLoading(loading) {
    this.setState({ loading });
  }

  /**
   * Set error
   * @param {string} error - Error message
   */
  setError(error) {
    this.setState({ error, loading: false });
  }

  /**
   * Clear error
   */
  clearError() {
    this.setState({ error: null });
  }

  /**
   * Update sync status for an organization
   * @param {string} orgId - Organization ID
   * @param {Object} status - Sync status
   */
  setSyncStatus(orgId, status) {
    const syncStatus = {
      ...this._state.syncStatus,
      [orgId]: status
    };

    this.setState({ syncStatus });
  }

  /**
   * Get organization by ID
   * @param {string} orgId - Organization ID
   * @returns {Object|null} Organization object
   */
  getOrganization(orgId) {
    return this._state.organizations.find(org => org.id === orgId) || null;
  }

  /**
   * Get active organization
   * @returns {Object|null} Active organization
   */
  getActiveOrganization() {
    return this._state.activeOrg;
  }

  /**
   * Alias for getActiveOrganization
   * @returns {Object|null} Active organization
   */
  getActiveOrg() {
    return this.getActiveOrganization();
  }

  /**
   * Get user's role in a specific organization
   * @param {string} orgId - Organization ID
   * @returns {string|null} User's role or null
   */
  getUserRoleInOrg(orgId) {
    return memberState.getCurrentUserRole(orgId);
  }

  /**
   * Get current user's role in the active organization
   * @returns {string|null} User's role or null
   */
  getCurrentUserRoleInActiveOrg() {
    const activeOrg = this.getActiveOrg();
    if (!activeOrg) return null;
    return this.getUserRoleInOrg(activeOrg.id);
  }

  /**
   * Get user's approval level in a specific organization
   * @param {string} orgId - Organization ID
   * @returns {string|null} User's approval level or null
   */
  getUserApprovalLevelInOrg(orgId) {
    const members = memberState.getOrgMembers(orgId);
    const currentUserRole = memberState.getCurrentUserRole(orgId);

    // Find current user's membership to get approval level
    // This is a simplified version - in practice we'd need the user ID
    const membership = members.find(m => m.role === currentUserRole);
    return membership?.approvalLevel || currentUserRole;
  }

  /**
   * Get all organizations
   * @returns {Array} Organizations array
   */
  getAllOrganizations() {
    return this._state.organizations;
  }

  /**
   * Get sync status for an organization
   * @param {string} orgId - Organization ID
   * @returns {Object|null} Sync status
   */
  getSyncStatus(orgId) {
    return this._state.syncStatus[orgId] || null;
  }

  /**
   * Check if user has any organizations
   * @returns {boolean} Has organizations
   */
  hasOrganizations() {
    return this._state.organizations.length > 0;
  }

  /**
   * Get organization count
   * @returns {number} Organization count
   */
  getOrganizationCount() {
    return this._state.organizations.length;
  }

  /**
   * Clear all organization data
   */
  clear() {
    this.setState({
      organizations: [],
      activeOrg: null,
      syncStatus: {},
      error: null,
      loading: false
    });
  }
}

// Export singleton instance
export const orgState = new OrganizationState();

export default OrganizationState;
