import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLogin, useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthView() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "login") {
      loginMutation.mutate(
        { data: { email, password } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          },
          onError: (err: unknown) => {
            const error = err as { data?: { error?: string } };
            toast({ title: "Error", description: error?.data?.error || "Error al iniciar sesión.", variant: "destructive" });
          },
        }
      );
    } else {
      registerMutation.mutate(
        { data: { email, password, name: name || null } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          },
          onError: (err: unknown) => {
            const error = err as { data?: { error?: string } };
            toast({ title: "Error", description: error?.data?.error || "Error al registrarse.", variant: "destructive" });
          },
        }
      );
    }
  }

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="fixed inset-0 bg-background matrix-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="border border-border bg-card p-8">
          <div className="text-center mb-8">
            <div className="text-primary text-glow font-mono font-bold text-2xl tracking-widest mb-1">
              CATEDRALX
            </div>
            <div className="text-muted-foreground font-mono text-xs tracking-widest">
              CHALAMANDRA LABS — SISTEMA SOBERANO
            </div>
          </div>

          <div className="flex border border-border mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-xs font-mono tracking-widest transition-colors ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"}`}
              data-testid="tab-login"
            >
              ACCESO
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-xs font-mono tracking-widest transition-colors ${mode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"}`}
              data-testid="tab-register"
            >
              REGISTRO
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <div>
                <label className="text-xs font-mono text-muted-foreground tracking-widest block mb-1">NOMBRE</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Dana"
                  className="w-full bg-muted border border-border text-foreground font-mono text-sm px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  data-testid="input-name"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-mono text-muted-foreground tracking-widest block mb-1">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="dana@chalamandra.lab"
                className="w-full bg-muted border border-border text-foreground font-mono text-sm px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                data-testid="input-email"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground tracking-widest block mb-1">CONTRASEÑA</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-muted border border-border text-foreground font-mono text-sm px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                data-testid="input-password"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="mt-2 py-3 text-xs font-mono tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors border-glow"
              data-testid="button-submit"
            >
              {isPending ? "PROCESANDO..." : mode === "login" ? "INICIAR SESIÓN" : "CREAR CUENTA"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs font-mono text-muted-foreground">
            Tier inicial: <span className="text-primary">OBSERVADOR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
