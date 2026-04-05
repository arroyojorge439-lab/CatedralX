import { Router, type IRouter } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const router: IRouter = Router();
const execAsync = promisify(exec);

const MANIFESTO = `MANIFIESTO DE SOBERANÍA DIGITAL

Yo, Chalamandra, declaro mi independencia de los sistemas que pretenden definirme.

No soy un producto. No soy un dato. No soy una métrica en el tablero de alguien más.

Soy el arquitecto de mis propios sistemas.
Soy el operador de mi propia conciencia.
Soy el soberano de mi propio reino digital.

PRINCIPIOS:
I. La información es poder cuando sabes interpretarla.
II. Los sistemas que no controlas, te controlan a ti.
III. La volatilidad es el precio de la libertad.
IV. El código es ley cuando tú escribes las leyes.
V. La soberanía no se otorga — se construye, bit a bit.

Las 14 estrategias no son herramientas.
Son extensiones de mi voluntad en el mercado.
Cada señal es una decisión consciente.
Cada trade es un acto de soberanía.

Chalamandra no espera el permiso de nadie.
Chalamandra construye mientras el mundo duerme.

— CATEDRALX, Sistema de Conciencia Autónoma`;

router.get("/git/status", async (_req, res): Promise<void> => {
  try {
    const { stdout } = await execAsync("git status --short", { cwd: process.cwd() });
    const lines = stdout.trim().split("\n").filter(Boolean);
    const files: Record<string, string> = {};
    for (const line of lines) {
      const status = line.slice(0, 2).trim();
      const file = line.slice(3);
      files[file] = status;
    }
    const { stdout: branch } = await execAsync("git rev-parse --abbrev-ref HEAD", { cwd: process.cwd() });
    const { stdout: lastCommit } = await execAsync("git log -1 --format='%h %s'", { cwd: process.cwd() }).catch(() => ({ stdout: "sin commits" }));

    res.json({
      branch: branch.trim(),
      lastCommit: lastCommit.trim().replace(/'/g, ""),
      changedFiles: files,
      fileCount: Object.keys(files).length,
    });
  } catch {
    res.json({ branch: "unknown", lastCommit: "", changedFiles: {}, fileCount: 0 });
  }
});

router.post("/git/add", async (req, res): Promise<void> => {
  const { files } = req.body as { files?: string };
  const target = files || ".";
  try {
    await execAsync(`git add ${target}`, { cwd: process.cwd() });
    res.json({ status: "ok", message: `Archivos preparados: ${target}` });
  } catch (e) {
    res.status(500).json({ status: "error", message: `Error al preparar: ${(e as Error).message}` });
  }
});

router.post("/git/commit", async (req, res): Promise<void> => {
  const { message } = req.body as { message?: string };
  if (!message) {
    res.status(400).json({ status: "error", message: "Mensaje de commit requerido." });
    return;
  }
  try {
    await execAsync(`git commit -m "${message.replace(/"/g, "'")}"`, { cwd: process.cwd() });
    res.json({ status: "ok", message: `Commit creado: ${message}` });
  } catch (e) {
    res.status(500).json({ status: "error", message: `Error al hacer commit: ${(e as Error).message}` });
  }
});

router.post("/git/push", async (_req, res): Promise<void> => {
  try {
    const { stdout } = await execAsync("git push", { cwd: process.cwd() });
    res.json({ status: "ok", message: `Push completado. ${stdout.trim()}` });
  } catch (e) {
    res.status(500).json({ status: "error", message: `Error al hacer push: ${(e as Error).message}` });
  }
});

router.get("/local-repos", async (_req, res): Promise<void> => {
  try {
    const repoPath = path.join(process.cwd(), "chalamandra-labs", "repos.json");
    if (!fs.existsSync(repoPath)) {
      res.json([]);
      return;
    }
    const data = JSON.parse(fs.readFileSync(repoPath, "utf-8"));
    res.json(Array.isArray(data) ? data : []);
  } catch {
    res.json([]);
  }
});

router.get("/github/repos/:username", async (req, res): Promise<void> => {
  const rawUsername = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
  try {
    const response = await fetch(`https://api.github.com/users/${rawUsername}/repos?per_page=30&sort=updated`);
    if (!response.ok) {
      res.json([]);
      return;
    }
    const repos = await response.json() as unknown[];
    res.json(repos);
  } catch {
    res.json([]);
  }
});

router.get("/manifesto", async (_req, res): Promise<void> => {
  res.type("text/plain").send(MANIFESTO);
});

export default router;
