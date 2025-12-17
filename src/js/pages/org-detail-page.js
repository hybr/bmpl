/**
 * Organization Detail Page
 * Organization details view with navigation to members, settings
 */

import { orgState } from '../state/org-state.js';
import { memberState } from '../state/member-state.js';
import { memberService } from '../services/member-service.js';
import { authState } from '../state/auth-state.js';
import { router } from '../router.js';
import { ROLES } from '../config/constants.js';

class OrgDetailPage {
  constructor(params = {}) {
    this.params = params;
    this.orgId = params.id;
    this.org = null;
    this.memberCount = 0;
    this.currentUserRole = null;
  }

  async render() {
    const page = document.createElement('ion-page');
    page.className = 'org-detail-page';

    page.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button onclick="window.app.goBack()">
              <ion-icon slot="icon-only" name="arrow-back"></ion-icon>
            </ion-button>
          </ion-buttons>
          <ion-title>Organization</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <div id="org-loading" class="loading-container">
          <ion-spinner></ion-spinner>
          <p>Loading organization...</p>
        </div>

        <div id="org-content" class="org-content hidden">
          <!-- Org Header -->
          <div class="org-header">
            <ion-avatar class="org-avatar">
              <div id="org-initials" class="avatar-initials"></div>
            </ion-avatar>
            <div class="org-info">
              <h1 id="org-name">Organization</h1>
              <p id="org-id" class="org-id"></p>
            </div>
          </div>

          <!-- Navigation Cards -->
          <div class="nav-cards">
            <ion-card button id="members-card" class="nav-card">
              <ion-card-content>
                <div class="nav-card-content">
                  <div class="nav-card-icon">
                    <ion-icon name="people"></ion-icon>
                  </div>
                  <div class="nav-card-info">
                    <h3>Members</h3>
                    <p><span id="member-count">0</span> members</p>
                  </div>
                  <ion-icon name="chevron-forward" class="nav-arrow"></ion-icon>
                </div>
              </ion-card-content>
            </ion-card>

            <ion-card button id="settings-card" class="nav-card">
              <ion-card-content>
                <div class="nav-card-content">
                  <div class="nav-card-icon">
                    <ion-icon name="settings"></ion-icon>
                  </div>
                  <div class="nav-card-info">
                    <h3>Settings</h3>
                    <p>Organization settings</p>
                  </div>
                  <ion-icon name="chevron-forward" class="nav-arrow"></ion-icon>
                </div>
              </ion-card-content>
            </ion-card>
          </div>

          <!-- Your Role Section -->
          <div class="role-section">
            <h3 class="section-title">Your Role</h3>
            <ion-card class="role-card">
              <ion-card-content>
                <div class="role-info">
                  <ion-badge id="user-role-badge" color="primary">member</ion-badge>
                  <p id="role-description">You are a member of this organization</p>
                </div>
              </ion-card-content>
            </ion-card>
          </div>
        </div>
      </ion-content>
    `;

    return page;
  }

  async mounted() {
    await this.loadOrganization();
    this.setupEventListeners();
  }

  async loadOrganization() {
    try {
      // Determine org ID
      if (!this.orgId) {
        const activeOrg = orgState.getActiveOrg();
        this.orgId = activeOrg?.id || 'org_1';
      }

      // Get org details (mock for now)
      this.org = {
        id: this.orgId,
        name: 'Demo Organization'
      };

      // Load members to get count
      const members = await memberService.getOrgMembers(this.orgId);
      this.memberCount = members.length;

      // Get current user's membership
      const currentUser = authState.getUser();
      if (currentUser) {
        const membership = members.find(m => m.userId === currentUser.id);
        if (membership) {
          this.currentUserRole = membership.role;
        }
      }

      this.renderOrgDetails();
      this.showContent();
    } catch (error) {
      console.error('Error loading organization:', error);
    }
  }

  renderOrgDetails() {
    // Org name
    const nameEl = document.getElementById('org-name');
    if (nameEl) {
      nameEl.textContent = this.org?.name || 'Organization';
    }

    // Org ID
    const idEl = document.getElementById('org-id');
    if (idEl) {
      idEl.textContent = `ID: ${this.orgId}`;
    }

    // Initials
    const initialsEl = document.getElementById('org-initials');
    if (initialsEl) {
      const name = this.org?.name || 'O';
      initialsEl.textContent = name.substring(0, 2).toUpperCase();
    }

    // Member count
    const countEl = document.getElementById('member-count');
    if (countEl) {
      countEl.textContent = this.memberCount;
    }

    // User role
    const roleBadge = document.getElementById('user-role-badge');
    const roleDesc = document.getElementById('role-description');

    if (roleBadge && this.currentUserRole) {
      roleBadge.textContent = this.currentUserRole;
      roleBadge.color = this.getRoleColor(this.currentUserRole);
    }

    if (roleDesc && this.currentUserRole) {
      const descriptions = {
        [ROLES.OWNER]: 'You are the owner of this organization',
        [ROLES.ADMIN]: 'You are an administrator of this organization',
        [ROLES.MEMBER]: 'You are a member of this organization',
        [ROLES.VIEWER]: 'You have view-only access to this organization'
      };
      roleDesc.textContent = descriptions[this.currentUserRole] || 'You are a member of this organization';
    }
  }

  getRoleColor(role) {
    const colors = {
      [ROLES.OWNER]: 'danger',
      [ROLES.ADMIN]: 'warning',
      [ROLES.MEMBER]: 'primary',
      [ROLES.VIEWER]: 'medium'
    };
    return colors[role] || 'primary';
  }

  showContent() {
    document.getElementById('org-loading')?.classList.add('hidden');
    document.getElementById('org-content')?.classList.remove('hidden');
  }

  setupEventListeners() {
    // Members card
    document.getElementById('members-card')?.addEventListener('click', () => {
      router.navigate(`/organizations/${this.orgId}/members`);
    });

    // Settings card
    document.getElementById('settings-card')?.addEventListener('click', () => {
      router.navigate(`/organizations/${this.orgId}/settings`);
    });
  }
}

export default OrgDetailPage;
