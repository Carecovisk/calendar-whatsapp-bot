import { initWhatsApp } from "./whatsapp";
import { startScheduler, runDailyDigest } from "./scheduler";
import { logger } from "./logger";

async function main() {
  logger.info("🤖 Calendar WhatsApp Bot starting...");

  // 1. Connect to WhatsApp (blocks until QR scanned and connected)
  await initWhatsApp();

  // 2. Optionally run once immediately on startup (useful for testing)
  if (process.argv.includes("--run-now")) {
    logger.info("--run-now flag detected, sending digest immediately");
    await runDailyDigest();
  }

  // 3. Start the cron scheduler
  startScheduler();

  logger.info("✅ Bot is running. Waiting for scheduled trigger...");

  // Keep process alive
  process.on("SIGINT", () => {
    logger.info("Received SIGINT, shutting down gracefully");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    logger.info("Received SIGTERM, shutting down gracefully");
    process.exit(0);
  });

  process.on("uncaughtException", (error) => {
    logger.error({ error }, "Uncaught exception");
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled promise rejection");
    process.exit(1);
  });
}

main().catch((error) => {
  logger.error({ error }, "Fatal error during startup");
  process.exit(1);
});
