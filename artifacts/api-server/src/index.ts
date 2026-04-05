import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn("DATABASE_URL no encontrado — Stripe no se inicializará");
    return;
  }
  try {
    logger.info("Inicializando esquema Stripe...");
    const { runMigrations } = await import("stripe-replit-sync");
    await runMigrations({ databaseUrl, schema: "stripe" });
    logger.info("Esquema Stripe listo");

    const { getStripeSync } = await import("./stripeClient");
    const stripeSync = await getStripeSync();

    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    logger.info("Webhook Stripe configurado");

    stripeSync
      .syncBackfill()
      .then(() => logger.info("Datos Stripe sincronizados"))
      .catch((err: any) => logger.error({ err }, "Error sincronizando datos Stripe"));
  } catch (err: any) {
    logger.error({ err }, "Error inicializando Stripe — la app continúa sin pagos");
  }
}

await initStripe();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error al escuchar en puerto");
    process.exit(1);
  }
  logger.info({ port }, "Servidor escuchando");
});
