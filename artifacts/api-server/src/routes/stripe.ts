import { Router, type IRouter } from "express";
import { storage } from "../storage";
import { getUncachableStripeClient, getStripePublishableKey } from "../stripeClient";
import type { Request, Response } from "express";

interface AuthRequest extends Request {
  session: any;
}

const router: IRouter = Router();

router.get("/stripe/config", async (_req: Request, res: Response) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (err: any) {
    res.status(500).json({ error: "Error obteniendo configuración de Stripe" });
  }
});

router.get("/stripe/planes", async (_req: Request, res: Response) => {
  try {
    const rows = await storage.listProductsWithPrices();
    const planesMap = new Map<string, any>();
    for (const row of rows as any[]) {
      if (!planesMap.has(row.product_id)) {
        planesMap.set(row.product_id, {
          id: row.product_id,
          nombre: row.product_name,
          descripcion: row.product_description,
          metadata: row.product_metadata || {},
          precios: [],
        });
      }
      if (row.price_id) {
        planesMap.get(row.product_id).precios.push({
          id: row.price_id,
          monto: row.unit_amount,
          moneda: row.currency,
          recurrencia: row.recurring,
        });
      }
    }
    res.json({ planes: Array.from(planesMap.values()) });
  } catch (err: any) {
    res.status(500).json({ error: "Error obteniendo planes" });
  }
});

router.get("/stripe/suscripcion", async (req: AuthRequest, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "No autenticada" });
  }
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user?.stripeSubscriptionId) {
      return res.json({ suscripcion: null });
    }
    const suscripcion = await storage.getSubscription(user.stripeSubscriptionId);
    res.json({ suscripcion });
  } catch (err: any) {
    res.status(500).json({ error: "Error obteniendo suscripción" });
  }
});

router.post("/stripe/checkout", async (req: AuthRequest, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "No autenticada" });
  }
  const { precioId } = req.body;
  if (!precioId) {
    return res.status(400).json({ error: "precioId requerido" });
  }
  try {
    const user = await storage.getUser(req.session.userId);
    const stripe = await getUncachableStripeClient();

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const cliente = await stripe.customers.create({
        email: user.email,
        name: user.name || user.email,
        metadata: { userId: String(user.id) },
      });
      await storage.updateUserStripeInfo(user.id, { stripeCustomerId: cliente.id });
      customerId = cliente.id;
    }

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    const sesion = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: precioId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/?pago=exito&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?pago=cancelado`,
      metadata: { userId: String(user.id) },
    });

    res.json({ url: sesion.url });
  } catch (err: any) {
    res.status(500).json({ error: "Error creando sesión de pago: " + err.message });
  }
});

router.post("/stripe/portal", async (req: AuthRequest, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "No autenticada" });
  }
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: "Sin suscripción activa" });
    }
    const stripe = await getUncachableStripeClient();
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: baseUrl,
    });
    res.json({ url: portal.url });
  } catch (err: any) {
    res.status(500).json({ error: "Error creando portal: " + err.message });
  }
});

export default router;
