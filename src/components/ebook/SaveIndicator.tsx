import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { SaveState } from "@/types/ebook";

interface SaveIndicatorProps {
  state: SaveState;
  lastSavedAt: string | null;
}

export function SaveIndicator({ state, lastSavedAt }: SaveIndicatorProps) {
  const content =
    state === "saving"
      ? {
          icon: <Loader2 className="size-4 animate-spin text-primary" />,
          label: "Salvando...",
        }
      : state === "saved"
        ? {
            icon: <CheckCircle2 className="size-4 text-success" />,
            label: lastSavedAt ? `✓ Salvo às ${formatDate(lastSavedAt)}` : "✓ Salvo",
          }
        : state === "error"
          ? {
              icon: <AlertCircle className="size-4 text-danger" />,
              label: "Erro ao salvar",
            }
          : {
              icon: <CheckCircle2 className="size-4 text-success" />,
              label: "Sem alterações pendentes",
            };

  return (
    <div className="glass-panel fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm shadow-soft">
      {content.icon}
      <span>{content.label}</span>
    </div>
  );
}
