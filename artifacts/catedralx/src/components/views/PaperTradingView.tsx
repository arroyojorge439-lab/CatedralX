import { useState } from "react";
import { useGetPortfolio, getGetPortfolioQueryKey, useExecuteTrade, useGetTradeHistory, getGetTradeHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/App";

type TradeItem = {
  id?: number;
  action?: string;
  amountUsd?: number;
  btcAmount?: number;
  btcPrice?: number;
  strategy?: string;
  createdAt?: string;
};

export default function PaperTradingView() {
  const { user } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");

  const { data: portfolioData, isLoading } = useGetPortfolio({
    query: { queryKey: getGetPortfolioQueryKey(), refetchInterval: 30000 },
  });
  const { data: historyData } = useGetTradeHistory({
    query: { queryKey: getGetTradeHistoryQueryKey() },
  });
  const tradeMutation = useExecuteTrade();

  const portfolio = (portfolioData as { portfolio?: Record<string, unknown>; btcPrice?: number } | undefined)?.portfolio;
  const btcPrice = (portfolioData as { btcPrice?: number } | undefined)?.btcPrice || 0;
  const trades = (historyData as { trades?: TradeItem[] } | undefined)?.trades || [];

  const isSoberano = user?.tier === "soberano" || user?.tier === "operador";

  function handleTrade(e: React.FormEvent) {
    e.preventDefault();
    const amountUsd = parseFloat(amount);
    if (!amountUsd || amountUsd <= 0) {
      toast({ title: "Monto inválido", description: "Ingresa un monto válido en USD.", variant: "destructive" });
      return;
    }
    tradeMutation.mutate(
      { data: { action, amountUsd, strategy: null } },
      {
        onSuccess: (result: unknown) => {
          const r = result as { message?: string };
          toast({ title: "Operación ejecutada", description: r?.message || "Trade completado." });
          setAmount("");
          queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTradeHistoryQueryKey() });
        },
        onError: (err: unknown) => {
          const e = err as { data?: { error?: string } };
          toast({ title: "Error", description: e?.data?.error || "Error al ejecutar operación.", variant: "destructive" });
        },
      }
    );
  }

  const balanceUsd = parseFloat(String(portfolio?.balanceUsd || 0));
  const btcAmount = parseFloat(String(portfolio?.btcAmount || 0));
  const totalValue = parseFloat(String((portfolio as Record<string, unknown>)?.totalValue || balanceUsd));
  const pnlPercent = parseFloat(String((portfolio as Record<string, unknown>)?.pnlPercent || 0));
  const pnl = parseFloat(String((portfolio as Record<string, unknown>)?.pnl || 0));

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-primary text-glow font-mono font-bold text-base">PAPER TRADING — TERMINAL DE OPERACIONES</div>
        <div className="text-muted-foreground font-mono text-xs mt-0.5">Capital inicial: $100,000 USD | BTC a ${btcPrice.toLocaleString()}</div>
      </div>

      {!isSoberano && (
        <div className="border border-secondary/30 bg-secondary/5 p-2 text-xs font-mono text-secondary">
          Plan Operador o Soberano requerido para Paper Trading
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => <div key={i} className="border border-border bg-card p-3 h-16 animate-pulse" />)}
        </div>
      ) : portfolio ? (
        <>
          {/* Portfolio stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="border border-border bg-card p-3">
              <div className="text-xs font-mono text-muted-foreground mb-1">USD DISPONIBLE</div>
              <div className="text-base font-mono font-bold text-foreground">${balanceUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
            </div>
            <div className="border border-border bg-card p-3">
              <div className="text-xs font-mono text-muted-foreground mb-1">BTC HOLDINGS</div>
              <div className="text-base font-mono font-bold text-primary text-glow">{btcAmount.toFixed(6)}</div>
            </div>
            <div className="border border-border bg-card p-3">
              <div className="text-xs font-mono text-muted-foreground mb-1">VALOR TOTAL</div>
              <div className="text-base font-mono font-bold text-foreground">${totalValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
            </div>
            <div className={`border bg-card p-3 ${pnlPercent >= 0 ? "border-primary/30" : "border-destructive/30"}`}>
              <div className="text-xs font-mono text-muted-foreground mb-1">PNL</div>
              <div className={`text-base font-mono font-bold ${pnlPercent >= 0 ? "text-primary" : "text-destructive"}`}>
                {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
              </div>
              <div className={`text-xs font-mono ${pnl >= 0 ? "text-primary/70" : "text-destructive/70"}`}>
                {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Trade form */}
          {isSoberano && (
            <form onSubmit={handleTrade} className="border border-border bg-card p-4">
              <div className="text-xs font-mono text-muted-foreground tracking-widest mb-3">EJECUTAR OPERACIÓN</div>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setAction("buy")}
                  className={`flex-1 py-2 text-xs font-mono tracking-widest border transition-colors ${action === "buy" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                  data-testid="button-buy"
                >
                  COMPRAR BTC
                </button>
                <button
                  type="button"
                  onClick={() => setAction("sell")}
                  className={`flex-1 py-2 text-xs font-mono tracking-widest border transition-colors ${action === "sell" ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground"}`}
                  data-testid="button-sell"
                >
                  VENDER BTC
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Monto en USD"
                  min="1"
                  step="100"
                  className="flex-1 bg-muted border border-border text-foreground font-mono text-sm px-3 py-2 focus:outline-none focus:border-primary"
                  data-testid="input-amount"
                />
                <button
                  type="submit"
                  disabled={tradeMutation.isPending}
                  className={`px-4 py-2 text-xs font-mono tracking-widest transition-colors disabled:opacity-50 ${action === "buy" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}`}
                  data-testid="button-execute-trade"
                >
                  {tradeMutation.isPending ? "..." : action === "buy" ? "COMPRAR" : "VENDER"}
                </button>
              </div>
              {amount && btcPrice > 0 && (
                <div className="mt-2 text-xs font-mono text-muted-foreground">
                  ≈ {(parseFloat(amount) / btcPrice).toFixed(8)} BTC @ ${btcPrice.toLocaleString()}
                </div>
              )}
            </form>
          )}
        </>
      ) : null}

      {/* Trade history */}
      <div className="border border-border bg-card">
        <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground tracking-widest">
          HISTORIAL DE OPERACIONES ({trades.length})
        </div>
        <div className="max-h-48 overflow-y-auto">
          {trades.length === 0 ? (
            <div className="p-4 text-xs font-mono text-muted-foreground/50">Sin operaciones registradas.</div>
          ) : (
            trades.map((t, i) => (
              <div key={t.id ?? i} className="flex items-center gap-3 px-4 py-2 border-b border-border/50 text-xs font-mono hover:bg-primary/5" data-testid={`trade-${i}`}>
                <span className={`font-bold w-12 shrink-0 ${t.action === "buy" ? "text-primary" : "text-destructive"}`}>
                  {t.action?.toUpperCase()}
                </span>
                <span className="text-muted-foreground">${(t.amountUsd || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                <span className="text-primary/70">{(t.btcAmount || 0).toFixed(6)} BTC</span>
                <span className="text-muted-foreground/50 ml-auto">${(t.btcPrice || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
