import { useMemo, useState } from "react";
import { FileCode2 } from "lucide-react";
import { toast } from "sonner";
import type { BlockMeta } from "@/data/types";
import { blockFiles } from "@/lib/source";
import { uiFoundation } from "@/lib/ui-foundation";
import {
  CodeBlock,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
  CodeBlockHeader,
  CodeBlockWrapToggle,
} from "@/components/reui/code-block/code-block";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { useGlobalTheme } from "./global-theme-store";
import { useSourceDocument } from "./source-document";
import "./code-viewer.css";

export function CodeViewer({ block, dark }: { block: BlockMeta; dark: boolean }) {
  const { theme } = useGlobalTheme();
  const files = useMemo(
    () => blockFiles(block, { ...theme, primitive: uiFoundation.primitive }, dark),
    [block, theme, dark],
  );
  const names = Object.keys(files);
  const [selected, setSelected] = useState(names[0]);
  const filename = selected in files ? selected : names[0];
  const language = filename.endsWith(".css") ? "css" : filename.endsWith(".json") ? "json" : "tsx";
  const source = useSourceDocument({
    scope: "block",
    documentId: `${block.group}/${block.id}`,
    filename,
    code: files[filename],
    language,
  });
  return (
    <CodeBlock
      code={files[filename]}
      lines={source.lines}
      aria-busy={source.loading}
      language={language}
      showLineNumbers
      label={`Source code: ${filename}`}
      className={`code-viewer source-code reui-source-viewer ${dark ? "dark" : ""}`}
    >
      <CodeBlockHeader className="code-filebar">
        <div className="flex min-w-0 items-center gap-2">
          <FileCode2 className="size-4 shrink-0 text-muted-foreground" />
          <Select value={filename} onValueChange={setSelected}>
            <SelectTrigger className="max-w-[min(45vw,480px)]" aria-label="Source file">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {names.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <span className="hidden text-xs text-muted-foreground md:inline">
            {names.length} files
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <CodeBlockWrapToggle
            aria-label="Toggle code wrapping"
            className="hidden sm:inline-flex"
          />
          <CodeBlockDownloadButton
            filename={filename.split("/").pop()}
            label="Download source file"
          />
          <CodeBlockCopyButton
            key={filename}
            labels={{ copy: "Copy", copied: "Copied" }}
            onCopyError={() => toast.error("Clipboard unavailable. Use Download source file.")}
          />
        </div>
      </CodeBlockHeader>
      {(source.loading || source.highlightUnavailable) && (
        <p role="status" className="text-muted-foreground px-3 py-1 text-xs">
          {source.loading
            ? "Loading source…"
            : "Syntax highlighting unavailable. Showing original source."}
        </p>
      )}
    </CodeBlock>
  );
}
