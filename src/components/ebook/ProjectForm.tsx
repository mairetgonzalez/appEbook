import { useState, type ChangeEvent } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { fileToBase64 } from "@/lib/utils";

interface ProjectFormValues {
  title: string;
  subtitle: string;
  authorName: string;
  chapterCount: number;
  coverImage: string | null;
}

interface ProjectFormProps {
  onSubmit: (values: ProjectFormValues) => Promise<void>;
}

export function ProjectForm({ onSubmit }: ProjectFormProps) {
  const [values, setValues] = useState<ProjectFormValues>({
    title: "",
    subtitle: "",
    authorName: "",
    chapterCount: 5,
    coverImage: null,
  });
  const [loading, setLoading] = useState(false);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const coverImage = await fileToBase64(file);
    setValues((current) => ({ ...current, coverImage }));
  };

  return (
    <Card className="page-enter mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Novo projeto</CardTitle>
        <CardDescription>
          Defina a base do ebook antes de entrar no editor completo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-5 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            try {
              await onSubmit(values);
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="new-title">Título</Label>
            <Input
              id="new-title"
              value={values.title}
              onChange={(event) =>
                setValues((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Ex.: Guia Prático de Produtividade"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="new-subtitle">Subtítulo</Label>
            <Input
              id="new-subtitle"
              value={values.subtitle}
              onChange={(event) =>
                setValues((current) => ({ ...current, subtitle: event.target.value }))
              }
              placeholder="Explique o foco do conteúdo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-author">Autor</Label>
            <Input
              id="new-author"
              value={values.authorName}
              onChange={(event) =>
                setValues((current) => ({ ...current, authorName: event.target.value }))
              }
              placeholder="Nome do autor"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-chapters">Número de capítulos</Label>
            <Select
              id="new-chapters"
              value={String(values.chapterCount)}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  chapterCount: Number(event.target.value),
                }))
              }
              options={Array.from({ length: 12 }, (_, index) => ({
                label: `${index + 1} capítulo${index === 0 ? "" : "s"}`,
                value: String(index + 1),
              }))}
            />
          </div>
          <div className="space-y-3 md:col-span-2">
            <Label htmlFor="new-cover">Capa</Label>
            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/35 px-4 py-6 text-center">
              <input id="new-cover" type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <ImagePlus className="mb-3 size-8 text-primary" />
              <span className="font-medium">
                {values.coverImage ? "Trocar imagem de capa" : "Enviar imagem de capa"}
              </span>
              <span className="mt-1 text-sm text-muted-foreground">
                PNG, JPG ou WEBP em base64 para PDF/ePub.
              </span>
            </label>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Criar projeto e abrir editor
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
