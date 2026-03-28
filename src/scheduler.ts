import cron from "node-cron";
import { fetchRemainingWeekEvents } from "./calendar";
import { formatWeeklyDigest } from "./formatter";
import { broadcastMessage } from "./whatsapp";
import { config } from "./config";
import { logger } from "./logger";

export async function runWeeklyDigest(): Promise<void> {
  logger.info("Running weekly calendar digest...");

  try {
    const events = await fetchRemainingWeekEvents();
    const message = formatWeeklyDigest(events);

    logger.debug({ message }, "Formatted message");
    await broadcastMessage(config.recipients, message);

    logger.info(
      { recipientCount: config.recipients.length, eventCount: events.length },
      "Weekly digest sent successfully"
    );
  } catch (error) {
    logger.error({ error }, "Failed to run weekly digest");
  }
}

export function startScheduler(): void {
  const { cronSchedule, timezone } = config;

  if (!cron.validate(cronSchedule)) {
    throw new Error(`Invalid CRON_SCHEDULE: "${cronSchedule}"`);
  }

  logger.info({ cronSchedule, timezone }, "Scheduler started");

  cron.schedule(cronSchedule, () => {
    logger.info("Cron triggered — running weekly digest");
    runWeeklyDigest();
  }, { timezone });
}
