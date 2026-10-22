import { useState } from "react";
import { ArrowDownToLine, Terminal } from "lucide-react";
import { toast } from "sonner";
import type { BlockMeta } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
} from "@/components/reui/code-block/code-block";
import { CodeViewer } from "./code-viewer";
import { themeCSS, type PreviewTheme } from "./preview-theme";

const managers = ["pnpm", "npm", "yarn", "bun"] as const;
export function SourcePanel({
  block,
  dark,
  theme,
}: {
  block: BlockMeta;
  dark: boolean;
  theme: PreviewTheme;
}) {
  const [manager, setManager] = useState<string>("pnpm");
  const [downloading, setDownloading] = useState(false);
  const command = `${manager} install\n${manager === "yarn" ? "yarn dev" : `${manager} run dev`}`;
  async function download() {
    setDownloading(true);
    try {
      const { downloadBundle } = await import("@/lib/bundle");
      await downloadBundle(block);
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }
  return (
    <div className="source-panel-content">
      <section aria-label="Installation" className="source-installation">
        <div className="source-section-heading">
          <h3>Installation</h3>
          <Button
            variant="outline"
            size="sm"
            disabled={downloading}
            onClick={download}
          >
            <ArrowDownToLine />
            {downloading ? "Preparing…" : "Download starter"}
          </Button>
        </div>
        <p>
          Download and extract <strong>{block.id}.zip</strong>, open its folder,
          then run:
        </p>
        <CodeBlock
          code={command}
          language="bash"
          label="Installation commands"
          className="installation-code"
        >
          <CodeBlockHeader>
            <div className="flex min-w-0 items-center gap-2">
              <Terminal className="size-4 shrink-0 text-muted-foreground" />
              <Tabs value={manager} onValueChange={setManager}>
                <TabsList aria-label="Package manager">
                  {managers.map((m) => (
                    <TabsTrigger key={m} value={m}>
                      {m}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <CodeBlockCopyButton
              labels={{ copy: "Copy installation commands", copied: "Copied" }}
              onCopyError={() =>
                toast.error("Could not copy installation commands")
              }
            />
          </CodeBlockHeader>
        </CodeBlock>
      </section>
      <section aria-label="Block source">
        <div className="source-section-heading">
          <h3>Code</h3>
          <span>React · TypeScript</span>
        </div>
        <CodeViewer
          key={`${block.group}/${block.id}`}
          block={block}
          dark={dark}
        />
      </section>
      <details className="preset-source">
        <summary>Theme CSS · current customization</summary>
        <p>
          Append this CSS after the starter’s existing theme. Apply the{" "}
          <code>dark</code> class to the root element for dark mode.
        </p>
        <CodeBlock
          code={themeCSS(theme)}
          language="css"
          showLineNumbers
          label="Theme CSS"
        >
          <CodeBlockHeader>
            <span>preview-theme.css</span>
            <div className="flex">
              <CodeBlockDownloadButton
                filename="preview-theme.css"
                label="Download theme CSS"
              />
              <CodeBlockCopyButton
                onCopyError={() => toast.error("Could not copy theme CSS")}
              />
            </div>
          </CodeBlockHeader>
        </CodeBlock>
      </details>
    </div>
  );
}
