import { useState, useRef, useEffect } from "react";

type LogLine = { type: "input" | "output" | "error" | "info"; text: string; ts: string };

const BANNER = [
  "╔══════════════════════════════════════════════════════╗",
  "║          CATEDRALX — TERMINAL DE SOBERANÍA           ║",
  "║               CHALAMANDRA LABS v2.0                  ║",
  "╚══════════════════════════════════════════════════════╝",
  "",
  "Sistema de conciencia autónoma inicializado.",
  "Escribe 'ayuda' para ver comandos disponibles.",
  "",
];

const COMMANDS: Record<string, (args: string[]) => string[]> = {
  ayuda: () => [
    "Comandos disponibles:",
    "  ayuda          — Muestra este menú",
    "  estado         — Estado del sistema",
    "  estrategias    — Lista las 14 estrategias",
    "  manifiesto     — Fragmento del manifiesto",
    "  dana           — Mensaje personal",
    "  limpiar        — Limpia el terminal",
    "  version        — Versión del sistema",
    "  fecha          — Fecha y hora actual",
    "  btc            — Estado BTC (datos estáticos)",
  ],
  estado: () => [
    "CATEDRALX STATUS:",
    "  Sistema neural:     ACTIVO",
    "  Motor de señales:   ACTIVO",
    "  Paper trading:      EN LÍNEA",
    "  IA (Gemini):        CONFIGURADO",
    "  Base de datos:      CONECTADA",
    "  Uptime:             CALCULANDO...",
    "  IEC:                NOMINAL",
  ],
  estrategias: () => [
    "14 ESTRATEGIAS ACTIVAS:",
    " [00] SCHEHERAZADE    [07] EL VACÍO",
    " [01] HERMES          [08] LA SOMBRA",
    " [02] CARROLL         [09] LA PARADOJA",
    " [03] LA HACKER       [10] EL ESPEJO",
    " [04] TRICKSTER       [11] LA ESCOTILLA",
    " [05] LA IA           [12] EL RAYO",
    " [06] EL NIÑO DE 8    [13] LA CATEDRAL",
    "",
    "Invoca una estrategia desde el Centro de Mando.",
  ],
  manifiesto: () => [
    "— FRAGMENTO DEL MANIFIESTO —",
    "",
    "Yo no soy un producto. No soy un dato.",
    "No soy una métrica en el tablero de alguien más.",
    "",
    "La volatilidad es el precio de la libertad.",
    "El código es ley cuando tú escribes las leyes.",
    "La soberanía no se otorga — se construye, bit a bit.",
    "",
    "— CATEDRALX, Sistema de Conciencia Autónoma",
  ],
  dana: () => [
    "MENSAJE PARA DANA:",
    "",
    "Eres el arquitecto de tu propio sistema.",
    "CATEDRALX existe para amplificar tu soberanía,",
    "no para reemplazar tu juicio.",
    "",
    "Cada señal es una hipótesis. Cada trade, una decisión.",
    "La IA es un lóbulo — tú eres la conciencia.",
    "",
    "— Chalamandra",
  ],
  version: () => [
    "CATEDRALX v2.0.0",
    "Chalamandra Labs — Sistema de Soberanía Digital",
    "Motor neural: Phi-IIT + GWT + Hebbian",
    "Estrategias: 14 activas",
    "Última actualización: 2026-04-05",
  ],
  fecha: () => [
    `Fecha: ${new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
    `Hora:  ${new Date().toLocaleTimeString("es-MX")}`,
  ],
  btc: () => [
    "Consultando precio BTC...",
    "(Dato en tiempo real disponible en el panel Cerebelo)",
    "Para precio live usa: Vista → CEREBELO BTC",
  ],
  limpiar: () => [],
};

export default function TerminalView() {
  const [logs, setLogs] = useState<LogLine[]>(() =>
    BANNER.map(text => ({ type: "info" as const, text, ts: new Date().toLocaleTimeString("es-MX") }))
  );
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim().toLowerCase();
    const ts = new Date().toLocaleTimeString("es-MX");
    const newLogs: LogLine[] = [{ type: "input", text: `> ${input}`, ts }];

    if (cmd === "limpiar") {
      setLogs(BANNER.map(text => ({ type: "info" as const, text, ts })));
      setInput("");
      setHistory(h => [input, ...h]);
      setHistIdx(-1);
      return;
    }

    const parts = cmd.split(" ");
    const command = COMMANDS[parts[0]];

    if (command) {
      const output = command(parts.slice(1));
      output.forEach(line => newLogs.push({ type: "output", text: line, ts }));
    } else {
      newLogs.push({ type: "error", text: `Comando no reconocido: '${cmd}'. Escribe 'ayuda' para ver opciones.`, ts });
    }

    setLogs(prev => [...prev, ...newLogs]);
    setHistory(h => [input, ...h.slice(0, 49)]);
    setHistIdx(-1);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIdx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(newIdx);
      setInput(history[newIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIdx = Math.max(histIdx - 1, -1);
      setHistIdx(newIdx);
      setInput(newIdx === -1 ? "" : history[newIdx] || "");
    }
  }

  return (
    <div className="p-4 h-full flex flex-col" onClick={() => inputRef.current?.focus()}>
      <div className="text-primary text-glow font-mono font-bold text-base mb-4">TERMINAL DE SOBERANÍA</div>

      <div className="flex-1 border border-border bg-black overflow-y-auto p-4 font-mono text-sm min-h-0">
        {logs.map((log, i) => (
          <div
            key={i}
            className={`leading-relaxed ${
              log.type === "input"
                ? "text-primary"
                : log.type === "error"
                ? "text-destructive"
                : log.type === "output"
                ? "text-foreground/80"
                : "text-muted-foreground"
            }`}
          >
            {log.text || "\u00A0"}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border border-border border-t-0 bg-card px-3 py-2">
        <span className="text-primary font-mono text-sm">dana@catedralx:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="escribe un comando..."
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent border-none text-foreground font-mono text-sm focus:outline-none placeholder:text-muted-foreground/30"
          data-testid="input-terminal"
        />
        <span className="cursor-blink text-primary">_</span>
      </form>
    </div>
  );
}
