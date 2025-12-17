/**
 * Organization Members Page
 * Display and manage organization members and their roles
 */

import { authState } from '../state/auth-state.js';
import { orgState } from '../state/org-state.js';
import { memberState } from '../state/member-state.js';
import { memberService } from '../services/member-service.js';
import { eventBus } from '../utils/events.js';
import { router } from '../router.js';
import { ROLES, APPROVAL_LEVELS, ROLE_HIERARCHY, EVENTS } from '../config/constants.js';
import { getInitials } from '../utils/helpers.js';

class OrgMembersPage {
  constructor(params = {}) {
    this.params = params;
    this.orgId = params.id;
    this.members = [];
    this.currentUserMembership = null;
    this.loading = true;
  }

  async render() {
    const page = document.createElement('ion-page');
    page.className = 'org-members-page';

    page.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button onclick="window.app.goBack()">
              <ion-icon slot="icon-only" name="arrow-back"></ion-icon>
            </ion-button>
          </ion-buttons>
          <ion-title>Organization Members</ion-title>
          <ion-buttons slot="end">
            <ion-button id="refresh-members-btn">
              <ion-icon slot="icon-only" name="refresh"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <div id="members-loading" class="loading-container">
          <ion-spinner></ion-spinner>
          <p>Loading members...</p>
        </div>

        <div id="members-content" class="members-content hidden">
          <!-- Stats Section -->
          <div class="stats-section">
            <div class="stat-card">
              <ion-icon name="people"></ion-icon>
              <div class="stat-info">
                <span id="total-members-count" class="stat-value">0</span>
                <span class="stat-label">Total Members</span>
              </div>
            </div>
            <div class="stat-card">
              <ion-icon name="shield-checkmark"></ion-icon>
              <div class="stat-info">
                <span id="admin-count" class="stat-value">0</span>
                <span class="stat-label">Admins</span>
              </div>
            </div>
          </div>

          <!-- Members List -->
          <div class="members-section">
            <h3 class="section-title">Members</h3>
            <ion-list id="members-list">
              <!-- Members will be rendered here -->
            </ion-list>
          </div>
        </div>

        <div id="members-error" class="error-container hidden">
          <ion-icon name="alert-circle"></ion-icon>
          <p>Failed to load members</p>
          <ion-button id="retry-btn" fill="outline">Retry</ion-button>
        </div>
      </ion-content>

      <!-- Role Change Modal -->
      <ion-modal id="role-modal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Change Role</ion-title>
            <ion-buttons slot="end">
              <ion-button id="close-role-modal">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div id="role-modal-content">
            <p>Select a new role for <strong id="member-name-display"></strong></p>

            <ion-list id="role-options">
              <!-- Role options will be rendered here -->
            </ion-list>

            <div class="modal-actions">
              <ion-button id="cancel-role-change" fill="outline" expand="block">Cancel</ion-button>
              <ion-button id="confirm-role-change" expand="block">Save Changes</ion-button>
            </div>
          </div>
        </ion-content>
      </ion-modal>
    `;

    return page;
  }

  async mounted() {
    await this.loadMembers();
    this.setupEventListeners();
  }

  async loadMembers() {
    this.loading = true;
    this.showLoading();

    try {
      // Determine org ID
      if (!this.orgId) {
        const activeOrg = orgState.getActiveOrg();
        this.orgId = activeOrg?.id || 'org_1';
      }

      // Load members
      this.members = await memberService.getOrgMembers(this.orgId);

      // Get current user's membership
      const currentUser = authState.getUser();
      if (currentUser) {
        this.currentUserMembership = this.members.find(m => m.userId === currentUser.id);
      }

      this.renderMembers();
      this.updateStats();
      this.showContent();
    } catch (error) {
      console.error('Error loading members:', error);
      this.showError();
    }
  }

  renderMembers() {
    const list = document.getElementById('members-list');
    if (!list) return;

    list.innerHTML = '';

    // Sort members by role hierarchy (owners first)
    const sortedMembers = [...this.members].sort((a, b) => {
      return (ROLE_HIERARCHY[b.role] || 0) - (ROLE_HIERARCHY[a.role] || 0);
    });

    sortedMembers.forEach(member => {
      const item = this.createMemberItem(member);
      list.appendChild(item);
    });
  }

  createMemberItem(member) {
    const item = document.createElement('ion-item');
    item.className = 'member-item';

    const canManage = this.canManageMember(member);
    const isCurrentUser = this.isCurrentUser(member);

    const roleColor = this.getRoleColor(member.role);
    const approvalBadge = member.approvalLevel ?
      `<ion-badge color="medium" class="approval-badge">${member.approvalLevel}</ion-badge>` : '';

    item.innerHTML = `
      <ion-avatar slot="start">
        <div class="avatar-initials" style="background-color: ${this.getAvatarColor(member.userName)}">
          ${getInitials(member.userName)}
        </div>
      </ion-avatar>
      <ion-label>
        <h2>${member.userName}${isCurrentUser ? ' (You)' : ''}</h2>
        <p>${member.email || 'No email'}</p>
        <div class="member-badges">
          <ion-badge color="${roleColor}">${member.role}</ion-badge>
          ${approvalBadge}
        </div>
      </ion-label>
      ${canManage && !isCurrentUser ? `
        <ion-button slot="end" fill="clear" class="edit-role-btn" data-user-id="${member.userId}">
          <ion-icon name="create-outline"></ion-icon>
        </ion-button>
      ` : ''}
    `;

    return item;
  }

  canManageMember(member) {
    if (!this.currentUserMembership) return false;

    // Only admins and owners can manage members
    return memberService.canManageMembers(this.currentUserMembership.role);
  }

  isCurrentUser(member) {
    const currentUser = authState.getUser();
    return currentUser && member.userId === currentUser.id;
  }

  getRoleColor(role) {
    const colors = {
      [ROLES.OWNER]: 'danger',
      [ROLES.ADMIN]: 'warning',
      [ROLES.MEMBER]: 'primary',
      [ROLES.VIEWER]: 'medium'
    };
    return colors[role] || 'medium';
  }

  getAvatarColor(name) {
    if (!name) return '#888';

    // Generate consistent color from name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = ['#3880ff', '#5260ff', '#2dd36f', '#ffc409', '#eb445a', '#92949c'];
    return colors[Math.abs(hash) % colors.length];
  }

  updateStats() {
    const totalEl = document.getElementById('total-members-count');
    const adminEl = document.getElementById('admin-count');

    if (totalEl) {
      totalEl.textContent = this.members.length;
    }

    if (adminEl) {
      const admins = this.members.filter(m =>
        m.role === ROLES.OWNER || m.role === ROLES.ADMIN
      ).length;
      adminEl.textContent = admins;
    }
  }

  showLoading() {
    document.getElementById('members-loading')?.classList.remove('hidden');
    document.getElementById('members-content')?.classList.add('hidden');
    document.getElementById('members-error')?.classList.add('hidden');
  }

  showContent() {
    document.getElementById('members-loading')?.classList.add('hidden');
    document.getElementById('members-content')?.classList.remove('hidden');
    document.getElementById('members-error')?.classList.add('hidden');
  }

  showError() {
    document.getElementById('members-loading')?.classList.add('hidden');
    document.getElementById('members-content')?.classList.add('hidden');
    document.getElementById('members-error')?.classList.remove('hidden');
  }

  setupEventListeners() {
    // Refresh button
    document.getElementById('refresh-members-btn')?.addEventListener('click', () => {
      this.loadMembers();
    });

    // Retry button
    document.getElementById('retry-btn')?.addEventListener('click', () => {
      this.loadMembers();
    });

    // Edit role buttons (event delegation)
    document.getElementById('members-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.edit-role-btn');
      if (btn) {
        const userId = btn.getAttribute('data-user-id');
        this.openRoleModal(userId);
      }
    });

    // Role modal close
    document.getElementById('close-role-modal')?.addEventListener('click', () => {
      this.closeRoleModal();
    });

    document.getElementById('cancel-role-change')?.addEventListener('click', () => {
      this.closeRoleModal();
    });

    // Role change confirm
    document.getElementById('confirm-role-change')?.addEventListener('click', () => {
      this.saveRoleChange();
    });

    // Listen for member events
    eventBus.on(EVENTS.MEMBER_ROLE_CHANGED, () => {
      this.loadMembers();
    });
  }

  openRoleModal(userId) {
    const member = this.members.find(m => m.userId === userId);
    if (!member) return;

    this.editingUserId = userId;
    this.selectedRole = member.role;
    this.selectedApprovalLevel = member.approvalLevel;

    // Update modal content
    document.getElementById('member-name-display').textContent = member.userName;

    // Render role options
    const roleOptions = document.getElementById('role-options');
    if (roleOptions) {
      roleOptions.innerHTML = '';

      // Get assignable roles based on current user's role
      const assignableRoles = memberService.getAssignableRoles(this.currentUserMembership.role);
      const assignableApprovals = memberService.getAssignableApprovalLevels(
        this.currentUserMembership.approvalLevel || this.currentUserMembership.role
      );

      // Role selection
      roleOptions.innerHTML = `
        <ion-list-header>Organization Role</ion-list-header>
        <ion-radio-group id="role-select" value="${member.role}">
          ${assignableRoles.map(role => `
            <ion-item>
              <ion-label>${role}</ion-label>
              <ion-radio slot="end" value="${role}"></ion-radio>
            </ion-item>
          `).join('')}
        </ion-radio-group>

        <ion-list-header>Approval Level</ion-list-header>
        <ion-radio-group id="approval-select" value="${member.approvalLevel || 'member'}">
          ${assignableApprovals.map(level => `
            <ion-item>
              <ion-label>${level}</ion-label>
              <ion-radio slot="end" value="${level}"></ion-radio>
            </ion-item>
          `).join('')}
        </ion-radio-group>
      `;

      // Add change listeners
      document.getElementById('role-select')?.addEventListener('ionChange', (e) => {
        this.selectedRole = e.detail.value;
      });

      document.getElementById('approval-select')?.addEventListener('ionChange', (e) => {
        this.selectedApprovalLevel = e.detail.value;
      });
    }

    // Show modal
    const modal = document.getElementById('role-modal');
    if (modal) {
      modal.isOpen = true;
    }
  }

  closeRoleModal() {
    const modal = document.getElementById('role-modal');
    if (modal) {
      modal.isOpen = false;
    }
    this.editingUserId = null;
  }

  async saveRoleChange() {
    if (!this.editingUserId) return;

    try {
      await memberService.updateMemberRole(
        this.orgId,
        this.editingUserId,
        this.selectedRole,
        this.selectedApprovalLevel
      );

      this.closeRoleModal();
      this.showToast('Role updated successfully', 'success');
      await this.loadMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      this.showToast(error.message || 'Failed to update role', 'error');
    }
  }

  showToast(message, type = 'info') {
    window.app?.showToast?.(message, type);
  }
}

export default OrgMembersPage;
