# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Run with ts-node (no build needed)
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled output

# Docker (primary way to run)
docker compose up --build          # Build and run
docker compose logs -f             # Tail logs
docker compose run --rm calendar-bot node dist/index.js --run-now  # Send digest immediately
```

No test suite is configured.

## Environment

Required `.env` variables:
- `CALENDAR_ID` — Google Calendar ID (e.g. `user@gmail.com`)
- `RECIPIENTS` — comma-separated WhatsApp numbers with country code (e.g. `5511999999999,5521888888888`)

Optional:
- `CRON_SCHEDULE` — default `0 7 * * *`
- `TZ` — default `America/Sao_Paulo`
- `GOOGLE_APPLICATION_CREDENTIALS` — default `./credentials.json`
- `WA_AUTH_FOLDER` — default `./auth_info`
- `LOG_LEVEL` — default `info`

`credentials.json` must be a Google Service Account key with `calendar.readonly` scope, and the service account must be granted access to the target calendar.

## Architecture

The bot has a linear startup sequence in `index.ts`:
1. `initWhatsApp()` — connects to WhatsApp via Baileys, blocks until QR is scanned and session is established
2. Optionally runs `runDailyDigest()` immediately if `--run-now` flag is passed
3. `startScheduler()` — registers the cron job and keeps the process alive

**Data flow for each digest run** (`scheduler.ts` → `runDailyDigest`):
- `calendar.ts`: authenticates with Google via service account, fetches today's events as `CalendarEvent[]`
- `formatter.ts`: formats the event list into a WhatsApp-formatted string (uses `*bold*` and `_italic_` markdown)
- `whatsapp.ts`: broadcasts the message to all recipients via `Promise.allSettled` (partial failures are logged, not thrown)

**WhatsApp session**: Baileys persists auth credentials to `./auth_info/` (mounted as a Docker volume). On disconnect, the client auto-reconnects unless the disconnect reason is `loggedOut`. If logged out, delete `./auth_info/` and restart to re-scan QR.

**Recipient format**: Phone numbers are stored as plain digits; `whatsapp.ts` appends `@s.whatsapp.net` to form Baileys JIDs.
