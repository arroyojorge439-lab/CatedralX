import { Router, type IRouter } from "express";
import { db, signalsTable, paperPortfoliosTable, usersTable, affectiveStateTable } from "@workspace/db";
import { desc, count, eq } from "drizzle-orm";
import { getBTCPrice } from "../lib/btcPrice";

const router: IRouter = Router();
const serverStartTime = Date.now();

const INTERACTION_AFFECTS: Record<string, { valencia: number; activacion: number; persistencia: number }> = {
  sync_start: { valencia: 0.6, activacion: 0.7, persistencia: 0.4 },
  sync_success: { valencia: 0.8, activacion: 0.4, persistencia: 0.6 },
  sync_error: { valencia: 0.2, activacion: 0.8, persistencia: 0.7 },
  strategy_change: { valencia: 0.7, activacion: 0.6, persistencia: 0.5 },
  page_view: { valencia: 0.5, activacion: 0.3, persistencia: 0.3 },
  navigation: { valencia: 0.5, activacion: 0.4, persistencia: 0.3 },
  trade_buy: { valencia: 0.65, activacion: 0.7, persistencia: 0.5 },
  trade_sell: { valencia: 0.45, activacion: 0.75, persistencia: 0.6 },
  ai_query: { valencia: 0.7, activacion: 0.6, persistencia: 0.65 },
};

router.get("/system/vitals", async (req, res): Promise<void> => {
  const startTime = Date.now();
  const userId = (req.session as Record<string, unknown>)?.userId as number | undefined;

  const { price: btcPrice, change24h } = await getBTCPrice();
  const volatility = Math.min(100, Math.abs(change24h) * 10);

  let lastSignal: { type: string; strategy: string; created_at: Date } | null = null;
  let signalCount = 0;
  let tradeCount = 0;
  let paperPnlPercent = 0;
  let userTier = "observador";
  let sessionActive = false;

  try {
    const [sig] = await db.select().from(signalsTable).orderBy(desc(signalsTable.createdAt)).limit(1);
    if (sig) lastSignal = { type: sig.type, strategy: sig.strategy, created_at: sig.createdAt };
  } catch { /* ignore */ }

  try {
    const [{ value }] = await db.select({ value: count() }).from(signalsTable);
    signalCount = Number(value);
  } catch { /* ignore */ }

  let affective = { valencia: 0.5, activacion: 0.3, persistencia: 0.5 };

  if (userId) {
    sessionActive = true;

    try {
      const [user] = await db.select({ tier: usersTable.tier }).from(usersTable).where(eq(usersTable.id, userId));
      if (user) userTier = user.tier;
    } catch { /* ignore */ }

    try {
      const [{ value }] = await db
        .select({ value: count() })
        .from(paperPortfoliosTable)
        .where(eq(paperPortfoliosTable.userId, userId));
      tradeCount = Number(value);
    } catch { /* ignore */ }

    try {
      const [portfolio] = await db
        .select()
        .from(paperPortfoliosTable)
        .where(eq(paperPortfoliosTable.userId, userId));
      if (portfolio) {
        const btcValue = parseFloat(String(portfolio.btcAmount)) * btcPrice;
        const totalValue = parseFloat(String(portfolio.balanceUsd)) + btcValue;
        paperPnlPercent = ((totalValue - 100000) / 100000) * 100;
      }
    } catch { /* ignore */ }

    try {
      const [aff] = await db
        .select()
        .from(affectiveStateTable)
        .where(eq(affectiveStateTable.userId, userId))
        .orderBy(desc(affectiveStateTable.createdAt))
        .limit(1);
      if (aff) {
        affective = {
          valencia: parseFloat(String(aff.valencia)),
          activacion: parseFloat(String(aff.activacion)),
          persistencia: parseFloat(String(aff.persistencia)),
        };
      }
    } catch { /* ignore */ }
  }

  const latencyMs = Date.now() - startTime;
  const uptimeHours = (Date.now() - serverStartTime) / (1000 * 60 * 60);

  res.json({
    btc: { price: btcPrice, change24h, volatility },
    server: {
      latencyMs,
      uptimeHours: parseFloat(uptimeHours.toFixed(2)),
      requestCount: 0,
      status: latencyMs < 500 ? "online" : latencyMs < 2000 ? "degraded" : "offline",
    },
    signals: { lastSignal, totalCount: signalCount },
    trading: { tradeCount, pnlPercent: parseFloat(paperPnlPercent.toFixed(2)) },
    user: {
      tier: userTier,
      sessionActive,
      hasStripeSubscription: false,
      secureConnection: req.secure || req.headers["x-forwarded-proto"] === "https",
    },
    entropy: { repoCount: 0, signalsAccumulated: signalCount, tradesExecuted: tradeCount },
    affective,
  });
});

router.post("/system/affective", async (req, res): Promise<void> => {
  const userId = (req.session as Record<string, unknown>)?.userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Sesión requerida." });
    return;
  }

  const { source } = req.body as { source?: string };
  if (!source || typeof source !== "string") {
    res.status(400).json({ error: "Fuente de interacción requerida." });
    return;
  }

  const preset = INTERACTION_AFFECTS[source];
  if (!preset) {
    res.json({ success: true });
    return;
  }

  await db.insert(affectiveStateTable).values({
    userId,
    valencia: String(preset.valencia),
    activacion: String(preset.activacion),
    persistencia: String(preset.persistencia),
    source,
  });

  res.json({ success: true });
});

export default router;
