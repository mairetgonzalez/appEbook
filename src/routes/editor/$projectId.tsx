import { useEffect, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EbookEditor } from "@/components/ebook/EbookEditor";
import { Button } from "@/components/ui/button";
import { generatePdf } from "@/lib/pdf-generator";
import { generateEpub } from "@/lib/epub-generator";
import { getProject } from "@/lib/project-service";
import type { EditableProject } from "@/types/ebook";

export function EditorRoute() {
  const { projectId } = useParams({ strict: false }) as { projectId: string };
  const [project, setProject] = useState<EditableProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setProject(await getProject(projectId));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao abrir o projeto.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
          Projeto não encontrado
        </p>
        <h1 className="font-display text-4xl">Não localizamos esse ebook</h1>
        <p className="text-muted-foreground">
          Ele pode ter sido removido, ou você não tem acesso a esse registro.
        </p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="size-4" />
            Voltar para projetos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <EbookEditor
      initialProject={project}
      onExportPdf={async (currentProject) => {
        try {
          await generatePdf(currentProject);
          toast.success("PDF exportado com sucesso.");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Falha ao exportar PDF.");
        }
      }}
      onExportEpub={async (currentProject) => {
        try {
          await generateEpub(currentProject);
          toast.success("ePub exportado com sucesso.");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Falha ao exportar ePub.");
        }
      }}
    />
  );
}
