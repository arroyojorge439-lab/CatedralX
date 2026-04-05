import { Router, type IRouter } from "express";
import { db, paperPortfoliosTable, paperTradesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getBTCPrice } from "../lib/btcPrice";

const router: IRouter = Router();
const INITIAL_BALANCE = 100000;

function requireAuth(req: Parameters<Parameters<typeof router.use>[0]>[0], res: Parameters<Parameters<typeof router.use>[0]>[1], next: Parameters<Parameters<typeof router.use>[0]>[2]) {
  const userId = (req.session as Record<string, unknown>)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Debes iniciar sesión." });
    return;
  }
  next();
}

async function getOrCreatePortfolio(userId: number) {
  const [existing] = await db.select().from(paperPortfoliosTable).where(eq(paperPortfoliosTable.userId, userId));
  if (existing) return existing;

  const [created] = await db
    .insert(paperPortfoliosTable)
    .values({ userId, balanceUsd: String(INITIAL_BALANCE), btcAmount: "0", totalTrades: 0, winningTrades: 0 })
    .onConflictDoNothing()
    .returning();
  return created;
}

function buildPortfolioResponse(portfolio: Record<string, unknown>, btcPrice: number) {
  const balanceUsd = parseFloat(String(portfolio.balanceUsd));
  const btcAmount = parseFloat(String(portfolio.btcAmount));
  const btcValue = btcAmount * btcPrice;
  const totalValue = balanceUsd + btcValue;
  const pnl = totalValue - INITIAL_BALANCE;
  return {
    ...portfolio,
    balanceUsd,
    btcAmount,
    btcPrice,
    btcValue,
    totalValue,
    pnl,
    pnlPercent: (pnl / INITIAL_BALANCE) * 100,
    initialBalance: INITIAL_BALANCE,
  };
}

router.get("/paper-trading/portfolio", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as Record<string, unknown>).userId as number;
  const portfolio = await getOrCreatePortfolio(userId);
  if (!portfolio) {
    res.status(500).json({ error: "Error al obtener portafolio." });
    return;
  }
  const { price } = await getBTCPrice();
  const recentTrades = await db
    .select()
    .from(paperTradesTable)
    .where(eq(paperTradesTable.userId, userId))
    .orderBy(desc(paperTradesTable.createdAt))
    .limit(10);

  res.json({
    portfolio: buildPortfolioResponse(portfolio as Record<string, unknown>, price),
    trades: recentTrades.map(t => ({ ...t, amountUsd: parseFloat(String(t.amountUsd)), btcAmount: parseFloat(String(t.btcAmount)), btcPrice: parseFloat(String(t.btcPrice)) })),
    btcPrice: price,
  });
});

router.post("/paper-trading/trade", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as Record<string, unknown>).userId as number;
  const { action, amountUsd, strategy } = req.body as { action?: string; amountUsd?: number; strategy?: string };

  if (!action || !["buy", "sell"].includes(action)) {
    res.status(400).json({ error: "Acción inválida. Usa 'buy' o 'sell'." });
    return;
  }

  const parsedAmount = parseFloat(String(amountUsd));
  if (!parsedAmount || parsedAmount <= 0 || parsedAmount > 1_000_000) {
    res.status(400).json({ error: "Monto inválido." });
    return;
  }

  const { price: btcPrice } = await getBTCPrice();
  if (btcPrice <= 0) {
    res.status(503).json({ error: "No se pudo obtener precio de BTC." });
    return;
  }

  const btcAmount = parsedAmount / btcPrice;

  let portfolio = await getOrCreatePortfolio(userId);
  if (!portfolio) {
    res.status(500).json({ error: "Error al obtener portafolio." });
    return;
  }

  const currentBalance = parseFloat(String(portfolio.balanceUsd));
  const currentBtc = parseFloat(String(portfolio.btcAmount));

  if (action === "buy") {
    if (currentBalance < parsedAmount) {
      res.status(400).json({ error: `Saldo insuficiente. Disponible: $${currentBalance.toFixed(2)}` });
      return;
    }
    const [updated] = await db
      .update(paperPortfoliosTable)
      .set({
        balanceUsd: String(currentBalance - parsedAmount),
        btcAmount: String(currentBtc + btcAmount),
        totalTrades: (portfolio.totalTrades || 0) + 1,
      })
      .where(eq(paperPortfoliosTable.userId, userId))
      .returning();
    portfolio = updated;
  } else {
    if (currentBtc < btcAmount) {
      res.status(400).json({ error: `BTC insuficiente. Disponible: ${currentBtc.toFixed(8)} BTC` });
      return;
    }
    const [updated] = await db
      .update(paperPortfoliosTable)
      .set({
        balanceUsd: String(currentBalance + parsedAmount),
        btcAmount: String(currentBtc - btcAmount),
        totalTrades: (portfolio.totalTrades || 0) + 1,
      })
      .where(eq(paperPortfoliosTable.userId, userId))
      .returning();
    portfolio = updated;
  }

  await db.insert(paperTradesTable).values({
    userId,
    action,
    amountUsd: String(parsedAmount),
    btcAmount: String(btcAmount),
    btcPrice: String(btcPrice),
    strategy: strategy || null,
  });

  const portfolioResponse = buildPortfolioResponse(portfolio as Record<string, unknown>, btcPrice);

  res.json({
    success: true,
    message: `Operación ${action} ejecutada: ${btcAmount.toFixed(8)} BTC @ $${btcPrice.toFixed(2)}`,
    portfolio: portfolioResponse,
  });
});

router.get("/paper-trading/history", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as Record<string, unknown>).userId as number;
  const trades = await db
    .select()
    .from(paperTradesTable)
    .where(eq(paperTradesTable.userId, userId))
    .orderBy(desc(paperTradesTable.createdAt))
    .limit(50);

  res.json({
    trades: trades.map(t => ({
      ...t,
      amountUsd: parseFloat(String(t.amountUsd)),
      btcAmount: parseFloat(String(t.btcAmount)),
      btcPrice: parseFloat(String(t.btcPrice)),
    })),
  });
});

export default router;
