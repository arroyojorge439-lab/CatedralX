import { Router, type IRouter } from "express";
import { db, nervousStateTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createInitialState, tickNervousSystem, stateFromDb } from "../lib/nervousSystem";

const router: IRouter = Router();

async function getUserTier(userId: number): Promise<string> {
  const [user] = await db.select({ tier: usersTable.tier }).from(usersTable).where(eq(usersTable.id, userId));
  return user?.tier || "observador";
}

async function getOrCreateNervousState(userId: number) {
  const [existing] = await db.select().from(nervousStateTable).where(eq(nervousStateTable.userId, userId));
  if (existing) return existing;

  const initial = createInitialState();
  const [created] = await db
    .insert(nervousStateTable)
    .values({
      userId,
      phi: String(initial.phi),
      delta: String(initial.delta),
      gwtFocus: initial.gwtFocus,
      gwtBroadcast: initial.gwtBroadcast,
      synapticWeights: initial.synapticWeights,
      strategyNames: initial.strategyNames,
      learningRate: String(initial.learningRate),
      moduleActivations: initial.moduleActivations,
      dopamine: String(initial.pulse.dopamine),
      adrenaline: String(initial.pulse.adrenaline),
      soma: String(initial.pulse.soma),
      asymmetry: String(initial.pulse.asymmetry),
      liquidityTrap: initial.pulse.liquidityTrap,
    })
    .returning();
  return created;
}

function rowToResponse(row: Record<string, unknown>) {
  return stateFromDb({
    phi: row.phi,
    delta: row.delta,
    gwtFocus: row.gwtFocus,
    gwtBroadcast: row.gwtBroadcast,
    synapticWeights: row.synapticWeights,
    strategyNames: row.strategyNames,
    learningRate: row.learningRate,
    moduleActivations: row.moduleActivations,
    dopamine: row.dopamine,
    adrenaline: row.adrenaline,
    soma: row.soma,
    asymmetry: row.asymmetry,
    liquidityTrap: row.liquidityTrap,
  });
}

router.get("/system/nervous", async (req, res): Promise<void> => {
  const userId = (req.session as Record<string, unknown>)?.userId as number | undefined;
  if (!userId) {
    const initial = createInitialState();
    res.json(initial);
    return;
  }

  const row = await getOrCreateNervousState(userId);
  res.json(rowToResponse(row as Record<string, unknown>));
});

router.post("/system/nervous/tick", async (req, res): Promise<void> => {
  const userId = (req.session as Record<string, unknown>)?.userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Sesión requerida." });
    return;
  }

  const tier = await getUserTier(userId);
  if (tier !== "soberano") {
    res.status(403).json({ error: "Se requiere plan Soberano para activar el tick neuronal." });
    return;
  }

  const row = await getOrCreateNervousState(userId);
  const current = rowToResponse(row as Record<string, unknown>);
  const next = tickNervousSystem(current);

  await db
    .update(nervousStateTable)
    .set({
      phi: String(next.phi),
      delta: String(next.delta),
      gwtFocus: next.gwtFocus,
      gwtBroadcast: next.gwtBroadcast,
      synapticWeights: next.synapticWeights,
      moduleActivations: next.moduleActivations,
      dopamine: String(next.pulse.dopamine),
      adrenaline: String(next.pulse.adrenaline),
      soma: String(next.pulse.soma),
      asymmetry: String(next.pulse.asymmetry),
      liquidityTrap: next.pulse.liquidityTrap,
    })
    .where(eq(nervousStateTable.userId, userId));

  res.json(next);
});

export default router;
