import cron from "node-cron";
import { fetchEventsByWeek } from "./calendar";
import { formatWeeklyDigest } from "./formatter";
import { broadcastMessage } from "./whatsapp";
import { config } from "./config";
import { logger } from "./logger";

export async function runWeeklyDigest(): Promise<void> {
  logger.info("Running weekly calendar digest...");

  try {
    const weekGroups = await fetchEventsByWeek();

    for (const { weekStart, weekEnd, events } of weekGroups) {
      const message = formatWeeklyDigest(events, weekStart, weekEnd);
      logger.debug({ weekStart, weekEnd, eventCount: events.length }, "Sending week digest");
      await broadcastMessage(config.recipients, message);
    }

    const totalEvents = weekGroups.reduce((sum, g) => sum + g.events.length, 0);
    logger.info(
      { recipientCount: config.recipients.length, weeks: weekGroups.length, totalEvents },
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
