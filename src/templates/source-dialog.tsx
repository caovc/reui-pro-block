import { useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
  CodeBlockHeader,
  CodeBlockWrapToggle,
} from "@/components/reui/code-block/code-block";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { TemplateMeta } from "./catalog";
import { templateFiles, downloadTemplate } from "./source";

export default function TemplateSourceDialog({
  template,
  open,
  onOpenChange,
}: {
  template: TemplateMeta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const files = useMemo(() => templateFiles(template), [template]);
  const [selection, setSelection] = useState({
    templateId: template.id,
    filename: Object.keys(files)[0],
  });
  const [downloading, setDownloading] = useState(false);
  const [wrap, setWrap] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const fileTrigger = useRef<HTMLButtonElement | null>(null);
  const filename =
    selection.templateId === template.id && selection.filename in files
      ? selection.filename
      : Object.keys(files)[0];
  const language = filename.endsWith(".tsx")
    ? "tsx"
    : filename.endsWith(".ts")
      ? "typescript"
      : filename.endsWith(".css")
        ? "css"
        : filename.endsWith(".json")
          ? "json"
          : filename.endsWith(".md")
            ? "markdown"
            : filename.endsWith(".html")
              ? "html"
              : "text";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="template-source-dialog sm:max-w-5xl"
        onOpenAutoFocus={() => {
          returnFocus.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          if (returnFocus.current?.isConnected) {
            event.preventDefault();
            returnFocus.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{template.name} source</DialogTitle>
          <DialogDescription>
            Complete template implementation. Select a file to view its source, or download the
            project with all supporting files.
          </DialogDescription>
        </DialogHeader>
        <CodeBlock
          key={`${template.id}/${filename}`}
          code={files[filename]}
          language={language}
          showLineNumbers
          wrap={wrap}
          onWrapChange={setWrap}
          label={`Template source code: ${filename}`}
          className="template-source-viewer"
        >
          <CodeBlockHeader className="flex-wrap gap-2">
            <Select
              value={filename}
              onValueChange={(filename) => setSelection({ templateId: template.id, filename })}
            >
              <SelectTrigger
                ref={fileTrigger}
                aria-label="Template source file"
                className="min-w-0 flex-1 basis-56"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                onCloseAutoFocus={(event) => {
                  event.preventDefault();
                  // The keyed CodeBlock replaces the old trigger on file changes.
                  requestAnimationFrame(() => {
                    const trigger = fileTrigger.current;
                    if (
                      trigger?.closest('[role="dialog"]')?.getAttribute("data-state") === "open"
                    ) {
                      trigger.focus({ preventScroll: true });
                    }
                  });
                }}
              >
                {Object.keys(files).map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap items-center gap-1">
              <CodeBlockWrapToggle aria-label="Toggle template code wrapping" />
              <CodeBlockDownloadButton
                filename={filename.split("/").pop()}
                label="Download template source file"
              />
              <CodeBlockCopyButton
                labels={{ copy: "Copy", copied: "Copied" }}
                onCopy={() => toast.success("Source copied")}
                onCopyError={() =>
                  toast.error("Clipboard unavailable. Use Download template source file.")
                }
              />
              <Button
                size="sm"
                disabled={downloading}
                onClick={async () => {
                  setDownloading(true);
                  try {
                    await downloadTemplate(template);
                    toast.success("Project downloaded");
                  } catch {
                    toast.error("Download failed. Please try again.");
                  } finally {
                    setDownloading(false);
                  }
                }}
              >
                <Download />
                {downloading ? "Preparing…" : "Download project"}
              </Button>
            </div>
          </CodeBlockHeader>
          <div className="template-source-viewport">
            <CodeBlockContent codeClassName="template-source-code" preserveLineBreaks />
          </div>
        </CodeBlock>
      </DialogContent>
    </Dialog>
  );
}
