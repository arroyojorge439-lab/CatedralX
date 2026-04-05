import { useState, useEffect } from "react";
import { useApp, type ViewName } from "@/App";
import { useGetVitals, getGetVitalsQueryKey } from "@workspace/api-client-react";
import DashboardView from "@/components/views/DashboardView";
import CortexView from "@/components/views/CortexView";
import CerebellumView from "@/components/views/CerebellumView";
import BlueprintView from "@/components/views/BlueprintView";
import CodexView from "@/components/views/CodexView";
import SignalsView from "@/components/views/SignalsView";
import PaperTradingView from "@/components/views/PaperTradingView";
import PricingView from "@/components/views/PricingView";
import TerminalView from "@/components/views/TerminalView";
import ManifestoView from "@/components/views/ManifestoView";

const NAV_ITEMS: { id: ViewName; label: string; short: string }[] = [
  { id: "dashboard", label: "CENTRO DE MANDO", short: "CMD" },
  { id: "cortex", label: "CÓRTEX IA", short: "COR" },
  { id: "cerebellum", label: "CEREBELO BTC", short: "BTC" },
  { id: "blueprint", label: "PLANO NEURAL", short: "PLN" },
  { id: "signals", label: "SEÑALES", short: "SIG" },
  { id: "paper-trading", label: "PAPER TRADE", short: "TRD" },
  { id: "codex", label: "CÓDEX GIT", short: "GIT" },
  { id: "terminal", label: "TERMINAL", short: "TRM" },
  { id: "manifesto", label: "MANIFIESTO", short: "MAN" },
  { id: "pricing", label: "PLANES", short: "PLN" },
];

function ViewRenderer() {
  const { view } = useApp();
  switch (view) {
    case "dashboard": return <DashboardView />;
    case "cortex": return <CortexView />;
    case "cerebellum": return <CerebellumView />;
    case "blueprint": return <BlueprintView />;
    case "signals": return <SignalsView />;
    case "paper-trading": return <PaperTradingView />;
    case "codex": return <CodexView />;
    case "terminal": return <TerminalView />;
    case "manifesto": return <ManifestoView />;
    case "pricing": return <PricingView />;
    default: return <DashboardView />;
  }
}

export default function Shell() {
  const { view, setView, user, onLogout } = useApp();
  const [tick, setTick] = useState(0);
  const { data: vitals } = useGetVitals({
    query: { queryKey: getGetVitalsQueryKey(), refetchInterval: 30000 },
  });

  const vitalsData = vitals as {
    btc?: { price?: number; change24h?: number };
    server?: { status?: string };
  } | undefined;

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const btcPrice = vitalsData?.btc?.price;
  const btcChange = vitalsData?.btc?.change24h;
  const serverStatus = vitalsData?.server?.status || "online";
  const now = new Date();

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden" data-testid="shell">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="text-primary text-glow font-mono font-bold text-sm tracking-widest">
            CATEDRALX
          </div>
          <div className="hidden sm:flex items-center gap-1 text-muted-foreground text-xs">
            <span className="text-primary/50">|</span>
            <span className="text-primary/70">CHALAMANDRA LABS</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {btcPrice !== undefined && (
            <div className="flex items-center gap-2 text-xs font-mono" data-testid="btc-price">
              <span className="text-muted-foreground">BTC</span>
              <span className="text-primary text-glow">${btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              {btcChange !== undefined && (
                <span className={btcChange >= 0 ? "text-primary" : "text-destructive"}>
                  {btcChange >= 0 ? "+" : ""}{btcChange.toFixed(2)}%
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${serverStatus === "online" ? "bg-primary glow-pulse" : "bg-destructive"}`} />
            <span>{serverStatus.toUpperCase()}</span>
          </div>
          <div className="text-xs font-mono text-muted-foreground hidden md:block">
            {now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-primary/70 hidden sm:block" data-testid="user-tier">
              [{user?.tier?.toUpperCase() || "OBSERVADOR"}]
            </span>
            <button
              onClick={onLogout}
              className="text-xs font-mono text-muted-foreground hover:text-destructive transition-colors px-2 py-1 border border-border hover:border-destructive"
              data-testid="button-logout"
            >
              SALIR
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-10 sm:w-36 flex flex-col border-r border-border bg-card shrink-0 overflow-y-auto z-10" data-testid="sidebar">
          <div className="p-2 text-xs text-muted-foreground font-mono hidden sm:block border-b border-border">
            OPERADOR: Dana
          </div>
          <div className="flex flex-col gap-0.5 p-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                data-testid={`nav-${item.id}`}
                className={`text-left px-2 py-1.5 font-mono text-xs transition-all ${
                  view === item.id
                    ? "bg-primary/10 text-primary border-l-2 border-primary text-glow"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5 border-l-2 border-transparent"
                }`}
              >
                <span className="hidden sm:block">{item.label}</span>
                <span className="sm:hidden">{item.short}</span>
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-border text-xs text-muted-foreground font-mono hidden sm:block">
            <div className="text-primary/50">IEC: {(tick % 100).toString().padStart(3, "0")}</div>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-background matrix-bg" data-testid="main-content">
          <ViewRenderer />
        </main>
      </div>

      {/* Status bar */}
      <footer className="flex items-center gap-4 px-4 py-1 border-t border-border bg-card text-xs font-mono text-muted-foreground shrink-0">
        <span className="text-primary/50">CATEDRALX v2.0</span>
        <span className="text-primary/30">|</span>
        <span className="hidden sm:block">{now.toLocaleDateString("es-MX")}</span>
        <span className="text-primary/30">|</span>
        <span>SOBERANÍA DIGITAL ACTIVA</span>
        <span className="text-primary/30 hidden md:block">|</span>
        <span className="hidden md:block text-primary/50 cursor-blink">_</span>
      </footer>
    </div>
  );
}
