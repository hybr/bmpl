/**
 * Base Store Class
 * Event-driven state management without frameworks
 */

import { eventBus } from '../utils/events.js';

class Store extends EventTarget {
  /**
   * Create a store
   * @param {Object} initialState - Initial state
   */
  constructor(initialState = {}) {
    super();
    this._state = initialState;
    this._subscribers = new Set();
  }

  /**
   * Get current state (read-only)
   * @returns {Object} Current state
   */
  get state() {
    // Return a frozen copy to prevent direct mutation
    return Object.freeze({ ...this._state });
  }

  /**
   * Set state (merges with existing state)
   * @param {Object} newState - New state to merge
   */
  setState(newState) {
    const oldState = this._state;
    this._state = { ...this._state, ...newState };

    // Emit state change event
    this.dispatchEvent(
      new CustomEvent('statechange', {
        detail: { oldState, newState: this._state }
      })
    );

    // Notify subscribers
    this._subscribers.forEach(callback => {
      try {
        callback(this._state, oldState);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  }

  /**
   * Replace entire state
   * @param {Object} newState - New state
   */
  replaceState(newState) {
    const oldState = this._state;
    this._state = newState;

    this.dispatchEvent(
      new CustomEvent('statechange', {
        detail: { oldState, newState: this._state }
      })
    );

    this._subscribers.forEach(callback => {
      try {
        callback(this._state, oldState);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback function (newState, oldState)
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this._subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this._subscribers.delete(callback);
    };
  }

  /**
   * Reset state to initial values
   * @param {Object} initialState - Initial state
   */
  reset(initialState = {}) {
    this.replaceState(initialState);
  }

  /**
   * Get a specific value from state
   * @param {string} key - State key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} State value
   */
  get(key, defaultValue = null) {
    return this._state[key] !== undefined ? this._state[key] : defaultValue;
  }

  /**
   * Check if state has a key
   * @param {string} key - State key
   * @returns {boolean} Has key
   */
  has(key) {
    return key in this._state;
  }

  /**
   * Emit a custom event on the global event bus
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emitEvent(event, data) {
    eventBus.emit(event, data);
  }
}

export default Store;
