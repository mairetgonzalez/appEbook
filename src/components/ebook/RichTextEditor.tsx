import { useEffect, useRef } from "react";
import {
  Bold,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading3,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { editableHtmlToMarkdown, markdownToHtml } from "@/lib/rich-text-parser";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Comece a escrever aqui...",
  className,
}: RichTextEditorProps) {
  const editableRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = editableRef.current;
    if (!element || document.activeElement === element) {
      return;
    }

    const nextHtml = markdownToHtml(value);
    if (element.innerHTML !== nextHtml) {
      element.innerHTML = nextHtml;
    }
  }, [value]);

  const syncMarkdown = () => {
    const element = editableRef.current;
    if (!element) {
      return;
    }

    const markdown = editableHtmlToMarkdown(element);
    onChange(markdown);
  };

  const runCommand = (command: string, commandValue?: string) => {
    editableRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncMarkdown();
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex flex-wrap gap-2 border-b border-border p-3">
        <Button size="icon" variant="ghost" type="button" onClick={() => runCommand("formatBlock", "h3")}>
          <Heading3 className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" type="button" onClick={() => runCommand("bold")}>
          <Bold className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" type="button" onClick={() => runCommand("italic")}>
          <Italic className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" type="button" onClick={() => runCommand("underline")}>
          <Underline className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" type="button" onClick={() => runCommand("hiliteColor", "#fff3a1")}>
          <Highlighter className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" type="button" onClick={() => runCommand("insertUnorderedList")}>
          <List className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" type="button" onClick={() => runCommand("insertOrderedList")}>
          <ListOrdered className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" type="button" onClick={() => runCommand("formatBlock", "blockquote")}>
          <Quote className="size-4" />
        </Button>
      </div>
      <div
        ref={editableRef}
        className="rte-editable p-4"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onBlur={syncMarkdown}
        onInput={syncMarkdown}
      />
    </Card>
  );
}
