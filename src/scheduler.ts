import cron from "node-cron";
import { fetchTodayEvents } from "./calendar";
import { formatDailyDigest } from "./formatter";
import { broadcastMessage } from "./whatsapp";
import { config } from "./config";
import { logger } from "./logger";

export async function runDailyDigest(): Promise<void> {
  logger.info("Running daily calendar digest...");

  try {
    const events = await fetchTodayEvents();
    const message = formatDailyDigest(events);

    logger.debug({ message }, "Formatted message");
    await broadcastMessage(config.recipients, message);

    logger.info(
      { recipientCount: config.recipients.length, eventCount: events.length },
      "Daily digest sent successfully"
    );
  } catch (error) {
    logger.error({ error }, "Failed to run daily digest");
  }
}

export function startScheduler(): void {
  const { cronSchedule, timezone } = config;

  if (!cron.validate(cronSchedule)) {
    throw new Error(`Invalid CRON_SCHEDULE: "${cronSchedule}"`);
  }

  logger.info({ cronSchedule, timezone }, "Scheduler started");

  cron.schedule(cronSchedule, () => {
    logger.info("Cron triggered — running daily digest");
    runDailyDigest();
  }, { timezone });
}
