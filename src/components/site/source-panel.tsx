import { lazy, Suspense, useState } from "react";
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
import { themeCSS, type PreviewTheme } from "./preview-theme";
import { useSourceDocument } from "./source-document";

const CodeViewer = lazy(() =>
  import("./code-viewer").then((module) => ({ default: module.CodeViewer })),
);

function ThemeSource({ code }: { code: string }) {
  const source = useSourceDocument({
    scope: "theme",
    documentId: "preview-theme",
    filename: "preview-theme.css",
    code,
    language: "css",
  });
  return (
    <CodeBlock
      code={code}
      lines={source.lines}
      aria-busy={source.loading}
      language="css"
      showLineNumbers
      label="Theme CSS"
    >
      <CodeBlockHeader>
        <span>preview-theme.css</span>
        <div className="flex">
          <CodeBlockDownloadButton filename="preview-theme.css" label="Download theme CSS" />
          <CodeBlockCopyButton
            key={code}
            onCopyError={() => toast.error("Could not copy theme CSS")}
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
  const [themeSourceRequested, setThemeSourceRequested] = useState(false);
  const command = `${manager} install\n${manager === "yarn" ? "yarn dev" : `${manager} run dev`}`;
  const themeCode = themeCSS(theme);
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
          <Button variant="outline" size="sm" disabled={downloading} onClick={download}>
            <ArrowDownToLine />
            {downloading ? "Preparing…" : "Download starter"}
          </Button>
        </div>
        <p>
          Download and extract <strong>{block.id}.zip</strong>, open its folder, then run:
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
              onCopyError={() => toast.error("Could not copy installation commands")}
            />
          </CodeBlockHeader>
        </CodeBlock>
      </section>
      <section aria-label="Block source">
        <div className="source-section-heading">
          <h3>Block implementation</h3>
          <span>React · TypeScript</span>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Full implementation with imports, demo data and interactions. Shared components and the
          usage example are available in the file selector.
        </p>
        <Suspense
          fallback={
            <p role="status" className="text-sm text-muted-foreground">
              Loading source code…
            </p>
          }
        >
          <CodeViewer key={`${block.group}/${block.id}`} block={block} dark={dark} />
        </Suspense>
      </section>
      <details
        className="preset-source"
        onToggle={(event) => {
          if (event.currentTarget.open) setThemeSourceRequested(true);
        }}
      >
        <summary>Theme CSS · current customization</summary>
        <p>
          Append this CSS after the starter’s existing theme. Apply the <code>dark</code> class to
          the root element for dark mode.
        </p>
        {themeSourceRequested && <ThemeSource code={themeCode} />}
      </details>
    </div>
  );
}
