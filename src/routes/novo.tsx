import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ProjectForm } from "@/components/ebook/ProjectForm";
import { createDefaultEbookData } from "@/lib/ebook-defaults";
import { createProject } from "@/lib/project-service";

export function NewProjectRoute() {
  const navigate = useNavigate();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-8 space-y-3">
        <p className="inline-flex rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
          Novo ebook
        </p>
        <h1 className="font-display text-5xl leading-none">Comece com a estrutura principal</h1>
        <p className="max-w-2xl text-muted-foreground">
          Preencha as informações iniciais. Em seguida você cai no editor completo
          para diagramar capa, capítulos e exportações.
        </p>
      </div>

      <ProjectForm
        onSubmit={async (values) => {
          try {
            const ebookData = createDefaultEbookData(values.chapterCount);
            ebookData.title = values.title;
            ebookData.subtitle = values.subtitle;
            ebookData.authorName = values.authorName;
            ebookData.coverImage = values.coverImage;

            const project = await createProject({
              title: values.title,
              template: "professional",
              fontSize: "medium",
              ebookData,
            });

            toast.success("Projeto criado com sucesso.");
            navigate({ to: "/editor/$projectId", params: { projectId: project.id } });
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível criar o projeto.");
          }
        }}
      />
    </main>
  );
}
