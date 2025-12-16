/**
 * Analytics Service
 * Provides metrics, KPIs, and analytics for business processes
 */

import { processState } from '../../state/process-state.js';
import { processService } from './process-service.js';
import { eventBus } from '../../utils/events.js';
import {
  EVENTS,
  PROCESS_STATUS,
  PROCESS_CATEGORIES,
  ANALYTICS_CACHE_TTL
} from '../../config/constants.js';

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.setupEventListeners();
  }

  /**
   * Setup event listeners to invalidate cache
   */
  setupEventListeners() {
    // Clear cache on process changes
    eventBus.on(EVENTS.PROCESS_CREATED, () => this.clearCache());
    eventBus.on(EVENTS.PROCESS_STATE_CHANGED, () => this.clearCache());
    eventBus.on(EVENTS.PROCESS_UPDATED, () => this.clearCache());
    eventBus.on(EVENTS.PROCESS_COMPLETED, () => this.clearCache());
    eventBus.on(EVENTS.PROCESS_CANCELLED, () => this.clearCache());
    eventBus.on(EVENTS.PROCESS_FAILED, () => this.clearCache());
  }

  /**
   * Get process metrics
   * @param {object} filters - Filter criteria
   * @returns {object} Process metrics
   */
  getProcessMetrics(filters = {}) {
    const cacheKey = `metrics_${JSON.stringify(filters)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const processes = this.getFilteredProcesses(filters);

    const metrics = {
      total: processes.length,
      active: this.countByStatus(processes, PROCESS_STATUS.ACTIVE),
      suspended: this.countByStatus(processes, PROCESS_STATUS.SUSPENDED),
      completed: this.countByStatus(processes, PROCESS_STATUS.COMPLETED),
      cancelled: this.countByStatus(processes, PROCESS_STATUS.CANCELLED),
      failed: this.countByStatus(processes, PROCESS_STATUS.FAILED),
      avgDuration: this.calculateAverageDuration(processes),
      completionRate: this.calculateCompletionRate(processes),
      activeRate: this.calculateActiveRate(processes)
    };

    this.setCache(cacheKey, metrics);
    return metrics;
  }

  /**
   * Get processes by status
   * @param {string} definitionId - Optional definition ID filter
   * @returns {object} Processes grouped by status
   */
  getProcessesByStatus(definitionId = null) {
    const cacheKey = `by_status_${definitionId || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    let processes = processState.getAllProcesses();
    if (definitionId) {
      processes = processes.filter(p => p.definitionId === definitionId);
    }

    const grouped = {
      [PROCESS_STATUS.ACTIVE]: [],
      [PROCESS_STATUS.SUSPENDED]: [],
      [PROCESS_STATUS.COMPLETED]: [],
      [PROCESS_STATUS.CANCELLED]: [],
      [PROCESS_STATUS.FAILED]: []
    };

    processes.forEach(process => {
      if (grouped[process.status]) {
        grouped[process.status].push(process);
      }
    });

    const result = {
      [PROCESS_STATUS.ACTIVE]: grouped[PROCESS_STATUS.ACTIVE].length,
      [PROCESS_STATUS.SUSPENDED]: grouped[PROCESS_STATUS.SUSPENDED].length,
      [PROCESS_STATUS.COMPLETED]: grouped[PROCESS_STATUS.COMPLETED].length,
      [PROCESS_STATUS.CANCELLED]: grouped[PROCESS_STATUS.CANCELLED].length,
      [PROCESS_STATUS.FAILED]: grouped[PROCESS_STATUS.FAILED].length
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get processes by category
   * @returns {object} Processes grouped by category
   */
  getProcessesByCategory() {
    const cacheKey = 'by_category';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const processes = processState.getAllProcesses();
    const definitions = processService.getAllDefinitions();

    // Create category map
    const categoryMap = {};
    definitions.forEach(def => {
      categoryMap[def.id] = def.metadata?.category || 'uncategorized';
    });

    // Group by category
    const grouped = {};
    Object.values(PROCESS_CATEGORIES).forEach(category => {
      grouped[category] = 0;
    });
    grouped.uncategorized = 0;

    processes.forEach(process => {
      const category = categoryMap[process.definitionId] || 'uncategorized';
      grouped[category] = (grouped[category] || 0) + 1;
    });

    this.setCache(cacheKey, grouped);
    return grouped;
  }

  /**
   * Calculate average process duration
   * @param {string} definitionId - Optional definition ID filter
   * @returns {number} Average duration in milliseconds
   */
  getProcessDuration(definitionId) {
    const cacheKey = `duration_${definitionId || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    let processes = processState.getAllProcesses();
    if (definitionId) {
      processes = processes.filter(p => p.definitionId === definitionId);
    }

    // Only include completed processes
    const completed = processes.filter(p => p.status === PROCESS_STATUS.COMPLETED);

    const durations = completed.map(p => {
      const created = new Date(p.createdAt).getTime();
      const completedAt = new Date(p.completedAt).getTime();
      return completedAt - created;
    });

    const result = {
      average: durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0,
      min: durations.length > 0 ? Math.min(...durations) : 0,
      max: durations.length > 0 ? Math.max(...durations) : 0,
      count: durations.length
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Identify bottlenecks in process execution
   * @param {string} definitionId - Process definition ID
   * @returns {array} States with longest average duration
   */
  getBottlenecks(definitionId) {
    const cacheKey = `bottlenecks_${definitionId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const processes = processState.getAllProcesses()
      .filter(p => p.definitionId === definitionId);

    // Calculate time in each state
    const stateDurations = {};

    processes.forEach(process => {
      const history = process.stateHistory || [];

      history.forEach((entry, index) => {
        const state = entry.from;
        const entryTime = new Date(entry.timestamp).getTime();

        // Calculate duration to next state or current time
        const nextEntry = history[index + 1];
        const exitTime = nextEntry
          ? new Date(nextEntry.timestamp).getTime()
          : new Date().getTime();

        const duration = exitTime - entryTime;

        if (!stateDurations[state]) {
          stateDurations[state] = {
            state,
            totalDuration: 0,
            count: 0,
            avgDuration: 0
          };
        }

        stateDurations[state].totalDuration += duration;
        stateDurations[state].count += 1;
      });
    });

    // Calculate averages
    const bottlenecks = Object.values(stateDurations).map(stat => ({
      ...stat,
      avgDuration: stat.totalDuration / stat.count
    }));

    // Sort by average duration (longest first)
    bottlenecks.sort((a, b) => b.avgDuration - a.avgDuration);

    this.setCache(cacheKey, bottlenecks);
    return bottlenecks;
  }

  /**
   * Calculate completion rate
   * @param {string} definitionId - Optional definition ID filter
   * @param {object} timeRange - Optional time range { start, end }
   * @returns {number} Completion rate (0-100)
   */
  getCompletionRate(definitionId, timeRange = null) {
    const cacheKey = `completion_rate_${definitionId}_${JSON.stringify(timeRange)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    let processes = processState.getAllProcesses();

    if (definitionId) {
      processes = processes.filter(p => p.definitionId === definitionId);
    }

    if (timeRange) {
      processes = processes.filter(p => {
        const created = new Date(p.createdAt).getTime();
        return created >= timeRange.start && created <= timeRange.end;
      });
    }

    const completed = processes.filter(p => p.status === PROCESS_STATUS.COMPLETED).length;
    const rate = processes.length > 0 ? (completed / processes.length) * 100 : 0;

    this.setCache(cacheKey, rate);
    return rate;
  }

  /**
   * Get user task load
   * @param {string} userId - User ID
   * @returns {object} Task load metrics
   */
  getUserTaskLoad(userId) {
    const cacheKey = `user_tasks_${userId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const processes = processState.getAllProcesses();

    // Find processes assigned to user or requiring user action
    const assignedProcesses = processes.filter(p => {
      const variables = p.variables || {};
      return variables.assignedTo === userId ||
             variables.assigneeId === userId ||
             variables.approver === userId;
    });

    const result = {
      total: assignedProcesses.length,
      active: assignedProcesses.filter(p => p.status === PROCESS_STATUS.ACTIVE).length,
      pending: assignedProcesses.filter(p => {
        // Processes in states requiring action
        const stateMachine = processService.getStateMachine(p.definitionId);
        if (!stateMachine) return false;

        const stateConfig = stateMachine.getStateConfig(p.currentState);
        return stateConfig?.requiredActions?.length > 0;
      }).length,
      completed: assignedProcesses.filter(p => p.status === PROCESS_STATUS.COMPLETED).length
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get process trend data
   * @param {string} definitionId - Optional definition ID filter
   * @param {string} groupBy - Grouping: 'day', 'week', 'month'
   * @param {object} timeRange - Time range { start, end }
   * @returns {array} Trend data
   */
  getProcessTrend(definitionId = null, groupBy = 'day', timeRange = null) {
    const cacheKey = `trend_${definitionId}_${groupBy}_${JSON.stringify(timeRange)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    let processes = processState.getAllProcesses();

    if (definitionId) {
      processes = processes.filter(p => p.definitionId === definitionId);
    }

    if (timeRange) {
      processes = processes.filter(p => {
        const created = new Date(p.createdAt).getTime();
        return created >= timeRange.start && created <= timeRange.end;
      });
    }

    // Group by time period
    const grouped = {};

    processes.forEach(process => {
      const date = new Date(process.createdAt);
      const key = this.getTimeKey(date, groupBy);

      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          created: 0,
          completed: 0,
          cancelled: 0
        };
      }

      grouped[key].created += 1;

      if (process.status === PROCESS_STATUS.COMPLETED && process.completedAt) {
        const completedDate = new Date(process.completedAt);
        const completedKey = this.getTimeKey(completedDate, groupBy);
        if (grouped[completedKey]) {
          grouped[completedKey].completed += 1;
        }
      }

      if (process.status === PROCESS_STATUS.CANCELLED) {
        grouped[key].cancelled += 1;
      }
    });

    const result = Object.values(grouped).sort((a, b) =>
      a.period.localeCompare(b.period)
    );

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get time key for grouping
   * @param {Date} date - Date to convert
   * @param {string} groupBy - Grouping type
   * @returns {string} Time key
   */
  getTimeKey(date, groupBy) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (groupBy) {
      case 'day':
        return `${year}-${month}-${day}`;
      case 'week':
        const week = this.getWeekNumber(date);
        return `${year}-W${String(week).padStart(2, '0')}`;
      case 'month':
        return `${year}-${month}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  /**
   * Get ISO week number
   * @param {Date} date - Date
   * @returns {number} Week number
   */
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Helper: Get filtered processes
   */
  getFilteredProcesses(filters) {
    let processes = processState.getAllProcesses();

    if (filters.definitionId) {
      processes = processes.filter(p => p.definitionId === filters.definitionId);
    }

    if (filters.status) {
      processes = processes.filter(p => p.status === filters.status);
    }

    if (filters.category) {
      const definitions = processService.getAllDefinitions();
      const defIds = definitions
        .filter(def => def.metadata?.category === filters.category)
        .map(def => def.id);
      processes = processes.filter(p => defIds.includes(p.definitionId));
    }

    if (filters.timeRange) {
      processes = processes.filter(p => {
        const created = new Date(p.createdAt).getTime();
        return created >= filters.timeRange.start && created <= filters.timeRange.end;
      });
    }

    return processes;
  }

  /**
   * Helper: Count processes by status
   */
  countByStatus(processes, status) {
    return processes.filter(p => p.status === status).length;
  }

  /**
   * Helper: Calculate average duration
   */
  calculateAverageDuration(processes) {
    const completed = processes.filter(p =>
      p.status === PROCESS_STATUS.COMPLETED && p.completedAt
    );

    if (completed.length === 0) return 0;

    const totalDuration = completed.reduce((sum, p) => {
      const created = new Date(p.createdAt).getTime();
      const completedAt = new Date(p.completedAt).getTime();
      return sum + (completedAt - created);
    }, 0);

    return totalDuration / completed.length;
  }

  /**
   * Helper: Calculate completion rate
   */
  calculateCompletionRate(processes) {
    if (processes.length === 0) return 0;
    const completed = processes.filter(p => p.status === PROCESS_STATUS.COMPLETED).length;
    return (completed / processes.length) * 100;
  }

  /**
   * Helper: Calculate active rate
   */
  calculateActiveRate(processes) {
    if (processes.length === 0) return 0;
    const active = processes.filter(p => p.status === PROCESS_STATUS.ACTIVE).length;
    return (active / processes.length) * 100;
  }

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > ANALYTICS_CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
    eventBus.emit(EVENTS.ANALYTICS_UPDATED);
  }

  /**
   * Get financial analytics (Phase 5)
   * @param {object} filters - Filter criteria
   * @returns {object} Financial metrics
   */
  getFinancialAnalytics(filters = {}) {
    const cacheKey = `financial_${JSON.stringify(filters)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    let processes = processState.getAllProcesses();

    // Filter for financial processes
    if (!filters.includeAllProcesses) {
      const financialTypes = [
        'financial_invoice', 'financial_expense', 'financial_budget',
        'supply_chain_purchase_order', 'operations_sales_order'
      ];
      processes = processes.filter(p => {
        const def = processService.getDefinition(p.definitionId);
        return def && financialTypes.includes(def.type);
      });
    }

    if (filters.timeRange) {
      processes = processes.filter(p => {
        const created = new Date(p.createdAt).getTime();
        return created >= filters.timeRange.start && created <= filters.timeRange.end;
      });
    }

    // Calculate financial metrics
    const result = {
      totalInvoices: 0,
      totalInvoiceAmount: 0,
      totalExpenses: 0,
      totalExpenseAmount: 0,
      totalBudgetRequests: 0,
      totalBudgetAmount: 0,
      totalPurchaseOrders: 0,
      totalPOAmount: 0,
      totalSalesOrders: 0,
      totalSalesAmount: 0,
      outstandingInvoices: 0,
      outstandingInvoiceAmount: 0,
      pendingExpenses: 0,
      pendingExpenseAmount: 0,
      byCategory: {},
      byStatus: {}
    };

    processes.forEach(process => {
      const def = processService.getDefinition(process.definitionId);
      if (!def) return;

      const amount = process.variables?.amount ||
                    process.variables?.totalAmount ||
                    process.variables?.estimatedBudget ||
                    process.variables?.approvedBudget || 0;

      // Count by type
      switch (def.type) {
        case 'financial_invoice':
          result.totalInvoices++;
          result.totalInvoiceAmount += amount;
          if (process.status === PROCESS_STATUS.ACTIVE) {
            result.outstandingInvoices++;
            result.outstandingInvoiceAmount += amount;
          }
          break;
        case 'financial_expense':
          result.totalExpenses++;
          result.totalExpenseAmount += amount;
          if (process.status === PROCESS_STATUS.ACTIVE) {
            result.pendingExpenses++;
            result.pendingExpenseAmount += amount;
          }
          break;
        case 'financial_budget':
          result.totalBudgetRequests++;
          result.totalBudgetAmount += amount;
          break;
        case 'supply_chain_purchase_order':
          result.totalPurchaseOrders++;
          result.totalPOAmount += amount;
          break;
        case 'operations_sales_order':
          result.totalSalesOrders++;
          result.totalSalesAmount += amount;
          break;
      }

      // Group by category
      const category = def.metadata?.category || 'uncategorized';
      if (!result.byCategory[category]) {
        result.byCategory[category] = { count: 0, amount: 0 };
      }
      result.byCategory[category].count++;
      result.byCategory[category].amount += amount;

      // Group by status
      if (!result.byStatus[process.status]) {
        result.byStatus[process.status] = { count: 0, amount: 0 };
      }
      result.byStatus[process.status].count++;
      result.byStatus[process.status].amount += amount;
    });

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get user productivity analytics (Phase 5)
   * @param {string} userId - Optional user ID filter
   * @param {object} timeRange - Optional time range
   * @returns {object} User productivity metrics
   */
  getUserProductivity(userId = null, timeRange = null) {
    const cacheKey = `productivity_${userId}_${JSON.stringify(timeRange)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    let processes = processState.getAllProcesses();

    if (timeRange) {
      processes = processes.filter(p => {
        const created = new Date(p.createdAt).getTime();
        return created >= timeRange.start && created <= timeRange.end;
      });
    }

    // Group processes by user (from variables)
    const userMetrics = {};

    processes.forEach(process => {
      const history = process.stateHistory || [];

      history.forEach((entry, index) => {
        const user = entry.userId || entry.by || 'system';

        // Skip if filtering for specific user and doesn't match
        if (userId && user !== userId) return;

        if (!userMetrics[user]) {
          userMetrics[user] = {
            userId: user,
            totalActions: 0,
            completedProcesses: 0,
            averageApprovalTime: 0,
            totalApprovalTime: 0,
            approvalCount: 0,
            stateChanges: {}
          };
        }

        userMetrics[user].totalActions++;

        // Track completed processes
        if (entry.to === process.currentState && process.status === PROCESS_STATUS.COMPLETED) {
          userMetrics[user].completedProcesses++;
        }

        // Calculate approval time
        const nextEntry = history[index + 1];
        if (nextEntry && entry.from !== entry.to) {
          const entryTime = new Date(entry.timestamp).getTime();
          const exitTime = new Date(nextEntry.timestamp).getTime();
          const duration = exitTime - entryTime;

          userMetrics[user].totalApprovalTime += duration;
          userMetrics[user].approvalCount++;

          // Track state changes
          const stateKey = `${entry.from}_to_${entry.to}`;
          if (!userMetrics[user].stateChanges[stateKey]) {
            userMetrics[user].stateChanges[stateKey] = {
              count: 0,
              totalTime: 0,
              avgTime: 0
            };
          }
          userMetrics[user].stateChanges[stateKey].count++;
          userMetrics[user].stateChanges[stateKey].totalTime += duration;
        }
      });
    });

    // Calculate averages
    Object.values(userMetrics).forEach(metrics => {
      if (metrics.approvalCount > 0) {
        metrics.averageApprovalTime = metrics.totalApprovalTime / metrics.approvalCount;
      }

      Object.values(metrics.stateChanges).forEach(change => {
        if (change.count > 0) {
          change.avgTime = change.totalTime / change.count;
        }
      });
    });

    const result = userId
      ? userMetrics[userId] || null
      : Object.values(userMetrics).sort((a, b) => b.totalActions - a.totalActions);

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get SLA compliance metrics (Phase 5)
   * @param {object} filters - Filter criteria
   * @returns {object} SLA compliance data
   */
  getSLACompliance(filters = {}) {
    const cacheKey = `sla_${JSON.stringify(filters)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const processes = this.getFilteredProcesses(filters);

    const result = {
      total: processes.length,
      onTime: 0,
      breached: 0,
      atRisk: 0,
      complianceRate: 0,
      averageResponseTime: 0,
      breachesByCategory: {},
      breachesByType: {}
    };

    let totalResponseTime = 0;
    let responseCount = 0;

    processes.forEach(process => {
      const def = processService.getDefinition(process.definitionId);
      if (!def) return;

      // Check if process has SLA deadline
      const deadline = process.variables?.deadline ||
                      process.variables?.dueDate ||
                      process.variables?.slaDeadline ||
                      process.variables?.completionDeadline;

      if (deadline) {
        const deadlineTime = new Date(deadline).getTime();
        const now = Date.now();
        const completedTime = process.completedAt ? new Date(process.completedAt).getTime() : now;

        // Calculate response time
        const createdTime = new Date(process.createdAt).getTime();
        const responseTime = completedTime - createdTime;
        totalResponseTime += responseTime;
        responseCount++;

        // Check SLA compliance
        if (process.status === PROCESS_STATUS.COMPLETED) {
          if (completedTime <= deadlineTime) {
            result.onTime++;
          } else {
            result.breached++;

            // Track breaches by category
            const category = def.metadata?.category || 'uncategorized';
            result.breachesByCategory[category] = (result.breachesByCategory[category] || 0) + 1;

            // Track breaches by type
            result.breachesByType[def.type] = (result.breachesByType[def.type] || 0) + 1;
          }
        } else if (process.status === PROCESS_STATUS.ACTIVE) {
          // Check if at risk
          const timeRemaining = deadlineTime - now;
          const avgDuration = this.getProcessDuration(process.definitionId).average;

          if (timeRemaining < avgDuration * 0.5) {
            result.atRisk++;
          } else {
            result.onTime++;
          }
        }
      }
    });

    result.complianceRate = result.total > 0
      ? (result.onTime / result.total) * 100
      : 0;

    result.averageResponseTime = responseCount > 0
      ? totalResponseTime / responseCount
      : 0;

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get process efficiency report data (Phase 5)
   * @param {object} filters - Filter criteria
   * @returns {object} Efficiency report data
   */
  getProcessEfficiencyReport(filters = {}) {
    const cacheKey = `efficiency_report_${JSON.stringify(filters)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const processes = this.getFilteredProcesses(filters);
    const definitions = processService.getAllDefinitions();

    const efficiencyByType = {};

    definitions.forEach(def => {
      const typeProcesses = processes.filter(p => p.definitionId === def.id);
      if (typeProcesses.length === 0) return;

      const completed = typeProcesses.filter(p => p.status === PROCESS_STATUS.COMPLETED);
      const durations = completed.map(p => {
        const created = new Date(p.createdAt).getTime();
        const completedAt = new Date(p.completedAt).getTime();
        return completedAt - created;
      });

      const bottlenecks = this.getBottlenecks(def.id);

      efficiencyByType[def.id] = {
        definitionId: def.id,
        name: def.name,
        type: def.type,
        category: def.metadata?.category || 'uncategorized',
        total: typeProcesses.length,
        completed: completed.length,
        completionRate: typeProcesses.length > 0
          ? (completed.length / typeProcesses.length) * 100
          : 0,
        avgDuration: durations.length > 0
          ? durations.reduce((sum, d) => sum + d, 0) / durations.length
          : 0,
        minDuration: durations.length > 0 ? Math.min(...durations) : 0,
        maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
        topBottleneck: bottlenecks[0] || null
      };
    });

    const result = {
      summary: {
        totalProcessTypes: Object.keys(efficiencyByType).length,
        totalProcesses: processes.length,
        averageCompletionRate: Object.values(efficiencyByType).length > 0
          ? Object.values(efficiencyByType).reduce((sum, e) => sum + e.completionRate, 0) / Object.values(efficiencyByType).length
          : 0
      },
      byType: Object.values(efficiencyByType).sort((a, b) => b.total - a.total)
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Generate workload distribution data (Phase 5)
   * @returns {array} Workload by user
   */
  getWorkloadDistribution() {
    const cacheKey = 'workload_distribution';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const processes = processState.getAllProcesses();
    const workload = {};

    processes.forEach(process => {
      // Extract user IDs from various fields
      const users = new Set();

      const variables = process.variables || {};
      [
        'assignedTo', 'assigneeId', 'approver', 'createdBy',
        'managerId', 'ownerId', 'reviewerId'
      ].forEach(field => {
        if (variables[field]) users.add(variables[field]);
      });

      // Also check state history
      if (process.stateHistory) {
        process.stateHistory.forEach(entry => {
          if (entry.userId) users.add(entry.userId);
          if (entry.by) users.add(entry.by);
        });
      }

      // Count processes for each user
      users.forEach(userId => {
        if (!workload[userId]) {
          workload[userId] = {
            userId,
            totalProcesses: 0,
            activeProcesses: 0,
            completedProcesses: 0,
            pendingActions: 0
          };
        }

        workload[userId].totalProcesses++;

        if (process.status === PROCESS_STATUS.ACTIVE) {
          workload[userId].activeProcesses++;

          // Check if action is required
          const def = processService.getDefinition(process.definitionId);
          if (def) {
            const stateMachine = processService.getStateMachine(process.definitionId);
            if (stateMachine) {
              const stateConfig = stateMachine.getStateConfig(process.currentState);
              if (stateConfig?.requiredActions?.length > 0) {
                workload[userId].pendingActions++;
              }
            }
          }
        } else if (process.status === PROCESS_STATUS.COMPLETED) {
          workload[userId].completedProcesses++;
        }
      });
    });

    const result = Object.values(workload).sort((a, b) => b.totalProcesses - a.totalProcesses);

    this.setCache(cacheKey, result);
    return result;
  }
}

// Create singleton instance
export const analyticsService = new AnalyticsService();

export default analyticsService;
