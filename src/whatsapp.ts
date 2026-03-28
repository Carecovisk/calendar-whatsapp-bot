import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import { config } from "./config";
import { logger } from "./logger";

let sock: WASocket | null = null;
let isReady = false;

export async function initWhatsApp(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(config.waAuthFolder);
  const { version } = await fetchLatestBaileysVersion();

  logger.info({ version }, "Initializing Baileys WhatsApp client");

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false, // We'll handle QR ourselves
    logger: logger.child({ module: "baileys" }) as any,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info("QR code generated — scan with WhatsApp on your phone:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      isReady = true;
      logger.info("WhatsApp connection established ✅");
    }

    if (connection === "close") {
      isReady = false;
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn({ statusCode, shouldReconnect }, "WhatsApp connection closed");

      if (shouldReconnect) {
        logger.info("Reconnecting in 5 seconds...");
        setTimeout(() => initWhatsApp(), 5000);
      } else {
        logger.error("Logged out from WhatsApp. Delete auth_info folder and restart.");
        process.exit(1);
      }
    }
  });

  // Wait until connected
  await waitUntilReady();
}

function waitUntilReady(timeoutMs = 60000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (isReady) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error("WhatsApp connection timeout — did you scan the QR code?"));
      }
    }, 500);
  });
}

export async function sendMessage(recipient: string, message: string): Promise<void> {
  if (!sock || !isReady) {
    throw new Error("WhatsApp client is not ready");
  }

  // Baileys JID format: number@s.whatsapp.net
  const jid = recipient.includes("@") ? recipient : `${recipient}@s.whatsapp.net`;

  await sock.sendMessage(jid, { text: message });
  logger.info({ recipient }, "Message sent successfully");
}

export async function broadcastMessage(recipients: string[], message: string): Promise<void> {
  const results = await Promise.allSettled(
    recipients.map((r) => sendMessage(r, message))
  );

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      logger.error({ recipient: recipients[i], error: result.reason }, "Failed to send message");
    }
  });
}
