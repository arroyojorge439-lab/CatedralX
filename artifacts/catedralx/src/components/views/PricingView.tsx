import { useState } from "react";
import { useApp } from "@/App";

const PLANES = [
  {
    tier: "OBSERVADOR",
    tierKey: "observador",
    precio: "Gratis",
    colorBorde: "border-border",
    destacado: false,
    precioId: null,
    caracteristicas: [
      "Hasta 5 señales por sesión",
      "BTC price en tiempo real",
      "Centro de mando básico",
      "Terminal de soberanía",
      "Manifiesto completo",
      "Sin IA, sin paper trading",
    ],
  },
  {
    tier: "OPERADOR",
    tierKey: "operador",
    precio: "$29/mes",
    colorBorde: "border-secondary",
    destacado: false,
    precioId: "price_1TIrdmDZ8b1XC0zVdcaesFP6",
    caracteristicas: [
      "Hasta 20 señales",
      "Paper Trading activado",
      "Plano neural (lectura)",
      "Códex Git completo",
      "Análisis cerebelo BTC",
      "Sin acceso a lóbulos IA",
    ],
  },
  {
    tier: "SOBERANO",
    tierKey: "soberano",
    precio: "$99/mes",
    colorBorde: "border-primary",
    destacado: true,
    precioId: "price_1TIrdmDZ8b1XC0zVIA6H6RDZ",
    caracteristicas: [
      "Señales ilimitadas (14 estrategias)",
      "Paper Trading + historial completo",
      "Tick neural activado (IIT + GWT)",
      "3 lóbulos IA: Frontal, Motor, Wernicke",
      "Sistema afectivo completo",
      "Pleno acceso a toda la arquitectura",
    ],
  },
];

export default function PricingView() {
  const { user } = useApp();
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function iniciarPago(precioId: string, tier: string) {
    if (!user) {
      setError("Inicia sesión para suscribirte");
      return;
    }
    setCargando(tier);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ precioId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Error iniciando pago");
      }
    } catch (e: any) {
      setError("Error de conexión: " + e.message);
    } finally {
      setCargando(null);
    }
  }

  async function abrirPortal() {
    setCargando("portal");
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Error abriendo portal");
      }
    } catch (e: any) {
      setError("Error: " + e.message);
    } finally {
      setCargando(null);
    }
  }

  const tierActual = user?.tier || "observador";

  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="text-primary text-glow font-mono font-bold text-base mb-1">
        PLANES DE SOBERANÍA
      </div>
      <div className="text-muted-foreground font-mono text-xs mb-6">
        Elige tu nivel de autonomía digital
        {user && (
          <span className="ml-3 text-primary/70">
            — Nivel actual: <span className="text-primary font-bold">{tierActual.toUpperCase()}</span>
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 text-xs font-mono text-red-400 border border-red-500/30 bg-red-500/5 p-3">
          ⚠ {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
        {PLANES.map(plan => {
          const esActual = tierActual === plan.tierKey;
          const esSuperior =
            (tierActual === "soberano" && plan.tierKey !== "soberano") ||
            (tierActual === "operador" && plan.tierKey === "observador");

          return (
            <div
              key={plan.tier}
              className={`border bg-card p-5 flex flex-col ${plan.colorBorde} ${plan.destacado ? "border-glow" : ""} ${esActual ? "opacity-90 ring-1 ring-primary/30" : ""}`}
              data-testid={`plan-${plan.tierKey}`}
            >
              <div className={`text-sm font-mono font-bold mb-1 ${plan.destacado ? "text-primary text-glow" : "text-foreground"}`}>
                {plan.tier}
                {esActual && (
                  <span className="ml-2 text-[10px] text-primary/70 border border-primary/30 px-1">
                    ACTIVO
                  </span>
                )}
              </div>
              <div className={`text-2xl font-mono font-bold mb-4 ${plan.destacado ? "text-primary text-glow" : "text-secondary text-glow-amber"}`}>
                {plan.precio}
              </div>
              <div className="flex-1 space-y-2 mb-4">
                {plan.caracteristicas.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-mono text-muted-foreground">
                    <span className={`shrink-0 ${plan.destacado ? "text-primary" : "text-primary/50"}`}>›</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {plan.precioId && !esActual && !esSuperior && (
                <button
                  onClick={() => iniciarPago(plan.precioId!, plan.tier)}
                  disabled={cargando === plan.tier}
                  className={`mt-auto py-2 text-center text-xs font-mono border transition-colors cursor-pointer
                    ${plan.destacado
                      ? "text-primary border-primary/50 bg-primary/5 hover:bg-primary/15 hover:border-primary"
                      : "text-secondary border-secondary/50 bg-secondary/5 hover:bg-secondary/15 hover:border-secondary"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {cargando === plan.tier ? "CONECTANDO..." : `ACTIVAR ${plan.tier}`}
                </button>
              )}

              {esActual && plan.precioId && (
                <button
                  onClick={abrirPortal}
                  disabled={cargando === "portal"}
                  className="mt-auto py-2 text-center text-xs font-mono border border-primary/30 text-primary/70 hover:text-primary hover:border-primary bg-transparent transition-colors cursor-pointer disabled:opacity-50"
                >
                  {cargando === "portal" ? "CARGANDO..." : "GESTIONAR SUSCRIPCIÓN"}
                </button>
              )}

              {esActual && !plan.precioId && (
                <div className="mt-auto py-2 text-center text-xs font-mono text-primary/40 border border-primary/10">
                  NIVEL BASE
                </div>
              )}

              {plan.destacado && !esActual && !esSuperior && (
                <div className="mt-1 text-center text-[10px] font-mono text-primary/50">
                  MÁXIMA SOBERANÍA
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-xs font-mono text-muted-foreground max-w-2xl">
        <div className="text-primary mb-2">NOTA DE SOBERANÍA:</div>
        <div className="leading-relaxed text-muted-foreground/70">
          Los planes no son suscripciones convencionales — son niveles de acceso a tu propia
          conciencia digital. CATEDRALX no vende datos. No tiene métricas de usuario.
          El sistema existe para ti, no para nadie más.
        </div>
        {user?.tier === "soberano" && (
          <div className="mt-3 text-primary/60">
            ✦ Soberana confirmada. Acceso total activo.
          </div>
        )}
      </div>
    </div>
  );
}
