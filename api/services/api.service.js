/**
 * API Gateway Service
 * HTTP entry point for all requests
 */

const ApiGateway = require("moleculer-web");
const { authenticate, optionalAuth } = require("../middlewares/auth.middleware");

module.exports = {
  name: "api",
  mixins: [ApiGateway],

  settings: {
    // Exposed port
    port: process.env.PORT || 3000,

    // Exposed IP
    ip: "0.0.0.0",

    // Global Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
    use: [],

    // Routes
    routes: [
      {
        path: "/api",

        whitelist: [
          "**"
        ],

        // Route-level Express middlewares
        use: [],

        // Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
        mergeParams: true,

        // Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
        authentication: false,

        // Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
        authorization: false,

        // The auto-alias feature allows you to declare your route alias directly in your services.
        // The gateway will dynamically build the full routes from service schema.
        autoAliases: true,

        aliases: {
          // Authentication endpoints (no auth required)
          "POST /auth/login": "auth.login",
          "POST /auth/register": "auth.register",

          // User endpoints (authenticated)
          "POST /users/search": {
            action: "users.search",
            onBeforeCall: authenticate
          },
          "GET /users/:id": {
            action: "users.get",
            onBeforeCall: authenticate
          },

          // Organization endpoints (authenticated)
          "POST /organizations/search": {
            action: "organizations.search",
            onBeforeCall: authenticate
          },
          "GET /organizations/:id": {
            action: "organizations.get",
            onBeforeCall: authenticate
          },
          "GET /organizations/user-memberships": {
            action: "organizations.getUserMemberships",
            onBeforeCall: authenticate
          },

          // Common data endpoints (public - no auth required for reference data)
          "GET /common/legal-types": "common.getLegalTypes",
          "GET /common/legal-types/:id": "common.getLegalType"
        },

        // Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
        callingOptions: {},

        bodyParsers: {
          json: {
            strict: false,
            limit: "1MB"
          },
          urlencoded: {
            extended: true,
            limit: "1MB"
          }
        },

        // Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
        mappingPolicy: "all",

        // Enable/disable logging
        logging: true
      }
    ],

    // Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
    log4XXResponses: false,

    // Logging the request parameters. Set to any log level to enable it. E.g. "info"
    logRequestParams: "info",

    // Logging the response data. Set to any log level to enable it. E.g. "info"
    logResponseData: "info",

    // Serve assets from "public" folder. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Serve-static-files
    assets: {
      folder: "public",
      options: {}
    },

    // CORS settings
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "OPTIONS", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: [],
      credentials: true,
      maxAge: 3600
    }
  },

  methods: {
    /**
     * Authenticate the request. It checks the `Authorization` token value in the request header.
     * Check the token value & resolve the user by the token.
     * The resolved user will be available in `ctx.meta.user`
     */
    async authenticate(ctx, route, req) {
      // Implement JWT authentication
      const auth = req.headers["authorization"];
      if (auth && auth.startsWith("Bearer")) {
        const token = auth.slice(7);
        // Verify token and set user in ctx.meta
      }
    },

    /**
     * Authorize the request. Check that the authenticated user has right to access the resource.
     */
    async authorize(ctx, route, req) {
      // Get the authenticated user
      let user = ctx.meta.user;

      // Check authorization here
      // If not authorized, throw an error
    }
  }
};
