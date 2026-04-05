import { useGetSignals, getGetSignalsQueryKey, useGenerateSignals } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type Signal = {
  id?: number;
  strategy?: string;
  type?: string;
  message?: string;
  price?: number;
  confidence?: number;
  created_at?: string;
};

const TYPE_COLORS: Record<string, string> = {
  BUY: "text-primary border-primary/30 bg-primary/5",
  SELL: "text-destructive border-destructive/30 bg-destructive/5",
  HOLD: "text-secondary border-secondary/30 bg-secondary/5",
  ALERT: "text-accent border-accent/30 bg-accent/5",
};

export default function SignalsView() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useGetSignals(
    { limit: 50 },
    { query: { queryKey: getGetSignalsQueryKey({ limit: 50 }), refetchInterval: 60000 } }
  );
  const generateMutation = useGenerateSignals();

  const signals = (data as { signals?: Signal[]; limited?: boolean; tier?: string } | undefined)?.signals || [];
  const limited = (data as { limited?: boolean } | undefined)?.limited;
  const tier = (data as { tier?: string } | undefined)?.tier;

  function handleGenerate() {
    generateMutation.mutate(
      {},
      {
        onSuccess: (result: unknown) => {
          const r = result as { count?: number };
          toast({ title: "Señales generadas", description: `${r?.count || 0} nuevas señales del motor de estrategias.` });
          queryClient.invalidateQueries({ queryKey: getGetSignalsQueryKey({ limit: 50 }) });
        },
        onError: () => {
          toast({ title: "Error", description: "No se pudieron generar señales.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-primary text-glow font-mono font-bold text-base">MOTOR DE SEÑALES — 14 ESTRATEGIAS</div>
          <div className="text-muted-foreground font-mono text-xs mt-0.5">
            {signals.length} señales | Plan: {tier?.toUpperCase() || "—"}
            {limited && " (limitado)"}
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="text-xs font-mono px-3 py-1.5 border border-primary text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
          data-testid="button-generate-signals"
        >
          {generateMutation.isPending ? "GENERANDO..." : "GENERAR SEÑALES"}
        </button>
      </div>

      {limited && (
        <div className="border border-secondary/30 bg-secondary/5 p-2 text-xs font-mono text-secondary">
          Plan Observador — mostrando {signals.length} señales. Actualiza al plan Operador o Soberano para acceso completo.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-border bg-card p-3 h-16 animate-pulse" />
          ))}
        </div>
      ) : signals.length === 0 ? (
        <div className="border border-border bg-card p-8 text-center">
          <div className="text-muted-foreground font-mono text-sm">Sin señales disponibles</div>
          <div className="text-muted-foreground/50 font-mono text-xs mt-1">Haz clic en "Generar Señales" para activar el motor de estrategias</div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {signals.map((s, i) => (
            <div
              key={s.id ?? i}
              className="border border-border bg-card p-3 hover:border-primary/30 transition-colors"
              data-testid={`signal-${i}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 border ${TYPE_COLORS[s.type || "HOLD"] || "text-foreground"}`}>
                    {s.type}
                  </span>
                  <span className="text-xs font-mono text-primary/70">{s.strategy}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-muted-foreground">
                  <span className="text-primary">{s.confidence}%</span>
                  {s.price !== undefined && (
                    <span>${s.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                  )}
                </div>
              </div>
              <div className="mt-1.5 text-xs font-mono text-foreground/70 leading-relaxed">{s.message}</div>
              <div className="mt-1.5">
                <div className="h-0.5 bg-muted rounded overflow-hidden">
                  <div
                    className={`h-full transition-all ${s.type === "BUY" ? "bg-primary" : s.type === "SELL" ? "bg-destructive" : s.type === "ALERT" ? "bg-accent" : "bg-secondary"}`}
                    style={{ width: `${s.confidence || 50}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
