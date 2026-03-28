import { CalendarEvent } from "./calendar";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateHeader(date: Date): string {
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatDailyDigest(events: CalendarEvent[]): string {
  const today = new Date();
  const header = `📅 *Schedule for ${formatDateHeader(today)}*\n`;

  if (events.length === 0) {
    return `${header}\n✅ No events scheduled for today. Enjoy your free day! 🎉`;
  }

  const lines: string[] = [header];

  for (const event of events) {
    if (event.isAllDay) {
      lines.push(`🗓️ *${event.title}* _(all day)_`);
    } else {
      const timeRange = `${formatTime(event.start)} – ${formatTime(event.end)}`;
      lines.push(`🕐 *${timeRange}*  »  ${event.title}`);
    }

    if (event.location) {
      lines.push(`   📍 ${event.location}`);
    }

    if (event.description) {
      // Truncate long descriptions
      const desc = event.description.replace(/\n+/g, " ").trim();
      const truncated = desc.length > 100 ? desc.slice(0, 97) + "..." : desc;
      lines.push(`   📝 ${truncated}`);
    }
  }

  lines.push(`\nHave a productive day! 🚀`);
  return lines.join("\n");
}
