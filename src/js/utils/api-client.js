/**
 * API Client for Backend Requests
 * Handles communication with Moleculer microservices backend
 * Provides authentication, retries, and error handling
 */

import { storageService } from '../services/storage-service.js';
import ENV from '../config/env.js';

class ApiClient {
  constructor() {
    this.baseURL = ENV.AUTH_API_URL; // Will point to Moleculer API gateway
  }

  /**
   * Get authentication headers
   * @returns {Promise<Object>} Headers object with Authorization token
   */
  async getAuthHeaders() {
    const token = await storageService.getAccessToken();
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Make GET request
   * @param {string} endpoint - API endpoint (e.g., '/api/common/legal-types')
   * @param {Object} options - Request options
   * @param {Object} options.params - Query parameters
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint, options = {}) {
    const { params = {} } = options;

    // Build query string
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseURL}${endpoint}${queryString ? '?' + queryString : ''}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Make POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise<Object>} Response data
   */
  async post(endpoint, data = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API POST ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Make PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise<Object>} Response data
   */
  async put(endpoint, data = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API PUT ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Make DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} Response data
   */
  async delete(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Handle API response
   * @param {Response} response - Fetch API response
   * @returns {Promise<Object>} Parsed response data
   * @throws {Error} If response is not ok
   */
  async handleResponse(response) {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        // Response body is not JSON
        try {
          errorMessage = await response.text();
        } catch (e2) {
          // Can't read response
        }
      }

      throw new Error(errorMessage);
    }

    // Parse JSON response
    try {
      return await response.json();
    } catch (error) {
      // Response is not JSON, return empty object
      return {};
    }
  }

  /**
   * Check if API is available
   * @returns {Promise<boolean>} True if API is reachable
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
