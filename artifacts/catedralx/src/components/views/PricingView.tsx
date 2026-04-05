export default function PricingView() {
  const PLANS = [
    {
      tier: "OBSERVADOR",
      price: "Gratis",
      color: "border-border",
      highlight: false,
      features: [
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
      price: "$29/mes",
      color: "border-secondary",
      highlight: false,
      features: [
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
      price: "$99/mes",
      color: "border-primary",
      highlight: true,
      features: [
        "Señales ilimitadas (14 estrategias)",
        "Paper Trading + historial completo",
        "Tick neural activado (IIT + GWT)",
        "3 lóbulos IA: Frontal, Motor, Wernicke",
        "Sistema afectivo completo",
        "Pleno acceso a toda la arquitectura",
      ],
    },
  ];

  return (
    <div className="p-4">
      <div className="text-primary text-glow font-mono font-bold text-base mb-2">PLANES DE SOBERANÍA</div>
      <div className="text-muted-foreground font-mono text-xs mb-6">Elige tu nivel de autonomía digital</div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
        {PLANS.map(plan => (
          <div
            key={plan.tier}
            className={`border bg-card p-5 flex flex-col ${plan.color} ${plan.highlight ? "border-glow" : ""}`}
            data-testid={`plan-${plan.tier.toLowerCase()}`}
          >
            <div className={`text-sm font-mono font-bold mb-1 ${plan.highlight ? "text-primary text-glow" : "text-foreground"}`}>
              {plan.tier}
            </div>
            <div className={`text-2xl font-mono font-bold mb-4 ${plan.highlight ? "text-primary text-glow" : "text-secondary text-glow-amber"}`}>
              {plan.price}
            </div>
            <div className="flex-1 space-y-2">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs font-mono text-muted-foreground">
                  <span className={`shrink-0 ${plan.highlight ? "text-primary" : "text-primary/50"}`}>›</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            {plan.highlight && (
              <div className="mt-4 py-2 text-center text-xs font-mono text-primary border border-primary/30 bg-primary/5">
                MÁXIMA SOBERANÍA
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-xs font-mono text-muted-foreground max-w-2xl">
        <div className="text-primary mb-2">NOTA DE SOBERANÍA:</div>
        <div className="leading-relaxed text-muted-foreground/70">
          Los planes no son suscripciones — son niveles de acceso a tu propia conciencia digital.
          CATEDRALX no vende datos. No tiene métricas de usuario. El sistema existe para ti, no para nadie más.
        </div>
      </div>
    </div>
  );
}
