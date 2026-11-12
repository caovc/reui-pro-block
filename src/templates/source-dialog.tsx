import {
  startTransition,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
  normalizeCode,
  resolveCodeBlockLanguage,
  toPlainLines,
  type CodeBlockLine,
} from "@/components/reui/code-block/code-block-highlight";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import TemplateSourceFilePicker from "./source-file-picker";
import type { TemplateMeta } from "./catalog";
import type { SourceHighlightRequest, SourceHighlightResponse } from "./source-document.worker";
import { templateFiles, downloadTemplate } from "./source";

const EMPTY_SOURCE_LINES: CodeBlockLine[] = [];

type SourceDocument = {
  templateId: string;
  filename: string;
  code: string;
  language: string;
};

type PreparedSourceDocument = {
  document: SourceDocument;
  lines: CodeBlockLine[];
  highlightUnavailable: boolean;
};

type CachedSourceDocument = {
  readonly lines: CodeBlockLine[];
  readonly serializedPayloadBytes: number;
};

const SOURCE_CACHE_MAX_ENTRIES = 9;
const SOURCE_CACHE_MAX_RAW_CODE_UNITS = 262_144;
const SOURCE_CACHE_MAX_SERIALIZED_BYTES = 8 * 1024 * 1024;
const sourceDocumentCache = new Map<SourceDocument, CachedSourceDocument>();
const sourceCacheEncoder = new TextEncoder();
let cachedRawCodeUnits = 0;
let cachedSerializedPayloadBytes = 0;

function sameSourceDocument(left: SourceDocument, right: SourceDocument) {
  return (
    left.templateId === right.templateId &&
    left.filename === right.filename &&
    left.language === right.language &&
    left.code === right.code
  );
}

function forgetCachedSourceDocument(document: SourceDocument) {
  const cached = sourceDocumentCache.get(document);
  if (!cached) return;
  sourceDocumentCache.delete(document);
  cachedRawCodeUnits -= document.code.length;
  cachedSerializedPayloadBytes -= cached.serializedPayloadBytes;
}

// These helpers are called only from the request effect or its worker callback.
// A hit touches LRU order without changing the accepted official line model.
function findCachedSourceDocument(document: SourceDocument) {
  for (const [key, cached] of sourceDocumentCache) {
    if (!sameSourceDocument(key, document)) continue;
    sourceDocumentCache.delete(key);
    sourceDocumentCache.set(key, cached);
    return cached.lines;
  }
  return null;
}

function cacheVerifiedSourceDocument(document: SourceDocument, lines: CodeBlockLine[]) {
  if (document.code.length > SOURCE_CACHE_MAX_RAW_CODE_UNITS) return;
  let serializedPayloadBytes: number;
  try {
    // This bounds retained serialized payload, not JavaScript heap usage.
    serializedPayloadBytes = sourceCacheEncoder.encode(
      JSON.stringify({ document, lines }),
    ).byteLength;
  } catch {
    return;
  }
  if (serializedPayloadBytes > SOURCE_CACHE_MAX_SERIALIZED_BYTES) return;

  for (const key of sourceDocumentCache.keys()) {
    if (!sameSourceDocument(key, document)) continue;
    forgetCachedSourceDocument(key);
    break;
  }
  const key = Object.freeze({ ...document });
  // The free renderer derives visible arrays and reads these line/token/state
  // objects without mutating them. Retain the model without cloning/freezing
  // its large arrays; cache ownership keeps it read-only between dialog mounts.
  sourceDocumentCache.set(key, { lines, serializedPayloadBytes });
  cachedRawCodeUnits += document.code.length;
  cachedSerializedPayloadBytes += serializedPayloadBytes;
  while (
    sourceDocumentCache.size > SOURCE_CACHE_MAX_ENTRIES ||
    cachedRawCodeUnits > SOURCE_CACHE_MAX_RAW_CODE_UNITS ||
    cachedSerializedPayloadBytes > SOURCE_CACHE_MAX_SERIALIZED_BYTES
  ) {
    const oldest = sourceDocumentCache.keys().next().value;
    if (!oldest) break;
    forgetCachedSourceDocument(oldest);
  }
}

function TemplateSourceCodeBlock({
  templateId,
  filename,
  code,
  language,
  wrap,
  onWrapChange,
  children,
}: SourceDocument & {
  wrap: boolean;
  onWrapChange: (wrap: boolean) => void;
  children: ReactNode;
}) {
  const instanceKey = useId();
  const requested = useMemo(
    () => ({ templateId, filename, code, language }),
    [templateId, filename, code, language],
  );
  const generation = useRef(0);
  const workerRef = useRef<Worker | null>(null);
  const workerUnavailable = useRef(false);
  const [prepared, setPrepared] = useState<PreparedSourceDocument | null>(null);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    [],
  );

  useEffect(() => {
    let active = true;
    const request = ++generation.current;
    const commit = (lines: CodeBlockLine[], highlightUnavailable: boolean) => {
      if (!active || request !== generation.current) return;
      // CodeBlock defers its raw source internally. A transition prepares the
      // complete model against the same raw line endings without partial rows.
      startTransition(() => {
        setPrepared({ document: requested, lines, highlightUnavailable });
      });
    };

    const acceptLines = (lines: CodeBlockLine[]) => {
      if (!active || request !== generation.current) return;
      const originalLines = normalizeCode(requested.code).split("\n");
      const preservesSource =
        lines.length === originalLines.length &&
        lines.every(
          (line, index) =>
            line.number === index + 1 &&
            line.text === originalLines[index] &&
            line.tokens.map((token) => token.content).join("") === originalLines[index],
        );
      if (!preservesSource) {
        commit(toPlainLines(requested.code), true);
        return;
      }
      const expectsSyntax =
        Boolean(resolveCodeBlockLanguage(requested.language)) && /\S/.test(requested.code);
      const hasColors = lines.some((line) =>
        line.tokens.some((token) => token.color || token.colorDark),
      );
      if (expectsSyntax && hasColors) cacheVerifiedSourceDocument(requested, lines);
      commit(lines, expectsSyntax && !hasColors);
    };
    const abandon = () => {
      active = false;
    };

    // A failed worker stays unavailable for this dialog session. Plain source
    // remains usable, without retrying or moving syntax work onto the UI thread.
    if (workerUnavailable.current) {
      commit(toPlainLines(requested.code), true);
      return abandon;
    }
    const failWorker = (worker: Worker) => {
      if (!active || request !== generation.current || workerUnavailable.current) return;
      workerUnavailable.current = true;
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      commit(toPlainLines(requested.code), true);
    };
    const cachedLines = findCachedSourceDocument(requested);
    if (cachedLines) {
      const worker = workerRef.current;
      const onCachedFailure = () => {
        if (worker) failWorker(worker);
      };
      // A previous request can still be running in this dialog's worker. Keep
      // transport failures sticky even though this hit posts no new request.
      worker?.addEventListener("error", onCachedFailure);
      worker?.addEventListener("messageerror", onCachedFailure);
      commit(cachedLines, false);
      return () => {
        abandon();
        worker?.removeEventListener("error", onCachedFailure);
        worker?.removeEventListener("messageerror", onCachedFailure);
      };
    }
    let worker: Worker;
    try {
      worker =
        workerRef.current ??
        new Worker(new URL("./source-document.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
    } catch {
      workerUnavailable.current = true;
      commit(toPlainLines(requested.code), true);
      return abandon;
    }

    const onFailure = () => failWorker(worker);
    const onMessage = ({ data }: MessageEvent<SourceHighlightResponse>) => {
      if (
        !active ||
        request !== generation.current ||
        workerUnavailable.current ||
        data.id !== request
      )
        return;
      if ("error" in data) onFailure();
      else acceptLines(data.lines);
    };
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onFailure);
    worker.addEventListener("messageerror", onFailure);
    try {
      worker.postMessage({
        id: request,
        code: requested.code,
        language: requested.language,
        instanceKey,
      } satisfies SourceHighlightRequest);
    } catch {
      onFailure();
    }

    return () => {
      abandon();
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onFailure);
      worker.removeEventListener("messageerror", onFailure);
    };
  }, [requested, instanceKey]);

  // Matching the exact request also rejects a stale A -> B -> A completion.
  const current = prepared?.document === requested ? prepared : null;
  const loading = current === null;
  return (
    <CodeBlock
      key={templateId}
      code={requested.code}
      lines={current?.lines ?? EMPTY_SOURCE_LINES}
      language={requested.language}
      showLineNumbers
      wrap={wrap}
      onWrapChange={onWrapChange}
      label={`Template source code: ${requested.filename}`}
      className="template-source-viewer"
      aria-busy={loading}
    >
      {children}
      {(loading || current?.highlightUnavailable) && (
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
