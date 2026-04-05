import { Router, type IRouter } from "express";
import { db, signalsTable, usersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { generateAllSignals, generateSignalForId } from "../lib/signalEngine";

const router: IRouter = Router();

router.get("/signals", async (req, res): Promise<void> => {
  const userId = (req.session as Record<string, unknown>)?.userId as number | undefined;
  let tier = "observador";

  if (userId) {
    const [user] = await db.select({ tier: usersTable.tier }).from(usersTable).where(eq(usersTable.id, userId));
    if (user) tier = user.tier;
  }

  const limitParam = req.query.limit;
  const requestedLimit = limitParam ? parseInt(String(limitParam), 10) : 50;
  const maxLimit = tier === "observador" ? 5 : tier === "operador" ? 20 : 100;
  const limit = Math.min(requestedLimit, maxLimit);

  const signals = await db
    .select()
    .from(signalsTable)
    .orderBy(desc(signalsTable.createdAt))
    .limit(limit);

  res.json({
    signals: signals.map(s => ({
      ...s,
      price: parseFloat(String(s.price)),
    })),
    limited: tier === "observador",
    tier,
  });
});

router.post("/signals/generate", async (req, res): Promise<void> => {
  const generated = await generateAllSignals();

  const inserted = await db
    .insert(signalsTable)
    .values(generated.map(s => ({
      strategy: s.strategy,
      type: s.type,
      message: s.message,
      price: String(s.price),
      confidence: s.confidence,
    })))
    .returning();

  res.json({
    signals: inserted.map(s => ({
      ...s,
      price: parseFloat(String(s.price)),
    })),
    count: inserted.length,
  });
});

router.post("/invoke-strategy/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  if (isNaN(id) || id < 0 || id > 13) {
    res.status(400).json({ error: "ID de estrategia inválido (0–13)." });
    return;
  }

  const signal = await generateSignalForId(id);
  if (!signal) {
    res.status(404).json({ error: "Estrategia no encontrada." });
    return;
  }

  await db.insert(signalsTable).values({
    strategy: signal.strategy,
    type: signal.type,
    message: signal.message,
    price: String(signal.price),
    confidence: signal.confidence,
  });

  res.json({
    status: "invocada",
    message: signal.message,
    id,
  });
});

export default router;
