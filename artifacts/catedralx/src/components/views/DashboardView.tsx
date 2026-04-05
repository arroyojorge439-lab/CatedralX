import { useGetVitals, getGetVitalsQueryKey, useInvokeStrategy } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const STRATEGIES = [
  "SCHEHERAZADE", "HERMES", "CARROLL", "LA HACKER", "TRICKSTER",
  "LA IA", "EL NIÑO DE 8 AÑOS", "EL VACÍO", "LA SOMBRA", "LA PARADOJA",
  "EL ESPEJO", "LA ESCOTILLA", "EL RAYO", "LA CATEDRAL"
];

const HOURS = new Date().getHours();
const GREETING = HOURS < 5 ? "Buenas noches, Dana" : HOURS < 12 ? "Buenos días, Dana" : HOURS < 18 ? "Buenas tardes, Dana" : "Buenas noches, Dana";

function StatBox({ label, value, sub, glow = false }: { label: string; value: string | number; sub?: string; glow?: boolean }) {
  return (
    <div className={`border p-3 bg-card ${glow ? "border-glow" : "border-border"}`}>
      <div className="text-xs font-mono text-muted-foreground tracking-widest mb-1">{label}</div>
      <div className={`text-lg font-mono font-bold ${glow ? "text-primary text-glow" : "text-foreground"}`}>{value}</div>
      {sub && <div className="text-xs font-mono text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export default function DashboardView() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useGetVitals({
    query: { queryKey: getGetVitalsQueryKey(), refetchInterval: 30000 },
  });
  const invokeMutation = useInvokeStrategy();

  const v = data as {
    btc?: { price?: number; change24h?: number; volatility?: number };
    server?: { latencyMs?: number; uptimeHours?: number; status?: string };
    signals?: { totalCount?: number; lastSignal?: { type?: string; strategy?: string } | null };
    trading?: { tradeCount?: number; pnlPercent?: number };
    affective?: { valencia?: number; activacion?: number; persistencia?: number };
    user?: { tier?: string };
  } | undefined;

  function invokeStrategy(idx: number) {
    invokeMutation.mutate(
      { id: idx },
      {
        onSuccess: (result: unknown) => {
          const r = result as { message?: string };
          toast({ title: `Estrategia ${STRATEGIES[idx]}`, description: r?.message || "Señal generada." });
          queryClient.invalidateQueries({ queryKey: getGetVitalsQueryKey() });
        },
      }
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-primary text-glow font-mono font-bold text-base">{GREETING}</div>
          <div className="text-muted-foreground font-mono text-xs mt-0.5">STATUS: SOBERANO | CATEDRALX ACTIVO</div>
        </div>
        {v?.user?.tier && (
          <div className="border border-primary px-3 py-1 text-xs font-mono text-primary text-glow" data-testid="tier-badge">
            {v.user.tier.toUpperCase()}
          </div>
        )}
      </div>

      {/* Vitals grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border border-border bg-card p-3 h-16 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatBox
            label="BTC/USD"
            value={v?.btc?.price !== undefined ? `$${v.btc.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}
            sub={v?.btc?.change24h !== undefined ? `${v.btc.change24h >= 0 ? "+" : ""}${v.btc.change24h.toFixed(2)}% 24h` : undefined}
            glow
          />
          <StatBox
            label="SEÑALES"
            value={v?.signals?.totalCount ?? "—"}
            sub={v?.signals?.lastSignal?.type ? `Último: ${v.signals.lastSignal.type}` : undefined}
          />
          <StatBox
            label="PNL PAPER"
            value={v?.trading?.pnlPercent !== undefined ? `${v.trading.pnlPercent >= 0 ? "+" : ""}${v.trading.pnlPercent.toFixed(2)}%` : "—"}
            sub={`${v?.trading?.tradeCount ?? 0} trades`}
          />
          <StatBox
            label="LATENCIA"
            value={v?.server?.latencyMs !== undefined ? `${v.server.latencyMs}ms` : "—"}
            sub={v?.server?.status?.toUpperCase()}
          />
        </div>
      )}

      {/* Affective state */}
      {v?.affective && (
        <div className="border border-border bg-card p-3">
          <div className="text-xs font-mono text-muted-foreground tracking-widest mb-2">ESTADO AFECTIVO</div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: "valencia", label: "VALENCIA", color: "bg-primary" },
              { key: "activacion", label: "ACTIVACIÓN", color: "bg-secondary" },
              { key: "persistencia", label: "PERSISTENCIA", color: "bg-accent" },
            ].map(({ key, label, color }) => (
              <div key={key}>
                <div className="text-xs font-mono text-muted-foreground mb-1">{label}</div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} transition-all duration-1000`}
                    style={{ width: `${((v.affective as Record<string, number>)[key] || 0) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-mono text-primary mt-0.5">
                  {((v.affective as Record<string, number>)[key] || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategies grid */}
      <div>
        <div className="text-xs font-mono text-muted-foreground tracking-widest mb-2">14 ESTRATEGIAS — SISTEMA ACTIVO</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1.5">
          {STRATEGIES.map((name, idx) => (
            <button
              key={name}
              onClick={() => invokeStrategy(idx)}
              disabled={invokeMutation.isPending}
              data-testid={`strategy-${idx}`}
              className="border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all p-2 text-left group"
            >
              <div className="text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors truncate">
                {name}
              </div>
              <div className="text-xs font-mono text-primary/30 mt-0.5">[{idx.toString().padStart(2, "0")}]</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
