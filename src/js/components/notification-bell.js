/**
 * Notification Bell Component
 * Shows notification icon with unread count and dropdown
 */

import { notificationState } from '../state/notification-state.js';
import { notificationService } from '../services/notification-service.js';
import { router } from '../router.js';
import { eventBus } from '../utils/events.js';
import { EVENTS, NOTIFICATION_TYPES } from '../config/constants.js';
import { formatRelativeTime } from '../utils/helpers.js';

class NotificationBell {
  constructor(containerId = 'notification-bell-container') {
    this.containerId = containerId;
    this.isOpen = false;
    this.unsubscribe = null;
  }

  /**
   * Initialize the notification bell
   */
  init() {
    this.render();
    this.setupEventListeners();
    this.updateBadge();
  }

  /**
   * Render the notification bell
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.warn('Notification bell container not found:', this.containerId);
      return;
    }

    container.innerHTML = `
      <div class="notification-bell">
        <ion-button id="notification-btn" fill="clear" class="notification-btn">
          <ion-icon name="notifications-outline" slot="icon-only"></ion-icon>
          <span id="notification-badge" class="notification-badge hidden">0</span>
        </ion-button>

        <div id="notification-dropdown" class="notification-dropdown hidden">
          <div class="dropdown-header">
            <h3>Notifications</h3>
            <ion-button id="mark-all-read-btn" fill="clear" size="small">
              Mark all read
            </ion-button>
          </div>
          <div id="notification-list" class="notification-list">
            <!-- Notifications will be rendered here -->
          </div>
          <div class="dropdown-footer">
            <ion-button id="clear-all-btn" fill="clear" size="small" expand="block">
              Clear All
            </ion-button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Toggle dropdown
    const btn = document.getElementById('notification-btn');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
    }

    // Mark all as read
    const markAllBtn = document.getElementById('mark-all-read-btn');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationService.markAllAsRead();
        this.renderNotifications();
        this.updateBadge();
      });
    }

    // Clear all
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationService.clearAll();
        this.renderNotifications();
        this.updateBadge();
        this.closeDropdown();
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('notification-dropdown');
      const bell = document.querySelector('.notification-bell');

      if (dropdown && !dropdown.contains(e.target) && !bell?.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Listen for notification events
    eventBus.on(EVENTS.NOTIFICATION_RECEIVED, () => {
      this.updateBadge();
      if (this.isOpen) {
        this.renderNotifications();
      }
    });

    eventBus.on(EVENTS.NOTIFICATION_READ, () => {
      this.updateBadge();
    });

    eventBus.on(EVENTS.NOTIFICATIONS_CLEARED, () => {
      this.updateBadge();
      this.renderNotifications();
    });

    // Subscribe to state changes
    this.unsubscribe = notificationState.subscribe(() => {
      this.updateBadge();
    });
  }

  /**
   * Toggle dropdown visibility
   */
  toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /**
   * Open dropdown
   */
  openDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
      dropdown.classList.remove('hidden');
      this.isOpen = true;
      this.renderNotifications();
    }
  }

  /**
   * Close dropdown
   */
  closeDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
      dropdown.classList.add('hidden');
      this.isOpen = false;
    }
  }

  /**
   * Update badge count
   */
  updateBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    const count = notificationService.getUnreadCount();

    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  /**
   * Render notifications list
   */
  renderNotifications() {
    const list = document.getElementById('notification-list');
    if (!list) return;

    const notifications = notificationService.getNotifications();

    if (notifications.length === 0) {
      list.innerHTML = `
        <div class="empty-notifications">
          <ion-icon name="notifications-off-outline"></ion-icon>
          <p>No notifications</p>
        </div>
      `;
      return;
    }

    list.innerHTML = notifications.slice(0, 20).map(notification => this.renderNotificationItem(notification)).join('');

    // Add click handlers for notification items
    list.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        const processId = item.getAttribute('data-process-id');

        // Mark as read
        notificationService.markAsRead(id);
        this.renderNotifications();
        this.updateBadge();

        // Navigate if there's a process
        if (processId) {
          this.closeDropdown();
          router.navigate(`/process/${processId}`);
        }
      });
    });
  }

  /**
   * Render a single notification item
   * @param {Object} notification - Notification object
   * @returns {string} HTML string
   */
  renderNotificationItem(notification) {
    const icon = this.getNotificationIcon(notification.type);
    const iconColor = this.getNotificationColor(notification.type);
    const timeAgo = formatRelativeTime(notification.createdAt);
    const unreadClass = notification.read ? '' : 'unread';

    return `
      <div class="notification-item ${unreadClass}"
           data-id="${notification.id}"
           data-process-id="${notification.processId || ''}">
        <div class="notification-icon" style="color: var(--ion-color-${iconColor})">
          <ion-icon name="${icon}"></ion-icon>
        </div>
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-message">${notification.message}</div>
          <div class="notification-time">${timeAgo}</div>
        </div>
        ${!notification.read ? '<div class="unread-dot"></div>' : ''}
      </div>
    `;
  }

  /**
   * Get icon for notification type
   * @param {string} type - Notification type
   * @returns {string} Icon name
   */
  getNotificationIcon(type) {
    const icons = {
      [NOTIFICATION_TYPES.TASK_ASSIGNED]: 'clipboard-outline',
      [NOTIFICATION_TYPES.TASK_COMPLETED]: 'checkmark-circle-outline',
      [NOTIFICATION_TYPES.PROCESS_CREATED]: 'add-circle-outline',
      [NOTIFICATION_TYPES.PROCESS_COMPLETED]: 'trophy-outline',
      [NOTIFICATION_TYPES.APPROVAL_NEEDED]: 'hand-right-outline',
      [NOTIFICATION_TYPES.APPROVAL_RECEIVED]: 'thumbs-up-outline',
      [NOTIFICATION_TYPES.MEMBER_JOINED]: 'person-add-outline',
      [NOTIFICATION_TYPES.ROLE_CHANGED]: 'shield-outline'
    };
    return icons[type] || 'notifications-outline';
  }

  /**
   * Get color for notification type
   * @param {string} type - Notification type
   * @returns {string} Color name
   */
  getNotificationColor(type) {
    const colors = {
      [NOTIFICATION_TYPES.TASK_ASSIGNED]: 'primary',
      [NOTIFICATION_TYPES.TASK_COMPLETED]: 'success',
      [NOTIFICATION_TYPES.PROCESS_CREATED]: 'tertiary',
      [NOTIFICATION_TYPES.PROCESS_COMPLETED]: 'success',
      [NOTIFICATION_TYPES.APPROVAL_NEEDED]: 'warning',
      [NOTIFICATION_TYPES.APPROVAL_RECEIVED]: 'success',
      [NOTIFICATION_TYPES.MEMBER_JOINED]: 'secondary',
      [NOTIFICATION_TYPES.ROLE_CHANGED]: 'warning'
    };
    return colors[type] || 'medium';
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    eventBus.off(EVENTS.NOTIFICATION_RECEIVED);
    eventBus.off(EVENTS.NOTIFICATION_READ);
    eventBus.off(EVENTS.NOTIFICATIONS_CLEARED);
  }
}

// Export class for instantiation
export { NotificationBell };

// Export factory function
export function createNotificationBell(containerId) {
  const bell = new NotificationBell(containerId);
  bell.init();
  return bell;
}

export default NotificationBell;
