/**
 * Organization Member State Management
 * Manages org memberships and user roles per organization
 */

import Store from './store.js';
import { EVENTS } from '../config/constants.js';
import { authState } from './auth-state.js';

class MemberState extends Store {
  constructor() {
    super({
      // Map: orgId -> Array<Membership>
      membersByOrg: {},
      // Map: orgId -> userRole (for current user)
      currentUserRoles: {},
      loading: false,
      error: null
    });
  }

  /**
   * Set members for an organization
   * @param {string} orgId - Organization ID
   * @param {Array} members - Array of member objects
   */
  setOrgMembers(orgId, members) {
    const membersByOrg = {
      ...this._state.membersByOrg,
      [orgId]: members
    };
    this.setState({ membersByOrg });
  }

  /**
   * Get members for an organization
   * @param {string} orgId - Organization ID
   * @returns {Array} Members array
   */
  getOrgMembers(orgId) {
    return this._state.membersByOrg[orgId] || [];
  }

  /**
   * Set current user's role in an organization
   * @param {string} orgId - Organization ID
   * @param {string} role - User's role
   */
  setCurrentUserRole(orgId, role) {
    const currentUserRoles = {
      ...this._state.currentUserRoles,
      [orgId]: role
    };
    this.setState({ currentUserRoles });
  }

  /**
   * Get current user's role in an organization
   * @param {string} orgId - Organization ID
   * @returns {string|null} User's role or null
   */
  getCurrentUserRole(orgId) {
    return this._state.currentUserRoles[orgId] || null;
  }

  /**
   * Add member to organization
   * @param {string} orgId - Organization ID
   * @param {Object} member - Member object
   */
  addMember(orgId, member) {
    const members = [...this.getOrgMembers(orgId), member];
    this.setOrgMembers(orgId, members);
    this.emitEvent(EVENTS.MEMBER_ADDED, { orgId, member });
  }

  /**
   * Remove member from organization
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID to remove
   */
  removeMember(orgId, userId) {
    const members = this.getOrgMembers(orgId).filter(m => m.userId !== userId);
    this.setOrgMembers(orgId, members);
    this.emitEvent(EVENTS.MEMBER_REMOVED, { orgId, userId });
  }

  /**
   * Update member role
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @param {string} newRole - New role
   */
  updateMemberRole(orgId, userId, newRole) {
    const members = this.getOrgMembers(orgId).map(m =>
      m.userId === userId ? { ...m, role: newRole } : m
    );
    this.setOrgMembers(orgId, members);
    this.emitEvent(EVENTS.MEMBER_ROLE_CHANGED, { orgId, userId, newRole });
  }

  /**
   * Get member by userId in an organization
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Object|null} Member object or null
   */
  getMember(orgId, userId) {
    return this.getOrgMembers(orgId).find(m => m.userId === userId) || null;
  }

  /**
   * Get all organizations where user is a member
   * @param {string} userId - User ID
   * @returns {Array} Array of {orgId, role} objects
   */
  getUserMemberships(userId) {
    const memberships = [];
    Object.entries(this._state.membersByOrg).forEach(([orgId, members]) => {
      const member = members.find(m => m.userId === userId);
      if (member) {
        memberships.push({ orgId, role: member.role });
      }
    });
    return memberships;
  }

  /**
   * Get organization IDs where current user is a member
   * Used for filtered sync to determine which orgs to replicate
   * @returns {Array<string>} Array of organization IDs
   */
  getUserOrganizationIds() {
    const currentUser = authState.getUser();
    if (!currentUser) {
      return [];
    }

    const orgIds = [];
    Object.entries(this._state.membersByOrg).forEach(([orgId, members]) => {
      const isMember = members.some(m => m.userId === currentUser._id);
      if (isMember) {
        orgIds.push(orgId);
      }
    });

    return orgIds;
  }

  /**
   * Set loading state
   * @param {boolean} loading - Loading state
   */
  setLoading(loading) {
    this.setState({ loading });
  }

  /**
   * Set error state
   * @param {string|null} error - Error message or null
   */
  setError(error) {
    this.setState({ error });
  }

  /**
   * Clear all member data
   */
  clear() {
    this.setState({
      membersByOrg: {},
      currentUserRoles: {},
      error: null,
      loading: false
    });
  }
}

export const memberState = new MemberState();
export default MemberState;
