import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export function SignupRoute() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await signUp(email, password);
      toast.success("Conta criada. Verifique seu email se a confirmação estiver ativada.");
      navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao iniciar cadastro com Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="flex items-center justify-center px-6 py-10">
        <Card className="w-full max-w-md page-enter">
          <CardHeader>
            <CardTitle>Criar conta</CardTitle>
            <CardDescription>
              Comece seu catálogo editorial com sincronização segura.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@exemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Crie uma senha forte"
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                Criar conta
              </Button>
            </form>

            <Button
              className="w-full"
              variant="outline"
              onClick={handleGoogle}
              disabled={googleLoading}
            >
              {googleLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              Continuar com Google
            </Button>

            <p className="text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link className="font-medium text-primary" to="/login">
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid-fade hidden lg:flex lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-xl space-y-6">
          <p className="inline-flex rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
            PWA em português
          </p>
          <h1 className="font-display text-6xl leading-[1.02]">
            Produção editorial do rascunho à exportação.
          </h1>
          <p className="text-lg text-muted-foreground">
            Use templates visuais, autosave robusto, capítulos reordenáveis e
            exportação com refinamentos de livro profissional.
          </p>
        </div>
      </section>
    </div>
  );
}
