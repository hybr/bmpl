/**
 * Moleculer Microservices Entry Point
 * Starts the ServiceBroker and loads all services
 */

require('dotenv').config();
const { ServiceBroker } = require("moleculer");
const path = require('path');

// Create broker
const broker = new ServiceBroker({
  ...require("./moleculer.config.js"),
  logger: {
    type: "Console",
    options: {
      level: "info",
      colors: true,
      moduleColors: true,
      formatter: "full",
      autoPadding: true
    }
  }
});

// Load services
broker.loadServices(path.join(__dirname, "services"), "**/*.service.js");

// Start broker
broker.start()
  .then(() => {
    broker.logger.info("✅ Moleculer broker started successfully");
    broker.logger.info(`🌐 API Gateway listening on http://localhost:${process.env.PORT || 3000}`);
    broker.logger.info("📡 Available endpoints:");
    broker.logger.info("   POST /api/auth/login");
    broker.logger.info("   POST /api/auth/register");
    broker.logger.info("   POST /api/users/search");
    broker.logger.info("   GET  /api/users/:id");
    broker.logger.info("   POST /api/organizations/search");
    broker.logger.info("   GET  /api/organizations/:id");
    broker.logger.info("   GET  /api/organizations/user-memberships");
    broker.logger.info("   GET  /api/common/legal-types");
  })
  .catch(err => {
    broker.logger.error("❌ Error starting Moleculer broker:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  broker.logger.info("🛑 Shutting down Moleculer broker...");
  await broker.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  broker.logger.info("🛑 Shutting down Moleculer broker...");
  await broker.stop();
  process.exit(0);
});
