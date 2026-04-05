import { useState } from "react";
import { useAiGenerate } from "@workspace/api-client-react";
import { useApp } from "@/App";
import { useToast } from "@/hooks/use-toast";

const LOBES = [
  {
    id: "frontal",
    label: "LÓBULO FRONTAL",
    description: "Mentor empático — reflexión estratégica y visión integradora",
    color: "text-primary",
  },
  {
    id: "motor",
    label: "TALLO MOTOR",
    description: "Ejecutivo directo — acción, precisión, velocidad",
    color: "text-secondary",
  },
  {
    id: "wernicke",
    label: "ÁREA DE WERNICKE",
    description: "Poeta-analista — patrones, narrativa, metáfora",
    color: "text-accent",
  },
];

export default function CortexView() {
  const { user } = useApp();
  const { toast } = useToast();
  const [activeLobe, setActiveLobe] = useState("frontal");
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const aiMutation = useAiGenerate();

  const isSoberano = user?.tier === "soberano";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    if (!isSoberano) {
      toast({ title: "Acceso restringido", description: "Se requiere plan Soberano para activar los lóbulos de IA.", variant: "destructive" });
      return;
    }

    aiMutation.mutate(
      { data: { lobe: activeLobe, prompt } },
      {
        onSuccess: (result: unknown) => {
          const r = result as { text?: string };
          setResponses(prev => ({ ...prev, [activeLobe]: r?.text || "" }));
          setPrompt("");
        },
        onError: (err: unknown) => {
          const e = err as { data?: { error?: string } };
          toast({ title: "Error IA", description: e?.data?.error || "Error al consultar la IA.", variant: "destructive" });
        },
      }
    );
  }

  const activeLobeMeta = LOBES.find(l => l.id === activeLobe)!;

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-primary text-glow font-mono font-bold text-base">CÓRTEX DE INTELIGENCIA ARTIFICIAL</div>
        <div className="text-muted-foreground font-mono text-xs mt-0.5">3 lóbulos activos — sistema neural distribuido</div>
      </div>

      {!isSoberano && (
        <div className="border border-secondary bg-secondary/5 p-3 text-xs font-mono text-secondary">
          ACCESO LIMITADO — Plan Soberano requerido para activar los lóbulos de IA
        </div>
      )}

      {/* Lobe selector */}
      <div className="flex gap-0 border border-border">
        {LOBES.map(lobe => (
          <button
            key={lobe.id}
            onClick={() => setActiveLobe(lobe.id)}
            data-testid={`lobe-${lobe.id}`}
            className={`flex-1 py-2 px-2 text-xs font-mono tracking-widest transition-colors text-center ${
              activeLobe === lobe.id
                ? `bg-primary/10 ${lobe.color} border-b-2 border-primary`
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="hidden sm:block">{lobe.label}</span>
            <span className="sm:hidden">{lobe.id.toUpperCase().slice(0, 3)}</span>
          </button>
        ))}
      </div>

      {/* Active lobe info */}
      <div className="border border-border bg-card p-3">
        <div className={`text-sm font-mono font-bold ${activeLobeMeta.color}`}>{activeLobeMeta.label}</div>
        <div className="text-xs font-mono text-muted-foreground mt-1">{activeLobeMeta.description}</div>
      </div>

      {/* Response area */}
      <div className="border border-border bg-card p-4 min-h-32">
        <div className="text-xs font-mono text-muted-foreground tracking-widest mb-2">RESPUESTA DEL SISTEMA</div>
        {aiMutation.isPending ? (
          <div className="text-xs font-mono text-primary animate-pulse">
            Procesando consulta neural<span className="cursor-blink">_</span>
          </div>
        ) : responses[activeLobe] ? (
          <div className="text-sm font-mono text-foreground whitespace-pre-wrap leading-relaxed" data-testid="ai-response">
            {responses[activeLobe]}
          </div>
        ) : (
          <div className="text-xs font-mono text-muted-foreground/50">
            Ingresa una consulta para activar el lóbulo {activeLobeMeta.label}
            <span className="cursor-blink">_</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={!isSoberano || aiMutation.isPending}
          placeholder={isSoberano ? `Consulta al ${activeLobeMeta.label}...` : "Plan Soberano requerido"}
          rows={3}
          className="w-full bg-card border border-border text-foreground font-mono text-sm px-3 py-2 focus:outline-none focus:border-primary resize-none disabled:opacity-50"
          data-testid="input-prompt"
          onKeyDown={e => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!isSoberano || aiMutation.isPending || !prompt.trim()}
          className="py-2 text-xs font-mono tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          data-testid="button-send"
        >
          {aiMutation.isPending ? "PROCESANDO..." : `CONSULTAR ${activeLobeMeta.label}`}
        </button>
      </form>
    </div>
  );
}
