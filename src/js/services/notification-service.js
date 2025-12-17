/**
 * Notification Service
 * Handles creating and managing notifications
 */

import { notificationState } from '../state/notification-state.js';
import { memberState } from '../state/member-state.js';
import { authState } from '../state/auth-state.js';
import { NOTIFICATION_TYPES, APPROVAL_LEVELS } from '../config/constants.js';
import { hasApprovalPermission } from '../utils/helpers.js';

class NotificationService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize notification service
   */
  async init() {
    if (this.initialized) return;

    // Load stored notifications
    await notificationState.loadFromStorage();

    this.initialized = true;
    console.log('Notification service initialized');
  }

  /**
   * Create a notification
   * @param {Object} options - Notification options
   * @returns {Object} Created notification
   */
  notify(options) {
    const {
      type,
      title,
      message,
      processId = null,
      taskId = null,
      data = {}
    } = options;

    return notificationState.addNotification({
      type,
      title,
      message,
      processId,
      taskId,
      data
    });
  }

  /**
   * Notify when a task is assigned
   * @param {Object} task - Task object
   * @param {Object} process - Process object
   */
  notifyTaskAssigned(task, process) {
    const processName = process.definition?.name || 'Process';

    this.notify({
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `You have a new task in "${processName}": ${task.message || 'Action required'}`,
      processId: process._id,
      taskId: task.id,
      data: {
        taskType: task.type,
        stateName: task.currentState,
        role: task.role
      }
    });
  }

  /**
   * Notify when a task is completed
   * @param {Object} task - Task object
   * @param {Object} process - Process object
   * @param {string} completedBy - User ID who completed the task
   */
  notifyTaskCompleted(task, process, completedBy) {
    const processName = process.definition?.name || 'Process';

    this.notify({
      type: NOTIFICATION_TYPES.TASK_COMPLETED,
      title: 'Task Completed',
      message: `Task "${task.message || task.type}" in "${processName}" has been completed`,
      processId: process._id,
      taskId: task.id,
      data: {
        completedBy,
        taskType: task.type
      }
    });
  }

  /**
   * Notify when approval is needed
   * @param {Object} process - Process object
   * @param {string} requiredApprovalLevel - Required approval level
   */
  notifyApprovalNeeded(process, requiredApprovalLevel) {
    const currentUser = authState.getUser();
    if (!currentUser) return;

    // Check if current user has the required approval level
    const userApprovalLevel = this.getCurrentUserApprovalLevel(process.orgId);

    if (hasApprovalPermission(userApprovalLevel, requiredApprovalLevel)) {
      const processName = process.definition?.name || 'Process';

      this.notify({
        type: NOTIFICATION_TYPES.APPROVAL_NEEDED,
        title: 'Approval Required',
        message: `Your approval is required for "${processName}"`,
        processId: process._id,
        data: {
          requiredLevel: requiredApprovalLevel,
          currentState: process.currentState
        }
      });
    }
  }

  /**
   * Notify when approval is received
   * @param {Object} process - Process object
   * @param {boolean} approved - Whether it was approved or rejected
   * @param {string} approverName - Name of the approver
   */
  notifyApprovalReceived(process, approved, approverName) {
    const processName = process.definition?.name || 'Process';
    const status = approved ? 'approved' : 'rejected';

    this.notify({
      type: NOTIFICATION_TYPES.APPROVAL_RECEIVED,
      title: approved ? 'Approved' : 'Rejected',
      message: `"${processName}" has been ${status} by ${approverName}`,
      processId: process._id,
      data: {
        approved,
        approver: approverName
      }
    });
  }

  /**
   * Notify when a process is created
   * @param {Object} process - Process object
   */
  notifyProcessCreated(process) {
    const processName = process.definition?.name || 'Process';

    this.notify({
      type: NOTIFICATION_TYPES.PROCESS_CREATED,
      title: 'Process Started',
      message: `New process "${processName}" has been started`,
      processId: process._id,
      data: {
        processType: process.processType,
        createdBy: process.metadata?.createdBy
      }
    });
  }

  /**
   * Notify when a process is completed
   * @param {Object} process - Process object
   */
  notifyProcessCompleted(process) {
    const processName = process.definition?.name || 'Process';

    this.notify({
      type: NOTIFICATION_TYPES.PROCESS_COMPLETED,
      title: 'Process Completed',
      message: `Process "${processName}" has been completed successfully`,
      processId: process._id,
      data: {
        processType: process.processType,
        completedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Notify when a member joins
   * @param {string} memberName - Member name
   * @param {string} orgName - Organization name
   */
  notifyMemberJoined(memberName, orgName) {
    this.notify({
      type: NOTIFICATION_TYPES.MEMBER_JOINED,
      title: 'New Member',
      message: `${memberName} has joined ${orgName}`,
      data: {
        memberName,
        orgName
      }
    });
  }

  /**
   * Notify when user's role is changed
   * @param {string} newRole - New role
   * @param {string} orgName - Organization name
   */
  notifyRoleChanged(newRole, orgName) {
    this.notify({
      type: NOTIFICATION_TYPES.ROLE_CHANGED,
      title: 'Role Updated',
      message: `Your role in ${orgName} has been changed to ${newRole}`,
      data: {
        newRole,
        orgName
      }
    });
  }

  /**
   * Get current user's approval level for an org
   * @param {string} orgId - Organization ID
   * @returns {string|null} Approval level
   */
  getCurrentUserApprovalLevel(orgId) {
    const currentUser = authState.getUser();
    if (!currentUser) return null;

    const members = memberState.getOrgMembers(orgId || 'org_1');
    const membership = members.find(m => m.userId === currentUser.id);

    return membership?.approvalLevel || membership?.role || APPROVAL_LEVELS.MEMBER;
  }

  /**
   * Get unread count
   * @returns {number} Unread count
   */
  getUnreadCount() {
    return notificationState.getUnreadCount();
  }

  /**
   * Get all notifications
   * @returns {Array} Notifications
   */
  getNotifications() {
    return notificationState.getNotifications();
  }

  /**
   * Mark notification as read
   * @param {string} id - Notification ID
   */
  markAsRead(id) {
    notificationState.markAsRead(id);
  }

  /**
   * Mark all as read
   */
  markAllAsRead() {
    notificationState.markAllAsRead();
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    notificationState.clearAll();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

export default NotificationService;
