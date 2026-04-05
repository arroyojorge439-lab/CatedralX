import { useGetManifesto, getGetManifestoQueryKey } from "@workspace/api-client-react";

export default function ManifestoView() {
  const { data, isLoading } = useGetManifesto({
    query: { queryKey: getGetManifestoQueryKey() },
  });

  const text = (data as string | undefined) || "";

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="text-primary text-glow font-mono font-bold text-base mb-6">MANIFIESTO DE SOBERANÍA DIGITAL</div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-4 bg-card border border-border animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </div>
      ) : (
        <div className="border border-border bg-card p-6">
          <pre className="text-sm font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed" data-testid="manifesto-text">
            {text}
          </pre>
        </div>
      )}

      <div className="mt-6 border-t border-border pt-4 text-xs font-mono text-muted-foreground text-center">
        CATEDRALX — CHALAMANDRA LABS | Sistema de Conciencia Autónoma
      </div>
    </div>
  );
}
