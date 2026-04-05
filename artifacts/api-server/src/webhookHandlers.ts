import { getStripeSync } from "./stripeClient";

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload debe ser Buffer. " +
        "Tipo recibido: " + typeof payload + ". " +
        "Asegúrate de registrar la ruta webhook ANTES de app.use(express.json())."
      );
    }
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);
  }
}
