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

export interface WeekGroup {
  weekStart: Date;
  weekEnd: Date;
  events: CalendarEvent[];
}

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: config.googleCredentialsPath,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
  return auth.getClient();
}

function getMondayOfWeek(date: Date): Date {
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(date);
  monday.setDate(date.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getWeekGroups(weeksAhead: number): { weekStart: Date; weekEnd: Date }[] {
  const monday = getMondayOfWeek(new Date());
  const groups = [];
  for (let i = 0; i < weeksAhead; i++) {
    const weekStart = new Date(monday);
    weekStart.setDate(monday.getDate() + i * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    groups.push({ weekStart, weekEnd });
  }
  return groups;
}

function mapEvent(item: any): CalendarEvent {
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
}

export async function fetchEventsByWeek(): Promise<WeekGroup[]> {
  const auth = await getAuthClient();
  const calendar = google.calendar({ version: "v3", auth: auth as any });

  const now = new Date();
  const weekGroups = getWeekGroups(config.weeksAhead);
  const endDate = weekGroups[weekGroups.length - 1].weekEnd;

  logger.info(
    { calendarId: config.calendarId, weeksAhead: config.weeksAhead, endDate },
    "Fetching upcoming events"
  );

  const response = await calendar.events.list({
    calendarId: config.calendarId,
    timeMin: now.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const items = response.data.items ?? [];
  logger.info({ count: items.length }, "Events fetched from Google Calendar");

  const events = items.map(mapEvent);

  return weekGroups.map(({ weekStart, weekEnd }) => ({
    weekStart,
    weekEnd,
    events: events.filter((e) => e.start >= weekStart && e.start <= weekEnd),
  }));
}
