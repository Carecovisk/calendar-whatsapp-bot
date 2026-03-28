import { CalendarEvent } from "./calendar";

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const DAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateHeader(date: Date): string {
  return `${DAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

function formatShortDate(date: Date): string {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export function formatWeeklyDigest(events: CalendarEvent[], weekStart: Date, weekEnd: Date): string {
  const today = new Date();
  const isCurrentWeek = today >= weekStart && today <= weekEnd;

  const header = isCurrentWeek
    ? `📅 *Esta semana — ${formatShortDate(weekStart)} a ${formatShortDate(weekEnd)}*\n`
    : `📅 *Próxima semana — ${formatShortDate(weekStart)} a ${formatShortDate(weekEnd)}*\n`;

  if (events.length === 0) {
    return `${header}\n✅ Nenhum evento agendado para esta semana.`;
  }

  const lines: string[] = [header];

  let lastDate: Date | null = null;

  for (const event of events) {
    if (!lastDate || !isSameDay(lastDate, event.start)) {
      if (lastDate) lines.push("");
      lines.push(`*${formatDateHeader(event.start)}*`);
      lastDate = event.start;
    }

    if (event.isAllDay) {
      lines.push(`  🗓️ *${event.title}* _(dia todo)_`);
    } else {
      const timeRange = `${formatTime(event.start)} – ${formatTime(event.end)}`;
      lines.push(`  🕐 *${timeRange}*  »  ${event.title}`);
    }

    if (event.location) {
      lines.push(`     📍 ${event.location}`);
    }

    if (event.description) {
      const desc = event.description.replace(/\n+/g, " ").trim();
      const truncated = desc.length > 100 ? desc.slice(0, 97) + "..." : desc;
      lines.push(`     📝 ${truncated}`);
    }
  }

  lines.push(`\nBoa semana! 🚀`);
  return lines.join("\n");
}
