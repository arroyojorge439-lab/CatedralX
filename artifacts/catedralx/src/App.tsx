import { useState, useEffect, createContext, useContext } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useGetMe, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import Shell from "@/components/Shell";
import AuthView from "@/components/views/AuthView";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

export type ViewName =
  | "dashboard"
  | "cortex"
  | "cerebellum"
  | "blueprint"
  | "codex"
  | "signals"
  | "paper-trading"
  | "pricing"
  | "terminal"
  | "manifesto";

interface AppContextValue {
  view: ViewName;
  setView: (v: ViewName) => void;
  user: { id: number; email: string; name?: string | null; tier: string } | null;
  onLogout: () => void;
}

export const AppContext = createContext<AppContextValue>({
  view: "dashboard",
  setView: () => {},
  user: null,
  onLogout: () => {},
});

export function useApp() {
  return useContext(AppContext);
}

function AppInner() {
  const [view, setView] = useState<ViewName>("dashboard");
  const queryClient = useQueryClient();
  const { data: meData, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() },
  });
  const logoutMutation = useLogout();

  const user = (meData as { user: AppContextValue["user"] } | undefined)?.user ?? null;

  function handleLogout() {
    logoutMutation.mutate(
      {},
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setView("dashboard");
        },
      }
    );
  }

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-primary text-glow font-mono text-sm tracking-widest animate-pulse">
          INICIANDO CATEDRALX...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AppContext.Provider value={{ view, setView, user, onLogout: handleLogout }}>
        <AuthView />
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={{ view, setView, user, onLogout: handleLogout }}>
      <Shell />
    </AppContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
