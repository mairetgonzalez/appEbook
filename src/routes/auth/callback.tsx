import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/lib/lovable";

export function AuthCallbackRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const code = new URL(window.location.href).searchParams.get("code");
        if (code) {
          const { error } = await lovable.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        }

        toast.success("Autenticação concluída.");
        navigate({ to: "/", replace: true });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha no retorno da autenticação.");
        navigate({ to: "/login", replace: true });
      }
    };

    void run();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass-panel flex items-center gap-3 rounded-xl border border-border px-5 py-4 shadow-soft">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Finalizando autenticação...</span>
      </div>
    </div>
  );
}
