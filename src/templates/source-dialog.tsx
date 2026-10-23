import { useMemo, useState } from "react";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  const filename =
    selection.templateId === template.id && selection.filename in files
      ? selection.filename
      : Object.keys(files)[0];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="template-source-dialog sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{template.name} source</DialogTitle>
          <DialogDescription>
            Complete template implementation. Select a file to view its source, or download the
            project with all supporting files.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filename}
            onValueChange={(filename) => setSelection({ templateId: template.id, filename })}
          >
            <SelectTrigger aria-label="Template source file" className="min-w-0 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(files).map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(files[filename]);
                toast.success("Source copied");
              } catch {
                toast.error("Clipboard unavailable. Download the project instead.");
              }
            }}
          >
            <Copy />
            Copy
          </Button>
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
        <pre className="template-source-code" tabIndex={0}>
          {files[filename]}
        </pre>
      </DialogContent>
    </Dialog>
  );
}
