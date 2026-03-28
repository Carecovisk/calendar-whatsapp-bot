import { CalendarEvent } from "./calendar";

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

export function formatDailyDigest(events: CalendarEvent[]): string {
  const today = new Date();
  const header = `📅 *Agenda de ${formatDateHeader(today)}*\n`;

  if (events.length === 0) {
    return `${header}\n✅ Nenhum evento agendado para hoje. Aproveite o dia livre! 🎉`;
  }

  const lines: string[] = [header];

  for (const event of events) {
    if (event.isAllDay) {
      lines.push(`🗓️ *${event.title}* _(dia todo)_`);
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

  lines.push(`\nTenha um dia produtivo! 🚀`);
  return lines.join("\n");
}
