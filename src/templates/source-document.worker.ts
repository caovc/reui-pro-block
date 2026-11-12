// Reuses the actual ReUI free CodeBlock highlighter and its retained MIT notice.
import {
  highlightCode,
  type CodeBlockLine,
} from "@/components/reui/code-block/code-block-highlight";

export type SourceHighlightRequest = {
  id: number;
  code: string;
  language: string;
  instanceKey: string;
};

export type SourceHighlightResponse =
  | { id: number; lines: CodeBlockLine[] }
  | { id: number; error: "highlight-failed" };

// Keep worker-only typing local: the application also compiles against DOM lib.
const scope = self as unknown as {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<SourceHighlightRequest>) => void,
  ): void;
  postMessage(message: SourceHighlightResponse): void;
};

scope.addEventListener("message", async ({ data }) => {
  const { id, code, language, instanceKey } = data;
  try {
    const lines = await highlightCode(code, { language, instanceKey });
    // One complete official model; no plain-first or progressive color batches.
    scope.postMessage({ id, lines });
  } catch {
    scope.postMessage({ id, error: "highlight-failed" });
  }
});
