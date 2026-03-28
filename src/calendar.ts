import { google } from "googleapis";
import { config } from "./config";
import { logger } from "./logger";

export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  isAllDay: boolean;
}

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: config.googleCredentialsPath,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
  return auth.getClient();
}

function getWeekBounds(now: Date): { start: Date; end: Date } {
  // Week is Monday–Sunday
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

export async function fetchRemainingWeekEvents(): Promise<CalendarEvent[]> {
  const auth = await getAuthClient();
  const calendar = google.calendar({ version: "v3", auth: auth as any });

  const now = new Date();
  const { end: endOfWeek } = getWeekBounds(now);

  logger.info({ calendarId: config.calendarId }, "Fetching remaining week events");

  const response = await calendar.events.list({
    calendarId: config.calendarId,
    timeMin: now.toISOString(),
    timeMax: endOfWeek.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const items = response.data.items ?? [];
  logger.info({ count: items.length }, "Week events fetched from Google Calendar");

  return items.map((item): CalendarEvent => {
    const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);

    const start = isAllDay
      ? new Date(`${item.start!.date}T00:00:00`)
      : new Date(item.start!.dateTime!);

    const end = isAllDay
      ? new Date(`${item.end!.date}T00:00:00`)
      : new Date(item.end!.dateTime!);

    return {
      title: item.summary ?? "(No title)",
      start,
      end,
      location: item.location ?? undefined,
      description: item.description ?? undefined,
      isAllDay,
    };
  });
}

export async function fetchTodayEvents(): Promise<CalendarEvent[]> {
  const auth = await getAuthClient();
  const calendar = google.calendar({ version: "v3", auth: auth as any });

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  logger.info({ calendarId: config.calendarId }, "Fetching calendar events");

  const response = await calendar.events.list({
    calendarId: config.calendarId,
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const items = response.data.items ?? [];
  logger.info({ count: items.length }, "Events fetched from Google Calendar");

  return items.map((item): CalendarEvent => {
    const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);

    const start = isAllDay
      ? new Date(`${item.start!.date}T00:00:00`)
      : new Date(item.start!.dateTime!);

    const end = isAllDay
      ? new Date(`${item.end!.date}T00:00:00`)
      : new Date(item.end!.dateTime!);

    return {
      title: item.summary ?? "(No title)",
      start,
      end,
      location: item.location ?? undefined,
      description: item.description ?? undefined,
      isAllDay,
    };
  });
}
