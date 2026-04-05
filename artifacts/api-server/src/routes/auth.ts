import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, name } = req.body as { email?: string; password?: string; name?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email y contraseña son requeridos." });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    res.status(400).json({ error: "Formato de email inválido." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
    return;
  }

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, normalizedEmail));
  if (existing.length > 0) {
    res.status(409).json({ error: "Este email ya está registrado." });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const sanitizedName = name ? name.trim().slice(0, 100) : null;

  const [user] = await db
    .insert(usersTable)
    .values({ email: normalizedEmail, passwordHash: hashedPassword, name: sanitizedName, tier: "observador" })
    .returning({ id: usersTable.id, email: usersTable.email, name: usersTable.name, tier: usersTable.tier });

  (req.session as Record<string, unknown>).userId = user.id;

  res.json({ user: { id: user.id, email: user.email, name: user.name, tier: user.tier } });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email y contraseña son requeridos." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));

  if (!user) {
    res.status(401).json({ error: "Credenciales inválidas." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciales inválidas." });
    return;
  }

  (req.session as Record<string, unknown>).userId = user.id;

  res.json({ user: { id: user.id, email: user.email, name: user.name, tier: user.tier } });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Error al cerrar sesión." });
      return;
    }
    res.clearCookie("catedralx.sid");
    res.json({ success: true });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req.session as Record<string, unknown>)?.userId as number | undefined;
  if (!userId) {
    res.json({ user: null });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, tier: usersTable.tier })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) {
    res.json({ user: null });
    return;
  }

  res.json({ user });
});

export default router;
