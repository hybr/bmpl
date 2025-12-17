/**
 * Member Service
 * Handles organization member management
 */

import { memberState } from '../state/member-state.js';
import { authState } from '../state/auth-state.js';
import { ROLES, ROLE_HIERARCHY, APPROVAL_LEVELS, APPROVAL_HIERARCHY } from '../config/constants.js';

class MemberService {
  constructor() {
    this.mockMembers = new Map(); // orgId -> members[]
    this.delay = 300; // Simulated network delay
    this.initializeMockData();
  }

  /**
   * Simulate network delay
   */
  async simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  /**
   * Initialize mock member data for testing
   * Creates members with various roles for the demo org
   */
  initializeMockData() {
    // Demo org members with various roles
    this.mockMembers.set('org_1', [
      {
        id: 'member_1',
        orgId: 'org_1',
        userId: 'user_1',
        userName: 'Demo User',
        email: 'demo@example.com',
        role: ROLES.OWNER,
        approvalLevel: APPROVAL_LEVELS.OWNER,
        joinedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'member_2',
        orgId: 'org_1',
        userId: 'user_admin',
        userName: 'Admin User',
        email: 'admin@example.com',
        role: ROLES.ADMIN,
        approvalLevel: APPROVAL_LEVELS.DIRECTOR,
        joinedAt: '2024-02-15T00:00:00Z'
      },
      {
        id: 'member_3',
        orgId: 'org_1',
        userId: 'user_manager',
        userName: 'Manager User',
        email: 'manager@example.com',
        role: ROLES.MEMBER,
        approvalLevel: APPROVAL_LEVELS.MANAGER,
        joinedAt: '2024-03-10T00:00:00Z'
      },
      {
        id: 'member_4',
        orgId: 'org_1',
        userId: 'user_member',
        userName: 'Regular Member',
        email: 'member@example.com',
        role: ROLES.MEMBER,
        approvalLevel: APPROVAL_LEVELS.MEMBER,
        joinedAt: '2024-04-20T00:00:00Z'
      },
      {
        id: 'member_5',
        orgId: 'org_1',
        userId: 'user_viewer',
        userName: 'Viewer User',
        email: 'viewer@example.com',
        role: ROLES.VIEWER,
        approvalLevel: APPROVAL_LEVELS.MEMBER,
        joinedAt: '2024-05-01T00:00:00Z'
      }
    ]);
  }

  /**
   * Get members for an organization
   * @param {string} orgId - Organization ID
   * @returns {Promise<Array>} Members array
   */
  async getOrgMembers(orgId) {
    await this.simulateDelay();
    const members = this.mockMembers.get(orgId) || [];
    memberState.setOrgMembers(orgId, members);
    return members;
  }

  /**
   * Get current user's membership in an organization
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object|null>} Membership object or null
   */
  async getCurrentUserMembership(orgId) {
    await this.simulateDelay();
    const currentUser = authState.getUser();
    if (!currentUser) return null;

    const members = this.mockMembers.get(orgId) || [];
    const membership = members.find(m => m.userId === currentUser.id);

    if (membership) {
      memberState.setCurrentUserRole(orgId, membership.role);
    }

    return membership;
  }

  /**
   * Get user's approval level in an organization
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {string|null} Approval level or null
   */
  getUserApprovalLevel(orgId, userId = null) {
    const currentUser = authState.getUser();
    const targetUserId = userId || currentUser?.id;
    if (!targetUserId) return null;

    const members = this.mockMembers.get(orgId) || [];
    const membership = members.find(m => m.userId === targetUserId);

    return membership?.approvalLevel || null;
  }

  /**
   * Add member to organization
   * @param {string} orgId - Organization ID
   * @param {Object} userData - User data { userId, name, email }
   * @param {string} role - Organization role
   * @param {string} approvalLevel - Approval level for processes
   * @returns {Promise<Object>} New member object
   */
  async addMember(orgId, userData, role = ROLES.MEMBER, approvalLevel = APPROVAL_LEVELS.MEMBER) {
    await this.simulateDelay();

    // Check if user already exists
    const members = this.mockMembers.get(orgId) || [];
    if (members.find(m => m.userId === userData.userId)) {
      throw new Error('User is already a member of this organization');
    }

    const newMember = {
      id: `member_${Date.now()}`,
      orgId,
      userId: userData.userId,
      userName: userData.name,
      email: userData.email,
      role,
      approvalLevel,
      joinedAt: new Date().toISOString()
    };

    members.push(newMember);
    this.mockMembers.set(orgId, members);

    memberState.addMember(orgId, newMember);
    return newMember;
  }

  /**
   * Update member role
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID to update
   * @param {string} newRole - New organization role
   * @param {string} newApprovalLevel - New approval level (optional)
   * @returns {Promise<Object>} Updated member object
   */
  async updateMemberRole(orgId, userId, newRole, newApprovalLevel = null) {
    await this.simulateDelay();

    // Verify caller has permission
    const currentUser = authState.getUser();
    const callerMembership = await this.getMemberByUserId(orgId, currentUser?.id);

    if (!callerMembership || !this.canChangeRole(callerMembership.role, newRole)) {
      throw new Error('Insufficient permissions to change role');
    }

    const members = this.mockMembers.get(orgId) || [];
    const memberIndex = members.findIndex(m => m.userId === userId);

    if (memberIndex === -1) {
      throw new Error('Member not found');
    }

    // Prevent changing own role
    if (userId === currentUser?.id) {
      throw new Error('Cannot change your own role');
    }

    members[memberIndex].role = newRole;
    if (newApprovalLevel) {
      members[memberIndex].approvalLevel = newApprovalLevel;
    }
    this.mockMembers.set(orgId, members);

    memberState.updateMemberRole(orgId, userId, newRole);
    return members[memberIndex];
  }

  /**
   * Remove member from organization
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID to remove
   * @returns {Promise<boolean>} Success
   */
  async removeMember(orgId, userId) {
    await this.simulateDelay();

    // Verify caller has permission
    const currentUser = authState.getUser();
    const callerMembership = await this.getMemberByUserId(orgId, currentUser?.id);

    if (!callerMembership || !this.canManageMembers(callerMembership.role)) {
      throw new Error('Insufficient permissions to remove members');
    }

    // Prevent removing self
    if (userId === currentUser?.id) {
      throw new Error('Cannot remove yourself from organization');
    }

    const members = this.mockMembers.get(orgId) || [];
    const memberToRemove = members.find(m => m.userId === userId);

    // Prevent removing owners
    if (memberToRemove?.role === ROLES.OWNER) {
      throw new Error('Cannot remove organization owner');
    }

    const filteredMembers = members.filter(m => m.userId !== userId);

    if (filteredMembers.length === members.length) {
      throw new Error('Member not found');
    }

    this.mockMembers.set(orgId, filteredMembers);
    memberState.removeMember(orgId, userId);
    return true;
  }

  /**
   * Get member by user ID
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Member object or null
   */
  async getMemberByUserId(orgId, userId) {
    const members = this.mockMembers.get(orgId) || [];
    return members.find(m => m.userId === userId) || null;
  }

  /**
   * Check if user can change to target role
   * @param {string} userRole - Current user's role
   * @param {string} targetRole - Target role to assign
   * @returns {boolean} Can change role
   */
  canChangeRole(userRole, targetRole) {
    // Only owner/admin can change roles
    if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[ROLES.ADMIN]) {
      return false;
    }
    // Can only assign roles lower than or equal to own
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
  }

  /**
   * Check if user can manage members
   * @param {string} userRole - User's role
   * @returns {boolean} Can manage members
   */
  canManageMembers(userRole) {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[ROLES.ADMIN];
  }

  /**
   * Check if user has approval permission
   * @param {string} userApprovalLevel - User's approval level
   * @param {string} requiredLevel - Required approval level
   * @returns {boolean} Has permission
   */
  hasApprovalPermission(userApprovalLevel, requiredLevel) {
    const userLevel = APPROVAL_HIERARCHY[userApprovalLevel] || 1;
    const required = APPROVAL_HIERARCHY[requiredLevel] || 1;
    return userLevel >= required;
  }

  /**
   * Get available roles for assignment
   * @param {string} userRole - Current user's role
   * @returns {Array<string>} Available roles
   */
  getAssignableRoles(userRole) {
    const userLevel = ROLE_HIERARCHY[userRole];
    return Object.entries(ROLE_HIERARCHY)
      .filter(([, level]) => level <= userLevel)
      .map(([role]) => role);
  }

  /**
   * Get available approval levels for assignment
   * @param {string} userApprovalLevel - Current user's approval level
   * @returns {Array<string>} Available approval levels
   */
  getAssignableApprovalLevels(userApprovalLevel) {
    const userLevel = APPROVAL_HIERARCHY[userApprovalLevel];
    return Object.entries(APPROVAL_HIERARCHY)
      .filter(([, level]) => level <= userLevel)
      .map(([approvalLevel]) => approvalLevel);
  }
}

export const memberService = new MemberService();
export default MemberService;
