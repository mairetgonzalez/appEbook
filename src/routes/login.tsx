import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export function LoginRoute() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success("Login realizado com sucesso.");
      navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao iniciar login com Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="grid-fade hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="stagger-in">
          <p className="mb-4 inline-flex rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
            Diagramador de Ebook
          </p>
          <h1 className="font-display text-6xl leading-[1.02] text-foreground">
            Escreva, diagrama e exporte ebooks com acabamento profissional.
          </h1>
        </div>
        <p className="max-w-lg text-muted-foreground">
          Crie capas, organize capítulos, aplique estilos editoriais e exporte em
          PDF ou ePub a partir de um único fluxo.
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <Card className="w-full max-w-md page-enter">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Acesse seus projetos e continue de onde parou.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@exemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Sua senha"
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                Entrar
              </Button>
            </form>

            <Button
              className="w-full"
              variant="outline"
              onClick={handleGoogle}
              disabled={googleLoading}
            >
              {googleLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              Entrar com Google
            </Button>

            <p className="text-sm text-muted-foreground">
              Ainda não tem conta?{" "}
              <Link className="font-medium text-primary" to="/signup">
                Criar conta
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
