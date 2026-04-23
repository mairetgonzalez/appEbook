import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { ProjectCard } from "@/components/ebook/ProjectCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { listProjects } from "@/lib/project-service";
import type { ProjectCardView } from "@/types/ebook";

export function ProjectsRoute() {
  const { signOut, user } = useAuth();
  const [projects, setProjects] = useState<ProjectCardView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setProjects(await listProjects());
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao carregar projetos.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-border bg-card/80 p-6 shadow-soft md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <p className="inline-flex rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
            Biblioteca editorial
          </p>
          <h1 className="font-display text-5xl leading-none">Seus projetos</h1>
          <p className="max-w-2xl text-muted-foreground">
            Organize seus ebooks, retome rascunhos e exporte versões profissionais
            sempre que precisar.
          </p>
          {user?.email ? (
            <p className="text-sm text-muted-foreground">Sessão ativa em {user.email}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await signOut();
                toast.success("Sessão encerrada.");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Falha ao sair.");
              }
            }}
          >
            <LogOut className="size-4" />
            Sair
          </Button>
          <Link to="/novo">
            <Button size="lg">
              <Plus className="size-4" />
              Novo projeto
            </Button>
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-60 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : projects.length === 0 ? (
        <div className="grid-fade rounded-[2rem] border border-dashed border-border p-10 text-center">
          <h2 className="font-display text-3xl">Nenhum projeto ainda</h2>
          <p className="mt-3 text-muted-foreground">
            Crie seu primeiro ebook para começar a escrever e diagramar.
          </p>
          <Link className="mt-6 inline-flex" to="/novo">
            <Button>
              <Plus className="size-4" />
              Criar agora
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => (
            <div key={project.id} className="stagger-in" style={{ animationDelay: `${index * 70}ms` }}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
