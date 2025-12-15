/**
 * Condition Evaluator
 * Evaluates conditions for auto-transitions and decision gateways
 */

import { hasPermission } from '../../utils/helpers.js';

class ConditionEvaluator {
  constructor() {
    this.operators = {
      // Comparison operators
      eq: (a, b) => a === b,
      ne: (a, b) => a !== b,
      gt: (a, b) => a > b,
      gte: (a, b) => a >= b,
      lt: (a, b) => a < b,
      lte: (a, b) => a <= b,

      // String operators
      contains: (a, b) => String(a).includes(String(b)),
      startsWith: (a, b) => String(a).startsWith(String(b)),
      endsWith: (a, b) => String(a).endsWith(String(b)),
      matches: (a, pattern) => new RegExp(pattern).test(String(a)),

      // Array operators
      in: (a, array) => Array.isArray(array) && array.includes(a),
      notIn: (a, array) => Array.isArray(array) && !array.includes(a),

      // Existence operators
      exists: (a) => a !== null && a !== undefined,
      notExists: (a) => a === null || a === undefined,

      // Type operators
      isString: (a) => typeof a === 'string',
      isNumber: (a) => typeof a === 'number',
      isBoolean: (a) => typeof a === 'boolean',
      isArray: (a) => Array.isArray(a),
      isObject: (a) => typeof a === 'object' && a !== null && !Array.isArray(a),

      // Logical operators
      and: (...conditions) => conditions.every(c => c === true),
      or: (...conditions) => conditions.some(c => c === true),
      not: (condition) => !condition
    };
  }

  /**
   * Evaluate a single condition
   */
  evaluateCondition(condition, processInstance, context = {}) {
    const { type, operator, field, value, compareField } = condition;

    try {
      // Handle different condition types
      switch (type) {
        case 'variable':
          return this.evaluateVariableCondition(condition, processInstance);

        case 'state':
          return this.evaluateStateCondition(condition, processInstance);

        case 'time':
          return this.evaluateTimeCondition(condition, processInstance);

        case 'custom':
          return this.evaluateCustomCondition(condition, processInstance, context);

        case 'permission':
          return this.evaluatePermissionCondition(condition, context);

        case 'expression':
          return this.evaluateExpression(condition, processInstance, context);

        default:
          console.warn(`Unknown condition type: ${type}`);
          return false;
      }
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  /**
   * Evaluate variable condition
   */
  evaluateVariableCondition(condition, processInstance) {
    const { field, operator, value, compareField } = condition;

    // Get field value from process variables
    const fieldValue = this.getNestedValue(processInstance.variables, field);

    // Get comparison value
    let compareValue = value;
    if (compareField) {
      compareValue = this.getNestedValue(processInstance.variables, compareField);
    }

    // Get operator function
    const operatorFn = this.operators[operator];
    if (!operatorFn) {
      console.warn(`Unknown operator: ${operator}`);
      return false;
    }

    // Evaluate condition
    return operatorFn(fieldValue, compareValue);
  }

  /**
   * Evaluate state condition
   */
  evaluateStateCondition(condition, processInstance) {
    const { operator, value } = condition;

    const currentState = processInstance.currentState;

    const operatorFn = this.operators[operator];
    if (!operatorFn) {
      console.warn(`Unknown operator: ${operator}`);
      return false;
    }

    return operatorFn(currentState, value);
  }

  /**
   * Evaluate time-based condition
   */
  evaluateTimeCondition(condition, processInstance) {
    const { operator, field, value, unit = 'milliseconds' } = condition;

    // Get time field (e.g., createdAt, updatedAt, or custom field)
    const timeValue = this.getNestedValue(processInstance, field);

    if (!timeValue) {
      return false;
    }

    const timestamp = new Date(timeValue).getTime();
    const now = Date.now();

    // Convert value to milliseconds based on unit
    let milliseconds = value;
    switch (unit) {
      case 'seconds':
        milliseconds = value * 1000;
        break;
      case 'minutes':
        milliseconds = value * 60 * 1000;
        break;
      case 'hours':
        milliseconds = value * 60 * 60 * 1000;
        break;
      case 'days':
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
    }

    // Calculate elapsed time
    const elapsed = now - timestamp;

    // Evaluate condition
    const operatorFn = this.operators[operator];
    if (!operatorFn) {
      console.warn(`Unknown operator: ${operator}`);
      return false;
    }

    return operatorFn(elapsed, milliseconds);
  }

  /**
   * Evaluate custom condition (using function)
   */
  evaluateCustomCondition(condition, processInstance, context) {
    const { fn } = condition;

    if (typeof fn === 'function') {
      return fn(processInstance, context);
    }

    console.warn('Custom condition must have a function');
    return false;
  }

  /**
   * Evaluate permission condition
   */
  evaluatePermissionCondition(condition, context) {
    const { requiredRole } = condition;
    const { userRole } = context;

    if (!userRole || !requiredRole) {
      return false;
    }

    return hasPermission(userRole, requiredRole);
  }

  /**
   * Evaluate expression condition (combines multiple conditions)
   */
  evaluateExpression(condition, processInstance, context) {
    const { expression, conditions } = condition;

    if (!expression || !conditions) {
      console.warn('Expression condition must have expression and conditions');
      return false;
    }

    // Evaluate all sub-conditions
    const results = conditions.map(c =>
      this.evaluateCondition(c, processInstance, context)
    );

    // Handle logical expression
    switch (expression) {
      case 'and':
        return results.every(r => r === true);

      case 'or':
        return results.some(r => r === true);

      case 'not':
        return !results[0];

      default:
        console.warn(`Unknown expression: ${expression}`);
        return false;
    }
  }

  /**
   * Evaluate multiple conditions
   */
  evaluateConditions(conditions, processInstance, context = {}, operator = 'and') {
    if (!Array.isArray(conditions) || conditions.length === 0) {
      return true; // No conditions = always true
    }

    const results = conditions.map(condition =>
      this.evaluateCondition(condition, processInstance, context)
    );

    // Apply logical operator
    switch (operator) {
      case 'and':
        return results.every(r => r === true);

      case 'or':
        return results.some(r => r === true);

      case 'not':
        return !results[0];

      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    if (!path || !obj) {
      return undefined;
    }

    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }

      value = value[key];
    }

    return value;
  }

  /**
   * Register custom operator
   */
  registerOperator(name, fn) {
    if (typeof fn !== 'function') {
      throw new Error('Operator must be a function');
    }

    this.operators[name] = fn;
    console.log(`Custom operator registered: ${name}`);
  }

  /**
   * Get all registered operators
   */
  getOperators() {
    return Object.keys(this.operators);
  }

  /**
   * Check if transition conditions are met
   */
  canTransition(processInstance, targetState, transitionConditions, context = {}) {
    if (!transitionConditions || transitionConditions.length === 0) {
      return { allowed: true };
    }

    // Evaluate all transition conditions
    const allowed = this.evaluateConditions(
      transitionConditions,
      processInstance,
      context,
      'and' // All conditions must be met
    );

    if (!allowed) {
      return {
        allowed: false,
        reason: 'Transition conditions not met'
      };
    }

    return { allowed: true };
  }

  /**
   * Find matching auto-transition
   */
  findMatchingAutoTransition(autoTransitionConfig, processInstance, context = {}) {
    if (!autoTransitionConfig || !autoTransitionConfig.conditions) {
      return null;
    }

    const { conditions } = autoTransitionConfig;

    // Find first condition that matches
    for (const condition of conditions) {
      // Skip timer-based transitions (handled by TransitionEngine)
      if (condition.type === 'timer') {
        continue;
      }

      // Check if condition matches
      const matches = this.evaluateCondition(condition, processInstance, context);

      if (matches) {
        return {
          toState: condition.toState,
          condition: condition
        };
      }
    }

    return null;
  }

  /**
   * Validate condition structure
   */
  validateCondition(condition) {
    if (!condition || typeof condition !== 'object') {
      return { valid: false, error: 'Condition must be an object' };
    }

    if (!condition.type) {
      return { valid: false, error: 'Condition must have a type' };
    }

    switch (condition.type) {
      case 'variable':
        if (!condition.field || !condition.operator) {
          return {
            valid: false,
            error: 'Variable condition must have field and operator'
          };
        }
        break;

      case 'state':
        if (!condition.operator || !condition.value) {
          return {
            valid: false,
            error: 'State condition must have operator and value'
          };
        }
        break;

      case 'time':
        if (!condition.field || !condition.operator || condition.value === undefined) {
          return {
            valid: false,
            error: 'Time condition must have field, operator, and value'
          };
        }
        break;

      case 'custom':
        if (!condition.fn || typeof condition.fn !== 'function') {
          return {
            valid: false,
            error: 'Custom condition must have a function'
          };
        }
        break;

      case 'expression':
        if (!condition.expression || !condition.conditions) {
          return {
            valid: false,
            error: 'Expression condition must have expression and conditions'
          };
        }
        break;
    }

    return { valid: true };
  }
}

// Create singleton instance
export const conditionEvaluator = new ConditionEvaluator();

export default conditionEvaluator;
