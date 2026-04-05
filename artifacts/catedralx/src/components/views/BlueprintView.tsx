import { useGetNervousState, getGetNervousStateQueryKey, useNervousTick, getGetVitalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/App";
import { useToast } from "@/hooks/use-toast";

type NervousState = {
  phi?: number;
  delta?: number;
  gwtFocus?: Array<{ variable?: string; weight?: number }>;
  gwtBroadcast?: string;
  synapticWeights?: number[][];
  pulse?: { dopamine?: number; adrenaline?: number; soma?: number; asymmetry?: number; liquidityTrap?: boolean };
  moduleActivations?: Record<string, number>;
  timestamp?: string;
};

function HeatCell({ value }: { value: number }) {
  const abs = Math.abs(value);
  const opacity = Math.min(abs * 2, 1);
  const color = value > 0 ? `rgba(0,255,65,${opacity})` : `rgba(255,0,51,${opacity})`;
  return (
    <div
      className="w-3 h-3 border border-border/20"
      style={{ backgroundColor: color }}
      title={value.toFixed(3)}
    />
  );
}

export default function BlueprintView() {
  const { user } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetNervousState({
    query: { queryKey: getGetNervousStateQueryKey(), refetchInterval: 60000 },
  });
  const tickMutation = useNervousTick();

  const ns = data as NervousState | undefined;
  const isSoberano = user?.tier === "soberano";

  function handleTick() {
    if (!isSoberano) {
      toast({ title: "Acceso restringido", description: "Se requiere plan Soberano para el tick neural.", variant: "destructive" });
      return;
    }
    tickMutation.mutate(
      {},
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetNervousStateQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetVitalsQueryKey() });
          toast({ title: "Tick neural", description: "Sistema nervioso actualizado." });
        },
      }
    );
  }

  const phi = ns?.phi ?? 0;
  const delta = ns?.delta ?? 0;
  const pulse = ns?.pulse;
  const focus = ns?.gwtFocus || [];
  const weights = ns?.synapticWeights;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-primary text-glow font-mono font-bold text-base">PLANO NEURAL — SISTEMA NERVIOSO DIGITAL</div>
          <div className="text-muted-foreground font-mono text-xs mt-0.5">IIT Phi · GWT · Aprendizaje Hebbiano · RPE</div>
        </div>
        <button
          onClick={handleTick}
          disabled={!isSoberano || tickMutation.isPending}
          className="text-xs font-mono px-3 py-1.5 border border-primary text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
          data-testid="button-tick"
        >
          {tickMutation.isPending ? "PROCESANDO..." : "TICK NEURAL"}
        </button>
      </div>

      {!isSoberano && (
        <div className="border border-secondary/30 bg-secondary/5 p-2 text-xs font-mono text-secondary">
          Plan Soberano requerido para activar el tick neural
        </div>
      )}

      {isLoading ? (
        <div className="text-xs font-mono text-primary animate-pulse">Cargando estado neural...</div>
      ) : (
        <>
          {/* Core metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="border border-glow bg-card p-3">
              <div className="text-xs font-mono text-muted-foreground mb-1">IIT PHI (Φ)</div>
              <div className="text-xl font-mono font-bold text-primary text-glow" data-testid="phi-value">{phi.toFixed(4)}</div>
            </div>
            <div className={`border bg-card p-3 ${delta >= 0 ? "border-primary/30" : "border-destructive/30"}`}>
              <div className="text-xs font-mono text-muted-foreground mb-1">DELTA (Δ)</div>
              <div className={`text-xl font-mono font-bold ${delta >= 0 ? "text-primary" : "text-destructive"}`}>
                {delta >= 0 ? "+" : ""}{delta.toFixed(4)}
              </div>
            </div>
            <div className="border border-border bg-card p-3">
              <div className="text-xs font-mono text-muted-foreground mb-1">DOPAMINA</div>
              <div className="text-xl font-mono font-bold text-accent">{(pulse?.dopamine ?? 0).toFixed(3)}</div>
            </div>
            <div className="border border-border bg-card p-3">
              <div className="text-xs font-mono text-muted-foreground mb-1">ADRENALINA</div>
              <div className="text-xl font-mono font-bold text-secondary text-glow-amber">{(pulse?.adrenaline ?? 0).toFixed(3)}</div>
            </div>
          </div>

          {/* Pulse bar */}
          {pulse && (
            <div className="border border-border bg-card p-3">
              <div className="text-xs font-mono text-muted-foreground tracking-widest mb-3">PULSO NEURONAL</div>
              <div className="space-y-2">
                {[
                  { key: "dopamine", label: "DOPAMINA", color: "bg-accent" },
                  { key: "adrenaline", label: "ADRENALINA", color: "bg-secondary" },
                  { key: "soma", label: "SOMA", color: "bg-primary" },
                ].map(({ key, label, color }) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="text-xs font-mono text-muted-foreground w-20 shrink-0">{label}</div>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${((pulse as Record<string, number>)[key] || 0) * 100}%` }} />
                    </div>
                    <div className="text-xs font-mono text-foreground w-10 text-right">{((pulse as Record<string, number>)[key] || 0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              {pulse.liquidityTrap && (
                <div className="mt-2 text-xs font-mono text-destructive">TRAMPA DE LIQUIDEZ DETECTADA</div>
              )}
            </div>
          )}

          {/* GWT Focus */}
          {focus.length > 0 && (
            <div className="border border-border bg-card p-3">
              <div className="text-xs font-mono text-muted-foreground tracking-widest mb-2">GWT — FOCO GLOBAL</div>
              <div className="space-y-1">
                {focus.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-primary w-4">{i + 1}.</span>
                    <span className="text-xs font-mono text-foreground flex-1">{f.variable}</span>
                    <div className="w-24 h-1 bg-muted rounded overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(f.weight || 0) * 100 * 10}%` }} />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-12 text-right">{(f.weight || 0).toFixed(3)}</span>
                  </div>
                ))}
              </div>
              {ns?.gwtBroadcast && (
                <div className="mt-2 text-xs font-mono text-primary/70">{ns.gwtBroadcast}</div>
              )}
            </div>
          )}

          {/* Synaptic heatmap */}
          {weights && weights.length > 0 && (
            <div className="border border-border bg-card p-3">
              <div className="text-xs font-mono text-muted-foreground tracking-widest mb-2">MAPA SINÁPTICO (14×14)</div>
              <div className="overflow-x-auto">
                <div className="flex flex-col gap-0.5 w-fit">
                  {weights.slice(0, 14).map((row, i) => (
                    <div key={i} className="flex gap-0.5">
                      {row.slice(0, 14).map((val, j) => (
                        <HeatCell key={j} value={val} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-primary inline-block" /> Positivo</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-destructive inline-block" /> Negativo</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
