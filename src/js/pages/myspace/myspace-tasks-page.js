/**
 * My Tasks Page
 * View and manage all tasks assigned to the current user
 */

import BasePage from '../base/base-page.js';
import { processState } from '../../state/process-state.js';
import { processService } from '../../services/bpm/process-service.js';
import { taskService } from '../../services/bpm/task-service.js';
import { authState } from '../../state/auth-state.js';
import { orgState } from '../../state/org-state.js';
import { memberState } from '../../state/member-state.js';
import { eventBus } from '../../utils/events.js';
import { router } from '../../router.js';
import { formatDate, getRelativeTime } from '../../utils/date-utils.js';
import { hasApprovalPermission } from '../../utils/helpers.js';
import { EVENTS } from '../../config/constants.js';

export class MySpaceTasksPage extends BasePage {
  constructor() {
    super();
    this.myTasks = [];
    this.filteredTasks = [];
    this.filterStatus = 'all'; // all, pending, urgent
    this.filterCategory = 'all';
    this.searchQuery = '';
  }

  /**
   * Render page
   */
  async render() {
    const page = document.createElement('ion-page');
    page.className = 'myspace-tasks-page';

    // Header
    const header = this.createHeader();
    page.appendChild(header);

    // Content
    const content = document.createElement('ion-content');
    content.className = 'ion-padding';

    // Filter section
    const filterSection = this.createFilterSection();
    content.appendChild(filterSection);

    // Tasks list container
    const tasksContainer = document.createElement('div');
    tasksContainer.id = 'tasks-container';
    tasksContainer.className = 'tasks-container';
    content.appendChild(tasksContainer);

    page.appendChild(content);

    return page;
  }

  /**
   * Create header
   */
  createHeader() {
    const header = document.createElement('ion-header');
    header.innerHTML = `
      <ion-toolbar>
        <ion-title>My Tasks</ion-title>
        <ion-buttons slot="end">
          <ion-button id="refresh-tasks-btn">
            <ion-icon slot="icon-only" name="refresh"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    `;

    return header;
  }

  /**
   * Create filter section
   */
  createFilterSection() {
    const section = document.createElement('div');
    section.className = 'filter-section';
    section.innerHTML = `
      <div class="filter-row">
        <ion-segment id="status-filter" value="all">
          <ion-segment-button value="all">
            <ion-label>All</ion-label>
          </ion-segment-button>
          <ion-segment-button value="pending">
            <ion-label>Pending</ion-label>
          </ion-segment-button>
          <ion-segment-button value="urgent">
            <ion-label>Urgent</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <div class="search-row">
        <ion-searchbar
          id="task-search"
          placeholder="Search tasks..."
          debounce="500"
        ></ion-searchbar>
      </div>

      <div class="stats-row">
        <div class="stat-chip">
          <ion-icon name="checkbox-outline"></ion-icon>
          <span id="total-tasks-count">0</span> tasks
        </div>
        <div class="stat-chip urgent">
          <ion-icon name="alert-circle"></ion-icon>
          <span id="urgent-tasks-count">0</span> urgent
        </div>
      </div>
    `;

    return section;
  }

  /**
   * Called after page is mounted
   */
  async mounted() {
    await this.loadTasks();
    this.renderTasks();
    this.setupEventListeners();
  }

  /**
   * Load all tasks
   */
  async loadTasks() {
    try {
      const currentUser = authState.getUser();
      if (!currentUser) {
        this.myTasks = [];
        return;
      }

      // Get all active processes
      const activeProcesses = processState.getActiveProcesses();

      // Extract tasks requiring action
      this.myTasks = [];

      for (const process of activeProcesses) {
        const definition = processService.getDefinition(process.definitionId);
        if (!definition) continue;

        const currentState = definition.states?.[process.currentState];
        if (!currentState?.requiredActions) continue;

        currentState.requiredActions.forEach(action => {
          // Check if user has permission to perform this action
          const canPerform = this.canUserPerformAction(currentUser, action, process);

          if (canPerform) {
            this.myTasks.push({
              processId: process._id,
              process: process,
              definition: definition,
              action: action,
              state: process.currentState,
              stateName: currentState.name,
              priority: this.getTaskPriority(process, action),
              dueDate: this.getTaskDueDate(process),
              isUrgent: this.isTaskUrgent(process, action)
            });
          }
        });
      }

      // Sort by priority and due date
      this.myTasks.sort((a, b) => {
        if (a.isUrgent !== b.isUrgent) return b.isUrgent - a.isUrgent;
        if (a.priority !== b.priority) return b.priority - a.priority;
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        return 0;
      });

      this.applyFilters();

    } catch (error) {
      console.error('Error loading tasks:', error);
      this.showError('Failed to load tasks');
    }
  }

  /**
   * Check if user can perform action based on their approval level
   * @param {Object} user - Current user
   * @param {Object} action - Required action from process state
   * @param {Object} process - Process instance
   * @returns {boolean} Whether user can perform this action
   */
  canUserPerformAction(user, action, process) {
    // If action has no role requirement, allow all authenticated users
    if (!action.role) {
      return true;
    }

    // Get user's approval level from current organization
    const activeOrg = orgState.getActiveOrg();
    if (!activeOrg) {
      return false;
    }

    const userApprovalLevel = memberState.getCurrentUserRole(activeOrg.id);
    if (!userApprovalLevel) {
      // Try to get from membership directly
      const members = memberState.getOrgMembers(activeOrg.id);
      const membership = members.find(m => m.userId === user.id);
      if (!membership) {
        return false;
      }
      // Use approval level from membership, or map from role
      const approvalLevel = membership.approvalLevel || membership.role;
      return hasApprovalPermission(approvalLevel, action.role);
    }

    return hasApprovalPermission(userApprovalLevel, action.role);
  }

  /**
   * Get task priority (1-5, higher is more urgent)
   */
  getTaskPriority(process, action) {
    // Check process priority variable
    if (process.variables?.priority) {
      const priorityMap = {
        'critical': 5,
        'high': 4,
        'medium': 3,
        'low': 2
      };
      return priorityMap[process.variables.priority] || 3;
    }

    // Check action type
    if (action.type === 'approval') return 4;
    if (action.type === 'review') return 3;

    return 3; // Default medium priority
  }

  /**
   * Get task due date
   */
  getTaskDueDate(process) {
    // Check for SLA deadline
    if (process.variables?.slaDeadline) {
      return process.variables.slaDeadline;
    }

    // Check for due date
    if (process.variables?.dueDate) {
      return process.variables.dueDate;
    }

    // Check for requested completion date
    if (process.variables?.requestedCompletionDate) {
      return process.variables.requestedCompletionDate;
    }

    return null;
  }

  /**
   * Check if task is urgent
   */
  isTaskUrgent(process, action) {
    const dueDate = this.getTaskDueDate(process);
    if (!dueDate) return false;

    const now = new Date();
    const due = new Date(dueDate);
    const hoursUntilDue = (due - now) / (1000 * 60 * 60);

    // Urgent if due within 24 hours or overdue
    return hoursUntilDue <= 24;
  }

  /**
   * Apply filters to tasks
   */
  applyFilters() {
    this.filteredTasks = this.myTasks.filter(task => {
      // Status filter
      if (this.filterStatus === 'pending') {
        if (task.action.type !== 'approval' && task.action.type !== 'review') {
          return false;
        }
      } else if (this.filterStatus === 'urgent') {
        if (!task.isUrgent) {
          return false;
        }
      }

      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const searchableText = [
          task.definition.name,
          task.stateName,
          task.action.message,
          task.process._id,
          JSON.stringify(task.process.variables)
        ].join(' ').toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });

    this.updateStats();
  }

  /**
   * Update stats display
   */
  updateStats() {
    const totalCount = document.getElementById('total-tasks-count');
    const urgentCount = document.getElementById('urgent-tasks-count');

    if (totalCount) {
      totalCount.textContent = this.filteredTasks.length;
    }

    if (urgentCount) {
      const urgent = this.filteredTasks.filter(t => t.isUrgent).length;
      urgentCount.textContent = urgent;
    }
  }

  /**
   * Render tasks list
   */
  renderTasks() {
    const container = document.getElementById('tasks-container');
    if (!container) return;

    container.innerHTML = '';

    if (this.filteredTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <ion-icon name="checkmark-circle-outline"></ion-icon>
          <h3>No tasks found</h3>
          <p>You're all caught up!</p>
        </div>
      `;
      return;
    }

    // Group tasks by urgency
    const urgentTasks = this.filteredTasks.filter(t => t.isUrgent);
    const normalTasks = this.filteredTasks.filter(t => !t.isUrgent);

    // Render urgent tasks
    if (urgentTasks.length > 0) {
      const urgentSection = document.createElement('div');
      urgentSection.className = 'task-section urgent-section';
      urgentSection.innerHTML = `
        <h3 class="section-title">
          <ion-icon name="alert-circle"></ion-icon>
          Urgent Tasks (${urgentTasks.length})
        </h3>
      `;

      urgentTasks.forEach(task => {
        urgentSection.appendChild(this.createTaskCard(task));
      });

      container.appendChild(urgentSection);
    }

    // Render normal tasks
    if (normalTasks.length > 0) {
      const normalSection = document.createElement('div');
      normalSection.className = 'task-section';
      normalSection.innerHTML = `
        <h3 class="section-title">
          <ion-icon name="list"></ion-icon>
          Tasks (${normalTasks.length})
        </h3>
      `;

      normalTasks.forEach(task => {
        normalSection.appendChild(this.createTaskCard(task));
      });

      container.appendChild(normalSection);
    }
  }

  /**
   * Create task card
   */
  createTaskCard(task) {
    const card = document.createElement('ion-card');
    card.className = 'task-card';
    if (task.isUrgent) {
      card.classList.add('urgent');
    }

    // Get display values
    const processName = task.definition.name;
    const processId = task.process._id.substring(0, 8);
    const category = task.definition.metadata?.category || 'general';
    const stateName = task.stateName;
    const actionMessage = task.action.message || 'Action required';
    const actionLabel = task.action.actionLabel || 'View';

    // Format due date
    let dueDateHtml = '';
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const isOverdue = dueDate < new Date();
      const relativeTime = getRelativeTime(dueDate);

      dueDateHtml = `
        <div class="task-due ${isOverdue ? 'overdue' : ''}">
          <ion-icon name="time-outline"></ion-icon>
          <span>${isOverdue ? 'Overdue' : 'Due'}: ${relativeTime}</span>
        </div>
      `;
    }

    // Get priority badge
    const priorityBadge = this.getPriorityBadge(task.priority);

    card.innerHTML = `
      <ion-card-header>
        <div class="task-card-header">
          <div class="task-info">
            <ion-card-subtitle>
              <ion-badge color="primary">${category}</ion-badge>
              ${priorityBadge}
              <span class="process-id">#${processId}</span>
            </ion-card-subtitle>
            <ion-card-title>${processName}</ion-card-title>
          </div>
          ${task.isUrgent ? '<ion-icon name="alert-circle" class="urgent-icon"></ion-icon>' : ''}
        </div>
      </ion-card-header>
      <ion-card-content>
        <div class="task-details">
          <div class="task-state">
            <ion-icon name="radio-button-on"></ion-icon>
            <span>${stateName}</span>
          </div>
          <p class="task-message">${actionMessage}</p>
          ${dueDateHtml}
        </div>
        <div class="task-actions">
          <ion-button
            fill="solid"
            size="default"
            class="view-task-btn"
            data-process-id="${task.process._id}"
          >
            <ion-icon slot="start" name="open-outline"></ion-icon>
            ${actionLabel}
          </ion-button>
        </div>
      </ion-card-content>
    `;

    return card;
  }

  /**
   * Get priority badge HTML
   */
  getPriorityBadge(priority) {
    const priorityNames = {
      5: { name: 'Critical', color: 'danger' },
      4: { name: 'High', color: 'warning' },
      3: { name: 'Medium', color: 'primary' },
      2: { name: 'Low', color: 'medium' }
    };

    const p = priorityNames[priority] || priorityNames[3];
    return `<ion-badge color="${p.color}">${p.name}</ion-badge>`;
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-tasks-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        await this.loadTasks();
        this.renderTasks();
      });
    }

    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('ionChange', (e) => {
        this.filterStatus = e.detail.value;
        this.applyFilters();
        this.renderTasks();
      });
    }

    // Search
    const searchBar = document.getElementById('task-search');
    if (searchBar) {
      searchBar.addEventListener('ionInput', (e) => {
        this.searchQuery = e.detail.value || '';
        this.applyFilters();
        this.renderTasks();
      });
    }

    // Task card clicks (event delegation)
    const container = document.getElementById('tasks-container');
    if (container) {
      container.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-task-btn');
        if (btn) {
          const processId = btn.getAttribute('data-process-id');
          if (processId) {
            router.navigate(`/process/${processId}`);
          }
        }
      });
    }

    // Listen for process updates
    eventBus.on(EVENTS.PROCESS_STATE_CHANGED, async () => {
      await this.loadTasks();
      this.renderTasks();
    });

    eventBus.on(EVENTS.PROCESS_CREATED, async () => {
      await this.loadTasks();
      this.renderTasks();
    });
  }

  /**
   * Called before page is removed
   */
  onWillLeave() {
    // Clean up event listeners
    eventBus.off(EVENTS.PROCESS_STATE_CHANGED);
    eventBus.off(EVENTS.PROCESS_CREATED);
  }
}

export default MySpaceTasksPage;
