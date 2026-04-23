import { startTransition, type ReactNode } from "react";
import {
  BookOpenText,
  ChevronDown,
  ChevronUp,
  FileWarning,
  ImageIcon,
  ListPlus,
  Trash2,
  UserSquare2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EbookChapter } from "@/types/ebook";

interface SectionSidebarProps {
  activeSection: string;
  chapters: EbookChapter[];
  onSelect: (section: string) => void;
  onAddChapter: () => void;
  onRemoveChapter: (chapterId: string) => void;
  onMoveChapter: (chapterId: string, direction: "up" | "down") => void;
}

function SidebarItem({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => startTransition(onClick)}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function SectionSidebar({
  activeSection,
  chapters,
  onSelect,
  onAddChapter,
  onRemoveChapter,
  onMoveChapter,
}: SectionSidebarProps) {
  return (
    <aside className="glass-panel border-b border-border lg:h-[calc(100vh-13rem)] lg:rounded-xl lg:border">
      <div className="border-b border-border p-4">
        <h2 className="font-display text-2xl">Estrutura do Ebook</h2>
        <p className="text-sm text-muted-foreground">
          Navegue pelas partes do livro e reorganize os capítulos.
        </p>
      </div>

      <div className="space-y-5 p-4">
        <div className="space-y-1.5">
          <SidebarItem
            active={activeSection === "cover"}
            label="Capa"
            icon={<ImageIcon className="size-4" />}
            onClick={() => onSelect("cover")}
          />
          <SidebarItem
            active={activeSection === "author"}
            label="Sobre o Autor"
            icon={<UserSquare2 className="size-4" />}
            onClick={() => onSelect("author")}
          />
          <SidebarItem
            active={activeSection === "legal"}
            label="Aviso Legal"
            icon={<FileWarning className="size-4" />}
            onClick={() => onSelect("legal")}
          />
          <SidebarItem
            active={activeSection === "introduction"}
            label="Introdução"
            icon={<BookOpenText className="size-4" />}
            onClick={() => onSelect("introduction")}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Capítulos
            </h3>
            <Button variant="ghost" size="sm" onClick={onAddChapter}>
              <ListPlus className="size-4" />
              Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {chapters.map((chapter, index) => (
              <div key={chapter.id} className="rounded-xl border border-border bg-card p-3">
                <button
                  type="button"
                  onClick={() => onSelect(`chapter:${chapter.id}`)}
                  className={`w-full text-left text-sm font-medium ${
                    activeSection === `chapter:${chapter.id}` ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {chapter.title || `Capítulo ${index + 1}`}
                </button>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onMoveChapter(chapter.id, "up")}
                    disabled={index === 0}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onMoveChapter(chapter.id, "down")}
                    disabled={index === chapters.length - 1}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onRemoveChapter(chapter.id)}>
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <SidebarItem
          active={activeSection === "conclusion"}
          label="Conclusão"
          icon={<BookOpenText className="size-4" />}
          onClick={() => onSelect("conclusion")}
        />
      </div>
    </aside>
  );
}
