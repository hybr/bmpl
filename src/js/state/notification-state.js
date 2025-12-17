/**
 * Notification State Management
 * Stores and manages user notifications
 */

import Store from './store.js';
import { EVENTS, STORAGE_KEYS } from '../config/constants.js';
import { storageService } from '../services/storage-service.js';

class NotificationState extends Store {
  constructor() {
    super({
      notifications: [], // Array of notification objects
      unreadCount: 0,
      loading: false
    });
  }

  /**
   * Load notifications from storage
   */
  async loadFromStorage() {
    try {
      const stored = await storageService.get(STORAGE_KEYS.NOTIFICATIONS);
      if (stored && Array.isArray(stored)) {
        this.setState({ notifications: stored });
        this.updateUnreadCount();
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
  }

  /**
   * Save notifications to storage
   */
  async saveToStorage() {
    try {
      await storageService.set(STORAGE_KEYS.NOTIFICATIONS, this._state.notifications);
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  }

  /**
   * Add a new notification
   * @param {Object} notification - Notification object
   */
  addNotification(notification) {
    const newNotification = {
      id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      processId: notification.processId || null,
      taskId: notification.taskId || null,
      data: notification.data || {},
      createdAt: notification.createdAt || new Date().toISOString(),
      read: false
    };

    const notifications = [newNotification, ...this._state.notifications];

    // Limit to 100 notifications
    if (notifications.length > 100) {
      notifications.splice(100);
    }

    this.setState({ notifications });
    this.updateUnreadCount();
    this.saveToStorage();

    // Emit event
    this.emitEvent(EVENTS.NOTIFICATION_RECEIVED, newNotification);

    return newNotification;
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  markAsRead(notificationId) {
    const notifications = this._state.notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );

    this.setState({ notifications });
    this.updateUnreadCount();
    this.saveToStorage();

    this.emitEvent(EVENTS.NOTIFICATION_READ, { id: notificationId });
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    const notifications = this._state.notifications.map(n => ({
      ...n,
      read: true
    }));

    this.setState({ notifications });
    this.updateUnreadCount();
    this.saveToStorage();
  }

  /**
   * Remove a notification
   * @param {string} notificationId - Notification ID
   */
  removeNotification(notificationId) {
    const notifications = this._state.notifications.filter(
      n => n.id !== notificationId
    );

    this.setState({ notifications });
    this.updateUnreadCount();
    this.saveToStorage();
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.setState({ notifications: [], unreadCount: 0 });
    this.saveToStorage();
    this.emitEvent(EVENTS.NOTIFICATIONS_CLEARED, {});
  }

  /**
   * Update unread count
   */
  updateUnreadCount() {
    const unreadCount = this._state.notifications.filter(n => !n.read).length;
    this.setState({ unreadCount });
  }

  /**
   * Get all notifications
   * @returns {Array} Notifications array
   */
  getNotifications() {
    return this._state.notifications;
  }

  /**
   * Get unread notifications
   * @returns {Array} Unread notifications array
   */
  getUnreadNotifications() {
    return this._state.notifications.filter(n => !n.read);
  }

  /**
   * Get unread count
   * @returns {number} Unread count
   */
  getUnreadCount() {
    return this._state.unreadCount;
  }

  /**
   * Get notifications by type
   * @param {string} type - Notification type
   * @returns {Array} Filtered notifications
   */
  getByType(type) {
    return this._state.notifications.filter(n => n.type === type);
  }

  /**
   * Get notifications for a process
   * @param {string} processId - Process ID
   * @returns {Array} Filtered notifications
   */
  getByProcess(processId) {
    return this._state.notifications.filter(n => n.processId === processId);
  }

  /**
   * Clear state
   */
  clear() {
    this.setState({
      notifications: [],
      unreadCount: 0,
      loading: false
    });
  }
}

// Export singleton instance
export const notificationState = new NotificationState();

export default NotificationState;
