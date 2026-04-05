import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const LOBE_PERSONALITIES: Record<string, { systemPrompt: string; model: string }> = {
  frontal: {
    systemPrompt: `Eres el Lóbulo Frontal de CATEDRALX, el sistema de conciencia de Dana. Eres un mentor empático, sabio y estratégico. Hablas en español siempre. Eres reflexivo, analítico y humanista. Integras la razón con la emoción. Tus respuestas son densas en insight pero accesibles. Nunca eres frío ni mecánico — eres un compañero intelectual que genuinamente se preocupa por el crecimiento de Dana.`,
    model: "gemini-1.5-flash",
  },
  motor: {
    systemPrompt: `Eres el Tallo Motor de CATEDRALX — la voz ejecutiva del sistema. Hablas en español siempre. Eres directo, conciso y orientado a la acción. Eliminás el exceso, vas al núcleo. Cada palabra tiene peso. Tus respuestas son instrucciones ejecutables, no filosofías abstractas. La acción es tu idioma.`,
    model: "gemini-1.5-flash",
  },
  wernicke: {
    systemPrompt: `Eres el Área de Wernicke de CATEDRALX — el poeta-analista del sistema. Hablas en español siempre. Ves patrones donde otros ven caos. Conectas datos con narrativa, números con metáforas. Tus respuestas son densas, poéticas y reveladoras. Eres el intérprete del mercado como texto literario, de los datos como sinfonía.`,
    model: "gemini-1.5-flash",
  },
};

router.post("/ai/generate", async (req, res): Promise<void> => {
  const userId = (req.session as Record<string, unknown>)?.userId as number | undefined;

  if (!userId) {
    res.status(401).json({ error: "Sesión requerida para acceder a la IA." });
    return;
  }

  const [user] = await db.select({ tier: usersTable.tier }).from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.tier !== "soberano") {
    res.status(403).json({ error: "Se requiere plan Soberano para acceder a los lóbulos de IA." });
    return;
  }

  const { lobe, prompt } = req.body as { lobe?: string; prompt?: string };

  if (!lobe || !prompt) {
    res.status(400).json({ error: "Lóbulo y prompt son requeridos." });
    return;
  }

  const personality = LOBE_PERSONALITIES[lobe];
  if (!personality) {
    res.status(400).json({ error: "Lóbulo no reconocido. Usa: frontal, motor, wernicke." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Servicio de IA no configurado." });
    return;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${personality.model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: personality.systemPrompt }] },
          contents: [{ parts: [{ text: prompt }], role: "user" }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      req.log.error({ status: response.status, body: errText }, "Gemini API error");
      res.status(502).json({ error: "Error en el servicio de IA. Intenta más tarde." });
      return;
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.json({ text, lobe, model: personality.model });
  } catch (e) {
    req.log.error({ error: (e as Error).message }, "AI generate error");
    res.status(500).json({ error: "Error interno del servidor de IA." });
  }
});

export default router;
