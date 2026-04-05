import { useState } from "react";
import { useGetGitStatus, getGetGitStatusQueryKey, useGitAdd, useGitCommit, useGitPush, useGetLocalRepos, getGetLocalReposQueryKey, useGetGithubRepos, getGetGithubReposQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type Repo = { id?: string; nombre?: string; capa?: string; peso_w?: number; descripcion?: string; url?: string };
type GhRepo = { id?: number; name?: string; html_url?: string; description?: string; stargazers_count?: number; language?: string };

export default function CodexView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commitMsg, setCommitMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"git" | "repos">("git");

  const { data: statusData, isLoading: statusLoading } = useGetGitStatus({
    query: { queryKey: getGetGitStatusQueryKey(), refetchInterval: 30000 },
  });
  const { data: localRepos } = useGetLocalRepos({
    query: { queryKey: getGetLocalReposQueryKey() },
  });
  const { data: githubRepos } = useGetGithubRepos("arroyojorge439-lab", {
    query: { queryKey: getGetGithubReposQueryKey("arroyojorge439-lab") },
  });

  const addMutation = useGitAdd();
  const commitMutation = useGitCommit();
  const pushMutation = useGitPush();

  const status = statusData as { branch?: string; lastCommit?: string; changedFiles?: Record<string, string>; fileCount?: number } | undefined;
  const repos = (localRepos as Repo[] | undefined) || [];
  const ghRepos = (githubRepos as GhRepo[] | undefined) || [];

  function handleAdd() {
    addMutation.mutate(
      { data: {} },
      {
        onSuccess: () => {
          toast({ title: "Archivos preparados", description: "git add . ejecutado." });
          queryClient.invalidateQueries({ queryKey: getGetGitStatusQueryKey() });
        },
      }
    );
  }

  function handleCommit(e: React.FormEvent) {
    e.preventDefault();
    if (!commitMsg.trim()) return;
    commitMutation.mutate(
      { data: { message: commitMsg } },
      {
        onSuccess: (result: unknown) => {
          const r = result as { message?: string };
          toast({ title: "Commit creado", description: r?.message });
          setCommitMsg("");
          queryClient.invalidateQueries({ queryKey: getGetGitStatusQueryKey() });
        },
        onError: (err: unknown) => {
          const e = err as { data?: { message?: string } };
          toast({ title: "Error commit", description: e?.data?.message || "Error al hacer commit.", variant: "destructive" });
        },
      }
    );
  }

  function handlePush() {
    pushMutation.mutate(
      {},
      {
        onSuccess: (result: unknown) => {
          const r = result as { message?: string };
          toast({ title: "Push completado", description: r?.message });
        },
        onError: (err: unknown) => {
          const e = err as { data?: { message?: string } };
          toast({ title: "Error push", description: e?.data?.message || "Error al hacer push.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-primary text-glow font-mono font-bold text-base">CÓDEX — GESTIÓN GIT & REPOSITORIOS</div>
        <div className="text-muted-foreground font-mono text-xs mt-0.5">Control de versiones y explorador de repos</div>
      </div>

      {/* Tab switcher */}
      <div className="flex border border-border">
        <button onClick={() => setActiveTab("git")} className={`flex-1 py-2 text-xs font-mono tracking-widest transition-colors ${activeTab === "git" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`} data-testid="tab-git">
          GIT STATUS
        </button>
        <button onClick={() => setActiveTab("repos")} className={`flex-1 py-2 text-xs font-mono tracking-widest transition-colors ${activeTab === "repos" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`} data-testid="tab-repos">
          REPOSITORIOS
        </button>
      </div>

      {activeTab === "git" && (
        <div className="space-y-3">
          {/* Git status info */}
          {statusLoading ? (
            <div className="border border-border bg-card p-4 animate-pulse h-20" />
          ) : status ? (
            <div className="border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-mono text-muted-foreground tracking-widest">ESTADO DEL REPOSITORIO</div>
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: getGetGitStatusQueryKey() })}
                  className="text-xs font-mono text-primary hover:text-primary/70"
                >
                  REFRESCAR
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                <div><span className="text-muted-foreground">BRANCH: </span><span className="text-primary">{status.branch || "—"}</span></div>
                <div><span className="text-muted-foreground">ARCHIVOS: </span><span className="text-secondary text-glow-amber">{status.fileCount || 0}</span></div>
              </div>
              {status.lastCommit && (
                <div className="text-xs font-mono text-muted-foreground mb-2">ÚLTIMO COMMIT: {status.lastCommit}</div>
              )}
              {status.changedFiles && Object.keys(status.changedFiles).length > 0 && (
                <div className="max-h-32 overflow-y-auto border border-border/50 p-2">
                  {Object.entries(status.changedFiles).map(([file, fileStatus]) => (
                    <div key={file} className="flex items-center gap-2 text-xs font-mono py-0.5">
                      <span className={`w-4 font-bold ${fileStatus === "M" ? "text-secondary" : fileStatus === "A" ? "text-primary" : fileStatus === "D" ? "text-destructive" : "text-muted-foreground"}`}>
                        {fileStatus}
                      </span>
                      <span className="text-foreground/70 truncate">{file}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Git actions */}
          <div className="border border-border bg-card p-4 space-y-3">
            <div className="text-xs font-mono text-muted-foreground tracking-widest">OPERACIONES GIT</div>
            <button
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="w-full py-2 text-xs font-mono tracking-widest border border-border text-foreground hover:border-primary hover:text-primary disabled:opacity-50 transition-colors"
              data-testid="button-git-add"
            >
              {addMutation.isPending ? "PREPARANDO..." : "git add ."}
            </button>
            <form onSubmit={handleCommit} className="flex gap-2">
              <input
                type="text"
                value={commitMsg}
                onChange={e => setCommitMsg(e.target.value)}
                placeholder="Mensaje de commit..."
                className="flex-1 bg-muted border border-border text-foreground font-mono text-xs px-2 py-2 focus:outline-none focus:border-primary"
                data-testid="input-commit-message"
              />
              <button
                type="submit"
                disabled={commitMutation.isPending || !commitMsg.trim()}
                className="px-3 py-2 text-xs font-mono border border-primary text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
                data-testid="button-git-commit"
              >
                {commitMutation.isPending ? "..." : "COMMIT"}
              </button>
            </form>
            <button
              onClick={handlePush}
              disabled={pushMutation.isPending}
              className="w-full py-2 text-xs font-mono tracking-widest border border-border text-foreground hover:border-accent hover:text-accent disabled:opacity-50 transition-colors"
              data-testid="button-git-push"
            >
              {pushMutation.isPending ? "ENVIANDO..." : "git push"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "repos" && (
        <div className="space-y-4">
          {repos.length > 0 && (
            <div className="border border-border bg-card">
              <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground tracking-widest">REPOS LOCALES ({repos.length})</div>
              {repos.map((r, i) => (
                <div key={r.id ?? i} className="px-4 py-2 border-b border-border/50 hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-primary">{r.nombre}</span>
                    <span className="text-xs font-mono text-muted-foreground">[{r.capa}]</span>
                    <span className="text-xs font-mono text-secondary ml-auto text-glow-amber">w={r.peso_w}</span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground/70 mt-0.5">{r.descripcion}</div>
                </div>
              ))}
            </div>
          )}

          <div className="border border-border bg-card">
            <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground tracking-widest">
              GITHUB: arroyojorge439-lab ({ghRepos.length})
            </div>
            {ghRepos.length === 0 ? (
              <div className="p-4 text-xs font-mono text-muted-foreground/50">Sin repositorios públicos o no disponible.</div>
            ) : (
              ghRepos.slice(0, 10).map((r, i) => (
                <div key={r.id ?? i} className="px-4 py-2 border-b border-border/50 hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-primary">{r.name}</span>
                    {r.language && <span className="text-xs font-mono text-accent">{r.language}</span>}
                    <span className="text-xs font-mono text-secondary ml-auto">★{r.stargazers_count}</span>
                  </div>
                  {r.description && (
                    <div className="text-xs font-mono text-muted-foreground/70 mt-0.5 truncate">{r.description}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
