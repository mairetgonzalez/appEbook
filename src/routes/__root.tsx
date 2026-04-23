import { Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { isLovableConfigured } from "@/lib/lovable";

export function RootLayout() {
  return (
    <AuthProvider>
      <div className="app-shell min-h-screen">
        {!isLovableConfigured ? (
          <div className="border-b border-warning/30 bg-warning/15 px-4 py-3 text-center text-sm text-warning-foreground">
            Configure as variáveis `VITE_LOVABLE_URL` e `VITE_LOVABLE_ANON_KEY`
            para ativar login e persistência no banco.
          </div>
        ) : null}
        <Outlet />
        <Toaster richColors position="top-right" />
      </div>
    </AuthProvider>
  );
}
