/**
 * Authentication Service
 * Handles user login, registration, and JWT token generation
 */

const jwt = require('jsonwebtoken');
const nano = require('nano');

module.exports = {
  name: "auth",

  settings: {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    COUCHDB_URL: process.env.COUCHDB_URL,
    DB_USERS: process.env.DB_USERS || 'bmpl_users'
  },

  /**
   * Service dependencies
   */
  dependencies: [],

  /**
   * Actions
   */
  actions: {
    /**
     * User login
     * @param {string} username - Username or email
     * @param {string} password - Password
     * @returns {object} - User object and JWT token
     */
    login: {
      rest: "POST /login",
      params: {
        username: { type: "string", min: 3 },
        password: { type: "string", min: 6 }
      },
      async handler(ctx) {
        const { username, password } = ctx.params;

        try {
          // Get user from CouchDB
          const user = await this.getUserByUsername(username);

          if (!user) {
            throw new Error('User not found');
          }

          // Verify password (in production, use bcrypt)
          // For now, assuming password is stored as plain text (CHANGE IN PRODUCTION)
          if (user.password !== password) {
            throw new Error('Invalid password');
          }

          // Generate JWT token
          const token = this.generateToken(user);

          // Return user info (without password) and token
          const { password: _, ...userWithoutPassword } = user;

          return {
            success: true,
            user: userWithoutPassword,
            token,
            expiresIn: this.settings.JWT_EXPIRES_IN
          };
        } catch (error) {
          this.logger.error('Login error:', error);
          return {
            success: false,
            error: error.message
          };
        }
      }
    },

    /**
     * User registration
     * @param {object} userData - User data (username, email, password, name)
     * @returns {object} - Created user and JWT token
     */
    register: {
      rest: "POST /register",
      params: {
        username: { type: "string", min: 3 },
        email: { type: "email" },
        password: { type: "string", min: 6 },
        name: { type: "string", min: 2 }
      },
      async handler(ctx) {
        const { username, email, password, name } = ctx.params;

        try {
          // Check if user already exists
          const existingUser = await this.getUserByUsername(username);
          if (existingUser) {
            throw new Error('Username already exists');
          }

          // Create user document
          const userId = `user:${username.toLowerCase()}`;
          const userDoc = {
            _id: userId,
            type: 'user',
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            name,
            password, // In production, hash with bcrypt
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Save to CouchDB
          const db = this.getDatabase();
          const result = await db.insert(userDoc);

          // Generate JWT token
          const token = this.generateToken({ ...userDoc, _rev: result.rev });

          // Return user info (without password) and token
          const { password: _, ...userWithoutPassword } = userDoc;

          return {
            success: true,
            user: { ...userWithoutPassword, _rev: result.rev },
            token,
            expiresIn: this.settings.JWT_EXPIRES_IN
          };
        } catch (error) {
          this.logger.error('Registration error:', error);
          return {
            success: false,
            error: error.message
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
     * Get user by username
     */
    async getUserByUsername(username) {
      try {
        const db = this.getDatabase();
        const userId = `user:${username.toLowerCase()}`;
        const user = await db.get(userId);
        return user;
      } catch (error) {
        if (error.statusCode === 404) {
          return null;
        }
        throw error;
      }
    },

    /**
     * Generate JWT token for user
     */
    generateToken(user) {
      const payload = {
        userId: user._id,
        username: user.username,
        email: user.email
      };

      return jwt.sign(payload, this.settings.JWT_SECRET, {
        expiresIn: this.settings.JWT_EXPIRES_IN
      });
    }
  },

  /**
   * Service created lifecycle event handler
   */
  created() {
    this.logger.info("Auth service created");
  },

  /**
   * Service started lifecycle event handler
   */
  async started() {
    this.logger.info("Auth service started");
  },

  /**
   * Service stopped lifecycle event handler
   */
  async stopped() {
    this.logger.info("Auth service stopped");
  }
};
