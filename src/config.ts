import * as dotenv from "dotenv";
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  cronSchedule: process.env.CRON_SCHEDULE || "0 7 * * *",
  timezone: process.env.TZ || "America/Sao_Paulo",
  calendarId: requireEnv("CALENDAR_ID"),
  googleCredentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || "./credentials.json",
  recipients: requireEnv("RECIPIENTS")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean),
  waAuthFolder: process.env.WA_AUTH_FOLDER || "./auth_info",
  logLevel: process.env.LOG_LEVEL || "info",
} as const;
