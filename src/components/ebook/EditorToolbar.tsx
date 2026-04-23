import { ArrowLeft, Download, FileArchive, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FONT_SIZE_LABELS, TEMPLATE_PALETTES } from "@/lib/ebook-defaults";
import type {
  BodyFontOption,
  EditableProject,
  FontSizeOption,
  LineSpacingOption,
  TemplateOption,
} from "@/types/ebook";

interface EditorToolbarProps {
  project: EditableProject;
  onProjectChange: (project: EditableProject) => void;
  onBack: () => void;
  onExportPdf: () => void;
  onExportEpub: () => void;
}

function ToggleField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function EditorToolbar({
  project,
  onProjectChange,
  onBack,
  onExportPdf,
  onExportEpub,
}: EditorToolbarProps) {
  const updateBookStyle = <T extends keyof EditableProject["ebookData"]>(
    key: T,
    value: EditableProject["ebookData"][T],
  ) => {
    onProjectChange({
      ...project,
      ebookData: {
        ...project.ebookData,
        [key]: value,
      },
    });
  };

  return (
    <div className="glass-panel sticky top-0 z-30 flex flex-col gap-4 border-b border-border px-4 py-4 md:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TEMPLATE_PALETTES) as TemplateOption[]).map((template) => {
            const palette = TEMPLATE_PALETTES[template];
            const active = project.template === template;

            return (
              <button
                key={template}
                type="button"
                onClick={() => onProjectChange({ ...project, template })}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                  active
                    ? "border-primary bg-secondary text-secondary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <span className="flex gap-1">
                  <span className="size-3 rounded-full" style={{ backgroundColor: palette.primary }} />
                  <span className="size-3 rounded-full" style={{ backgroundColor: palette.accent }} />
                  <span className="size-3 rounded-full" style={{ backgroundColor: palette.secondary }} />
                </span>
                {palette.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-44">
          <Select
            value={project.fontSize}
            onChange={(event) =>
              onProjectChange({
                ...project,
                fontSize: event.target.value as FontSizeOption,
              })
            }
            options={(Object.keys(FONT_SIZE_LABELS) as FontSizeOption[]).map((fontSize) => ({
              label: `Tamanho ${FONT_SIZE_LABELS[fontSize]}`,
              value: fontSize,
            }))}
          />
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
          <Type className="size-4 text-primary" />
          <span className="text-sm text-muted-foreground">Fonte do corpo</span>
          <div className="flex rounded-full bg-secondary p-1">
            {(["serif", "sans"] as BodyFontOption[]).map((font) => (
              <button
                key={font}
                type="button"
                onClick={() => updateBookStyle("bodyFont", font)}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  project.ebookData.bodyFont === font
                    ? "bg-card text-foreground shadow"
                    : "text-muted-foreground"
                }`}
              >
                {font === "serif" ? "Serif" : "Sans"}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-44">
          <Select
            value={project.ebookData.lineSpacing}
            onChange={(event) =>
              updateBookStyle("lineSpacing", event.target.value as LineSpacingOption)
            }
            options={[
              { label: "Espaçamento compacto", value: "compact" },
              { label: "Espaçamento normal", value: "normal" },
              { label: "Espaçamento relaxado", value: "relaxed" },
            ]}
          />
        </div>

        <ToggleField
          label="Página em branco entre capítulos"
          checked={project.ebookData.chapterBlankPage}
          onCheckedChange={(checked) => updateBookStyle("chapterBlankPage", checked)}
        />
        <ToggleField
          label="Drop cap"
          checked={project.ebookData.dropCap}
          onCheckedChange={(checked) => updateBookStyle("dropCap", checked)}
        />
        <ToggleField
          label="Indent de parágrafo"
          checked={project.ebookData.paragraphIndent}
          onCheckedChange={(checked) => updateBookStyle("paragraphIndent", checked)}
        />
        <ToggleField
          label="Texto justificado"
          checked={project.ebookData.textAlign === "justify"}
          onCheckedChange={(checked) => updateBookStyle("textAlign", checked ? "justify" : "left")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={onExportPdf}>
          <Download className="size-4" />
          Exportar PDF
        </Button>
        <Button variant="outline" onClick={onExportEpub}>
          <FileArchive className="size-4" />
          Exportar ePub
        </Button>
      </div>
    </div>
  );
}
