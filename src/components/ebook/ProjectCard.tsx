import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FONT_SIZE_LABELS, TEMPLATE_PALETTES } from "@/lib/ebook-defaults";
import { formatDate } from "@/lib/utils";
import type { ProjectCardView } from "@/types/ebook";

export function ProjectCard({ project }: { project: ProjectCardView }) {
  const palette = TEMPLATE_PALETTES[project.template];

  return (
    <Link to="/editor/$projectId" params={{ projectId: project.id }}>
      <Card className="group h-full overflow-hidden transition duration-200 hover:-translate-y-1">
        <div
          className="h-32 w-full"
          style={{
            background: `linear-gradient(135deg, ${palette.cover}, ${palette.secondary})`,
          }}
        />
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {palette.label}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                {FONT_SIZE_LABELS[project.fontSize]}
              </span>
            </div>
            <h3 className="font-display text-2xl leading-tight">{project.title}</h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {project.subtitle || "Sem subtítulo ainda."}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <BookOpen className="size-4" />
              {project.chapterCount} capítulos
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4" />
              {formatDate(project.updatedAt)}
            </span>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            Abrir editor
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
