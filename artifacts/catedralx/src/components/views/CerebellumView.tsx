import { useGetVitals, getGetVitalsQueryKey, useGetSignals, getGetSignalsQueryKey } from "@workspace/api-client-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

type SignalType = {
  id?: number;
  strategy?: string;
  type?: string;
  price?: number;
  confidence?: number;
  created_at?: string;
};

const SIGNAL_COLORS: Record<string, string> = {
  BUY: "#00FF41",
  SELL: "#FF0033",
  HOLD: "#FFB800",
  ALERT: "#FF6B00",
};

export default function CerebellumView() {
  const { data: vitals } = useGetVitals({
    query: { queryKey: getGetVitalsQueryKey(), refetchInterval: 30000 },
  });
  const { data: signalsData } = useGetSignals(
    { limit: 20 },
    { query: { queryKey: getGetSignalsQueryKey({ limit: 20 }), refetchInterval: 60000 } }
  );

  const v = vitals as {
    btc?: { price?: number; change24h?: number; volatility?: number };
    server?: { status?: string; latencyMs?: number; uptimeHours?: number };
  } | undefined;

  const signals = (signalsData as { signals?: SignalType[] } | undefined)?.signals || [];

  const btcPrice = v?.btc?.price || 0;
  const change24h = v?.btc?.change24h || 0;
  const volatility = v?.btc?.volatility || 0;

  const chartData = signals.slice(0, 10).reverse().map((s, i) => ({
    name: i.toString(),
    price: s.price || btcPrice,
    confidence: s.confidence || 50,
  }));

  if (chartData.length === 0 && btcPrice > 0) {
    chartData.push({ name: "0", price: btcPrice, confidence: 50 });
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-primary text-glow font-mono font-bold text-base">CEREBELO — ANÁLISIS DE MERCADO BTC</div>
        <div className="text-muted-foreground font-mono text-xs mt-0.5">Monitor de precio y análisis de señales en tiempo real</div>
      </div>

      {/* BTC price cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="border border-glow bg-card p-3">
          <div className="text-xs font-mono text-muted-foreground mb-1">PRECIO BTC</div>
          <div className="text-xl font-mono font-bold text-primary text-glow" data-testid="btc-price-display">
            {btcPrice > 0 ? `$${btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}
          </div>
        </div>
        <div className={`border bg-card p-3 ${change24h >= 0 ? "border-primary/30" : "border-destructive/30"}`}>
          <div className="text-xs font-mono text-muted-foreground mb-1">CAMBIO 24H</div>
          <div className={`text-xl font-mono font-bold ${change24h >= 0 ? "text-primary" : "text-destructive"}`}>
            {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%
          </div>
        </div>
        <div className="border border-border bg-card p-3">
          <div className="text-xs font-mono text-muted-foreground mb-1">VOLATILIDAD</div>
          <div className="text-xl font-mono font-bold text-secondary text-glow-amber">
            {volatility.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="border border-border bg-card p-4">
        <div className="text-xs font-mono text-muted-foreground tracking-widest mb-3">GRÁFICO DE PRECIO (señales recientes)</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,65,0.1)" />
            <XAxis dataKey="name" stroke="rgba(0,255,65,0.3)" tick={{ fontSize: 10, fontFamily: "monospace", fill: "rgba(0,255,65,0.5)" }} />
            <YAxis
              domain={["auto", "auto"]}
              stroke="rgba(0,255,65,0.3)"
              tick={{ fontSize: 10, fontFamily: "monospace", fill: "rgba(0,255,65,0.5)" }}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{ background: "#050505", border: "1px solid rgba(0,255,65,0.3)", fontFamily: "monospace", fontSize: "11px", color: "#00FF41" }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Precio BTC"]}
            />
            {btcPrice > 0 && <ReferenceLine y={btcPrice} stroke="rgba(0,255,65,0.5)" strokeDasharray="4 4" />}
            <Line type="monotone" dataKey="price" stroke="#00FF41" strokeWidth={2} dot={{ r: 3, fill: "#00FF41" }} activeDot={{ r: 5, fill: "#00FF41" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent signals */}
      <div className="border border-border bg-card">
        <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground tracking-widest">
          SEÑALES RECIENTES ({signals.length})
        </div>
        <div className="max-h-48 overflow-y-auto">
          {signals.length === 0 ? (
            <div className="p-4 text-xs font-mono text-muted-foreground/50">Sin señales disponibles. Genera señales desde el panel de Señales.</div>
          ) : (
            signals.map((s, i) => (
              <div key={s.id ?? i} className="flex items-center gap-3 px-4 py-2 border-b border-border/50 hover:bg-primary/5 transition-colors">
                <span
                  className="text-xs font-mono font-bold w-12 shrink-0"
                  style={{ color: SIGNAL_COLORS[s.type || "HOLD"] || "#FFB800" }}
                >
                  {s.type}
                </span>
                <span className="text-xs font-mono text-muted-foreground flex-1 truncate">{s.strategy}</span>
                <span className="text-xs font-mono text-primary shrink-0">{s.confidence}%</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
