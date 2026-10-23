import { useMemo, useState } from "react";
import { FileCode2 } from "lucide-react";
import { toast } from "sonner";
import type { BlockMeta } from "@/data/types";
import { blockFiles } from "@/lib/source";
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
import "./code-viewer.css";

export function CodeViewer({ block, dark }: { block: BlockMeta; dark: boolean }) {
  const files = useMemo(() => blockFiles(block), [block]);
  const names = Object.keys(files);
  const [selected, setSelected] = useState(names[0]);
  const filename = selected in files ? selected : names[0];
  const language = filename.endsWith(".css") ? "css" : filename.endsWith(".json") ? "json" : "tsx";
  return (
    <CodeBlock
      code={files[filename]}
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
            labels={{ copy: "Copy", copied: "Copied" }}
            onCopyError={() => toast.error("Clipboard unavailable. Use Download source file.")}
          />
        </div>
      </CodeBlockHeader>
    </CodeBlock>
  );
}
