/**
 * Users Service
 * Handles user search and retrieval operations
 */

const nano = require('nano');

module.exports = {
  name: "users",

  settings: {
    COUCHDB_URL: process.env.COUCHDB_URL,
    DB_USERS: process.env.DB_USERS || 'bmpl_users'
  },

  /**
   * Actions
   */
  actions: {
    /**
     * Search users by query
     * @param {string} query - Search query (username, email, or name)
     * @param {number} limit - Maximum results to return (default: 10)
     * @returns {array} - Array of matching users
     */
    search: {
      rest: "POST /search",
      params: {
        query: { type: "string", min: 2 },
        limit: { type: "number", optional: true, default: 10, max: 50 }
      },
      async handler(ctx) {
        const { query, limit } = ctx.params;
        const lowerQuery = query.toLowerCase().trim();

        try {
          const db = this.getDatabase();

          // Use Mango query to search users
          const result = await db.find({
            selector: {
              type: 'user',
              $or: [
                { username: { $regex: `(?i)${lowerQuery}` } },
                { email: { $regex: `(?i)${lowerQuery}` } },
                { name: { $regex: `(?i)${lowerQuery}` } }
              ]
            },
            limit: limit
          });

          // Remove password from results
          const users = result.docs.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
          });

          return {
            success: true,
            users
          };
        } catch (error) {
          this.logger.error('User search error:', error);

          // Fallback to manual search if $regex not supported
          try {
            const users = await this.searchFallback(lowerQuery, limit);
            return {
              success: true,
              users
            };
          } catch (fallbackError) {
            this.logger.error('User search fallback error:', fallbackError);
            return {
              success: false,
              error: fallbackError.message,
              users: []
            };
          }
        }
      }
    },

    /**
     * Get user by ID
     * @param {string} id - User ID (e.g., "user:johndoe")
     * @returns {object} - User object
     */
    get: {
      rest: "GET /:id",
      params: {
        id: { type: "string", min: 5 }
      },
      async handler(ctx) {
        const { id } = ctx.params;

        try {
          const db = this.getDatabase();
          const user = await db.get(id);

          // Remove password from response
          const { password, ...userWithoutPassword } = user;

          return {
            success: true,
            user: userWithoutPassword
          };
        } catch (error) {
          this.logger.error('Get user error:', error);
          return {
            success: false,
            error: error.statusCode === 404 ? 'User not found' : error.message
          };
        }
      }
    }
  },

  /**
   * Methods
   */
  methods: {
    /**
     * Get CouchDB database connection
     */
    getDatabase() {
      if (!this.db) {
        const couchdb = nano(this.settings.COUCHDB_URL);
        this.db = couchdb.db.use(this.settings.DB_USERS);
      }
      return this.db;
    },

    /**
     * Fallback search when regex is not supported
     * Fetches all users and filters client-side
     */
    async searchFallback(query, limit) {
      const db = this.getDatabase();

      // Get all users
      const result = await db.find({
        selector: {
          type: 'user'
        },
        limit: 1000 // Reasonable limit to avoid memory issues
      });

      // Filter client-side
      const filtered = result.docs.filter(user => {
        const searchStr = [
          user.username || '',
          user.email || '',
          user.name || ''
        ].join(' ').toLowerCase();
        return searchStr.includes(query);
      });

      // Remove passwords and limit results
      return filtered.slice(0, limit).map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    }
  },

  /**
   * Service created lifecycle event handler
   */
  created() {
    this.logger.info("Users service created");
  },

  /**
   * Service started lifecycle event handler
   */
  async started() {
    this.logger.info("Users service started");
  },

  /**
   * Service stopped lifecycle event handler
   */
  async stopped() {
    this.logger.info("Users service stopped");
  }
};
