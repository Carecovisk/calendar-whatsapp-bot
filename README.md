# 📅 Calendar WhatsApp Bot

Sends your Google Calendar daily schedule to WhatsApp recipients every morning via a Dockerized TypeScript bot using Baileys.

---

## Prerequisites

- Docker + Docker Compose
- A Google Cloud project with the **Google Calendar API** enabled
- A **Service Account** with access to your calendar

---

## Setup

### 1. Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use an existing one)
3. Enable the **Google Calendar API**
4. Go to **IAM & Admin → Service Accounts** → Create a service account
5. Download the JSON key → save as `credentials.json` in the project root
6. In Google Calendar, share your calendar with the service account email (give it *View* access)

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
CALENDAR_ID=your-calendar@gmail.com
RECIPIENTS=5511999999999,5521888888888
TZ=America/Sao_Paulo
CRON_SCHEDULE=0 7 * * *
```

### 3. Build and run

```bash
docker compose up --build
```

On first run, a **QR code** will appear in the terminal. Scan it with WhatsApp on your phone (**WhatsApp → Linked Devices → Link a Device**).

The session is saved to `./auth_info/` — you only need to scan once.

---

## Testing

To send a digest immediately without waiting for the cron:

```bash
docker compose run --rm calendar-bot node dist/index.js --run-now
```

---

## Project Structure

```
src/
├── index.ts        # Entry point — boots WhatsApp and scheduler
├── config.ts       # Environment variable parsing
├── logger.ts       # Pino logger instance
├── calendar.ts     # Google Calendar API integration
├── formatter.ts    # Message formatting
├── whatsapp.ts     # Baileys client (connect, send, reconnect)
└── scheduler.ts    # node-cron scheduler + digest runner
```

---

## Cron Schedule Examples

| Schedule         | CRON_SCHEDULE     |
|-----------------|-------------------|
| Every day 7 AM  | `0 7 * * *`       |
| Every day 8 AM  | `0 8 * * *`       |
| Weekdays 9 AM   | `0 9 * * 1-5`     |
| Twice daily     | `0 7,18 * * *`    |

---

## Troubleshooting

| Issue | Fix |
|---|---|
| QR code not appearing | Check container logs: `docker compose logs -f` |
| Session expired | Delete `./auth_info/` folder and restart |
| Calendar events not showing | Verify the service account email has calendar access |
| Messages not delivering | Confirm recipient numbers include country code (e.g. `5511...`) |
