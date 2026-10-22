import { useMemo, useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Copy, Download, Check, FileCode2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { BlockMeta } from "@/data/types";
import { blockFiles, downloadFile } from "@/lib/source";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
export function CodeViewer({
  block,
  dark,
}: {
  block: BlockMeta;
  dark: boolean;
}) {
  const files = useMemo(() => blockFiles(block), [block]);
  const names = Object.keys(files);
  const [selected, setSelected] = useState(names[0]);
  const [copied, setCopied] = useState(false);
  const filename = selected in files ? selected : names[0];
  const code = files[filename];
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Clipboard unavailable. Use Download file.");
    }
  }
  return (
    <div className="code-viewer">
      <div className="code-filebar">
        <div className="flex min-w-0 items-center gap-2">
          <FileCode2 className="size-4 shrink-0 text-muted-foreground" />
          <Select value={filename} onValueChange={setSelected}>
            <SelectTrigger
              className="max-w-[min(55vw,480px)]"
              aria-label="Source file"
            >
              <SelectValue />
              <ChevronDown className="hidden" />
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
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Download source file"
            onClick={() => downloadFile(filename.split("/").pop()!, code)}
          >
            <Download />
          </Button>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? (
              <Check data-icon="inline-start" />
            ) : (
              <Copy data-icon="inline-start" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      <Highlight
        theme={dark ? themes.vsDark : themes.github}
        code={code}
        language={filename.endsWith(".css") ? "css" : "tsx"}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${className} source-code`} style={style}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                <span className="line-number">{i + 1}</span>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
