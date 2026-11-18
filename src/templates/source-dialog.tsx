import { useMemo, useRef, useState, type ReactNode } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGlobalTheme } from "@/components/site/global-theme-store";
import { uiFoundation } from "@/lib/ui-foundation";
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
import TemplateSourceFilePicker from "./source-file-picker";
import type { TemplateMeta } from "./catalog";
import { useSourceDocument } from "@/components/site/source-document";
import { templateFiles, downloadTemplate } from "./source";

function TemplateSourceCodeBlock({
  templateId,
  filename,
  code,
  language,
  wrap,
  onWrapChange,
  children,
}: {
  templateId: string;
  filename: string;
  code: string;
  language: string;
  wrap: boolean;
  onWrapChange: (wrap: boolean) => void;
  children: ReactNode;
}) {
  const { lines, loading, highlightUnavailable } = useSourceDocument({
    scope: "template",
    documentId: templateId,
    filename,
    code,
    language,
  });
  return (
    <CodeBlock
      key={templateId}
      code={code}
      lines={lines}
      language={language}
      showLineNumbers
      wrap={wrap}
      onWrapChange={onWrapChange}
      label={`Template source code: ${filename}`}
      className="template-source-viewer"
      aria-busy={loading}
    >
      {children}
      {(loading || highlightUnavailable) && (
        <p role="status" className="text-muted-foreground px-3 py-1 text-xs">
          {loading
            ? "Loading source…"
            : "Syntax highlighting unavailable. Showing original source."}
        </p>
      )}
      <div className="template-source-viewport">
        <CodeBlockContent codeClassName="template-source-code" preserveLineBreaks />
      </div>
    </CodeBlock>
  );
}

export default function TemplateSourceDialog({
  template,
  open,
  onOpenChange,
}: {
  template: TemplateMeta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { theme, dark } = useGlobalTheme();
  const selectionTheme = useMemo(() => ({ ...theme, primitive: uiFoundation.primitive }), [theme]);
  const files = useMemo(
    () => templateFiles(template, selectionTheme, dark),
    [template, selectionTheme, dark],
  );
  const filenames = useMemo(() => Object.keys(files), [files]);
  const [sourceSurface, setSourceSurface] = useState<HTMLDivElement | null>(null);
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
        ref={setSourceSurface}
        className="template-source-dialog sm:max-w-5xl"
        onEscapeKeyDown={(event) => {
          if (sourceSurface?.querySelector('[data-slot="combobox-content"]')) {
            event.preventDefault();
          }
        }}
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
        <TemplateSourceCodeBlock
          templateId={template.id}
          filename={filename}
          code={files[filename]}
          language={language}
          wrap={wrap}
          onWrapChange={setWrap}
        >
          <CodeBlockHeader className="flex-wrap gap-2">
            <TemplateSourceFilePicker
              filenames={filenames}
              filename={filename}
              onValueChange={(filename) => setSelection({ templateId: template.id, filename })}
              triggerRef={fileTrigger}
              portalContainer={sourceSurface}
            />
            <div className="flex flex-wrap items-center gap-1">
              <CodeBlockWrapToggle aria-label="Toggle template code wrapping" />
              <CodeBlockDownloadButton
                filename={filename.split("/").pop()}
                label="Download template source file"
              />
              <CodeBlockCopyButton
                key={filename}
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
                    await downloadTemplate(template, selectionTheme, dark);
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
        </TemplateSourceCodeBlock>
      </DialogContent>
    </Dialog>
  );
}
