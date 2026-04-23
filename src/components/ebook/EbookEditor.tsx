import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDefaultChapter } from "@/lib/ebook-defaults";
import { fileToBase64 } from "@/lib/utils";
import { updateProject } from "@/lib/project-service";
import { useProjectAutosave } from "@/hooks/use-project-autosave";
import type { EditableProject } from "@/types/ebook";
import { EditorToolbar } from "@/components/ebook/EditorToolbar";
import { RichTextEditor } from "@/components/ebook/RichTextEditor";
import { SaveIndicator } from "@/components/ebook/SaveIndicator";
import { SectionSidebar } from "@/components/ebook/SectionSidebar";

interface EbookEditorProps {
  initialProject: EditableProject;
  onExportPdf: (project: EditableProject) => Promise<void>;
  onExportEpub: (project: EditableProject) => Promise<void>;
}

export function EbookEditor({
  initialProject,
  onExportPdf,
  onExportEpub,
}: EbookEditorProps) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("cover");
  const {
    project,
    setProject,
    saveState,
    lastSavedAt,
    flushRemote,
    loadLocalSnapshot,
  } = useProjectAutosave({
    projectId: initialProject.id,
    initialProject,
    saveRemote: updateProject,
  });

  useEffect(() => {
    const snapshot = loadLocalSnapshot();
    if (!snapshot) {
      return;
    }

    const serverSignature = JSON.stringify(initialProject);
    const localSignature = JSON.stringify(snapshot.project);
    const localIsDifferent = serverSignature !== localSignature;
    const localIsNewer =
      new Date(snapshot.savedAt).getTime() >
      new Date(initialProject.updatedAt ?? initialProject.createdAt ?? 0).getTime();

    if (localIsDifferent && localIsNewer) {
      const shouldRestore = window.confirm(
        "Encontramos uma cópia local mais recente deste projeto. Deseja restaurá-la?",
      );

      if (shouldRestore) {
        setProject(snapshot.project);
        toast.success("Rascunho local restaurado.");
      }
    }
  }, [initialProject, loadLocalSnapshot, setProject]);

  const activeChapter = useMemo(() => {
    if (!activeSection.startsWith("chapter:")) {
      return null;
    }

    const chapterId = activeSection.replace("chapter:", "");
    return project.ebookData.chapters.find((chapter) => chapter.id === chapterId) ?? null;
  }, [activeSection, project.ebookData.chapters]);

  const updateField = <T extends keyof EditableProject["ebookData"]>(
    key: T,
    value: EditableProject["ebookData"][T],
  ) => {
    setProject({
      ...project,
      title: key === "title" ? String(value) : project.title,
      ebookData: {
        ...project.ebookData,
        [key]: value,
      },
    });
  };

  const updateChapter = (chapterId: string, updater: (chapter: EditableProject["ebookData"]["chapters"][number]) => EditableProject["ebookData"]["chapters"][number]) => {
    setProject({
      ...project,
      ebookData: {
        ...project.ebookData,
        chapters: project.ebookData.chapters.map((chapter) =>
          chapter.id === chapterId ? updater(chapter) : chapter,
        ),
      },
    });
  };

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    callback: (value: string | null) => void,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      callback(null);
      return;
    }
    callback(await fileToBase64(file));
  };

  const handleAddChapter = () => {
    const nextChapter = createDefaultChapter(project.ebookData.chapters.length + 1);
    setProject({
      ...project,
      ebookData: {
        ...project.ebookData,
        chapters: [...project.ebookData.chapters, nextChapter],
      },
    });
    setActiveSection(`chapter:${nextChapter.id}`);
  };

  const handleRemoveChapter = (chapterId: string) => {
    const chapter = project.ebookData.chapters.find((item) => item.id === chapterId);
    if (!chapter) {
      return;
    }

    const confirmed = window.confirm(`Deseja remover "${chapter.title}"?`);
    if (!confirmed) {
      return;
    }

    const chapters = project.ebookData.chapters.filter((item) => item.id !== chapterId);
    setProject({
      ...project,
      ebookData: {
        ...project.ebookData,
        chapters,
      },
    });

    if (activeSection === `chapter:${chapterId}`) {
      setActiveSection("cover");
    }
  };

  const handleMoveChapter = (chapterId: string, direction: "up" | "down") => {
    const currentIndex = project.ebookData.chapters.findIndex((chapter) => chapter.id === chapterId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= project.ebookData.chapters.length) {
      return;
    }

    const chapters = [...project.ebookData.chapters];
    [chapters[currentIndex], chapters[targetIndex]] = [chapters[targetIndex], chapters[currentIndex]];

    setProject({
      ...project,
      ebookData: {
        ...project.ebookData,
        chapters,
      },
    });
  };

  const saveAndGoBack = async () => {
    const saved = await flushRemote();
    if (saved) {
      toast.success("Projeto salvo.");
      navigate({ to: "/" });
      return;
    }

    toast.error("Não foi possível concluir o salvamento antes de sair.");
  };

  return (
    <div className="min-h-screen">
      <EditorToolbar
        project={project}
        onProjectChange={setProject}
        onBack={saveAndGoBack}
        onExportPdf={async () => {
          const saved = await flushRemote();
          if (!saved) {
            toast.error("Resolva o erro de salvamento antes de exportar.");
            return;
          }
          await onExportPdf(project);
        }}
        onExportEpub={async () => {
          const saved = await flushRemote();
          if (!saved) {
            toast.error("Resolva o erro de salvamento antes de exportar.");
            return;
          }
          await onExportEpub(project);
        }}
      />

      <div className="grid gap-6 px-4 py-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-6">
        <SectionSidebar
          activeSection={activeSection}
          chapters={project.ebookData.chapters}
          onSelect={setActiveSection}
          onAddChapter={handleAddChapter}
          onRemoveChapter={handleRemoveChapter}
          onMoveChapter={handleMoveChapter}
        />

        <section className="page-enter min-w-0">
          {activeSection === "cover" ? (
            <Card>
              <CardHeader>
                <CardTitle>Capa</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cover-title">Título</Label>
                  <Input
                    id="cover-title"
                    value={project.ebookData.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    placeholder="Título do ebook"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cover-subtitle">Subtítulo</Label>
                  <Input
                    id="cover-subtitle"
                    value={project.ebookData.subtitle}
                    onChange={(event) => updateField("subtitle", event.target.value)}
                    placeholder="Subtítulo do ebook"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cover-author">Autor</Label>
                  <Input
                    id="cover-author"
                    value={project.ebookData.authorName}
                    onChange={(event) => updateField("authorName", event.target.value)}
                    placeholder="Nome do autor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opening-margin">Margem de abertura (mm)</Label>
                  <Input
                    id="opening-margin"
                    type="number"
                    min={40}
                    max={120}
                    value={project.ebookData.chapterOpeningTopMargin}
                    onChange={(event) =>
                      updateField("chapterOpeningTopMargin", Number(event.target.value))
                    }
                  />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
                    <div>
                      <p className="font-medium">Mostrar título na capa</p>
                      <p className="text-sm text-muted-foreground">
                        Use apenas a arte ou mantenha tipografia sobre a capa.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={project.ebookData.showTitleOnCover ? "default" : "outline"}
                      onClick={() =>
                        updateField("showTitleOnCover", !project.ebookData.showTitleOnCover)
                      }
                    >
                      {project.ebookData.showTitleOnCover ? "Ativado" : "Desativado"}
                    </Button>
                  </div>
                  <Label htmlFor="cover-upload">Imagem de capa</Label>
                  <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 px-5 py-6 text-center">
                    <input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        void handleImageUpload(event, (value) => updateField("coverImage", value))
                      }
                    />
                    <ImagePlus className="mb-3 size-8 text-primary" />
                    <span className="font-medium">
                      {project.ebookData.coverImage ? "Trocar capa" : "Enviar capa"}
                    </span>
                    <span className="mt-1 text-sm text-muted-foreground">
                      A imagem entra nas exportações PDF e ePub.
                    </span>
                  </label>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "author" ? (
            <Card>
              <CardHeader>
                <CardTitle>Sobre o Autor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="author-name">Nome do autor</Label>
                  <Input
                    id="author-name"
                    value={project.ebookData.authorName}
                    onChange={(event) => updateField("authorName", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author-bio">Bio</Label>
                  <Textarea
                    id="author-bio"
                    value={project.ebookData.authorBio}
                    onChange={(event) => updateField("authorBio", event.target.value)}
                    placeholder="Conte sua trajetória, credenciais e tom do ebook."
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "legal" ? (
            <Card>
              <CardHeader>
                <CardTitle>Aviso Legal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="copyright">Copyright</Label>
                  <Textarea
                    id="copyright"
                    value={project.ebookData.copyright}
                    onChange={(event) => updateField("copyright", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disclaimer">Disclaimer</Label>
                  <Textarea
                    id="disclaimer"
                    value={project.ebookData.disclaimer}
                    onChange={(event) => updateField("disclaimer", event.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "introduction" ? (
            <Card>
              <CardHeader>
                <CardTitle>Introdução</CardTitle>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  value={project.ebookData.introduction}
                  onChange={(value) => updateField("introduction", value)}
                  placeholder="Apresente o objetivo do ebook e prepare a leitura."
                />
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "conclusion" ? (
            <Card>
              <CardHeader>
                <CardTitle>Conclusão</CardTitle>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  value={project.ebookData.conclusion}
                  onChange={(value) => updateField("conclusion", value)}
                  placeholder="Feche o ebook com síntese, chamada para ação ou próximos passos."
                />
              </CardContent>
            </Card>
          ) : null}

          {activeChapter ? (
            <Card>
              <CardHeader>
                <CardTitle>{activeChapter.title || "Capítulo sem título"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="chapter-title">Título do capítulo</Label>
                  <Input
                    id="chapter-title"
                    value={activeChapter.title}
                    onChange={(event) =>
                      updateChapter(activeChapter.id, (chapter) => ({
                        ...chapter,
                        title: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="chapter-image">Imagem do capítulo</Label>
                  <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 px-5 py-6 text-center">
                    <input
                      id="chapter-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        void handleImageUpload(event, (value) =>
                          updateChapter(activeChapter.id, (chapter) => ({
                            ...chapter,
                            image: value,
                          })),
                        )
                      }
                    />
                    <ImagePlus className="mb-3 size-8 text-primary" />
                    <span className="font-medium">
                      {activeChapter.image ? "Trocar imagem do capítulo" : "Adicionar imagem"}
                    </span>
                  </label>
                </div>
                <RichTextEditor
                  value={activeChapter.content}
                  onChange={(value) =>
                    updateChapter(activeChapter.id, (chapter) => ({
                      ...chapter,
                      content: value,
                    }))
                  }
                  placeholder="Escreva o conteúdo do capítulo usando a barra de formatação."
                />
              </CardContent>
            </Card>
          ) : null}
        </section>
      </div>

      <SaveIndicator state={saveState} lastSavedAt={lastSavedAt} />
    </div>
  );
}
