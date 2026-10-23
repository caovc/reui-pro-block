import type { CSSProperties } from "react";
import {
  CodeBlock,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/reui/code-block/code-block";
import type { ChatNode } from "./branching-chat-data";

type ArtifactProps = {
  node: Pick<ChatNode, "code" | "language" | "filename">;
  /** Notification after the official copy control has written the clipboard. */
  onCopy?: (text: string) => void;
};

const artifactMetrics = {
  "--code-block-padding": "8px",
  "--code-block-line-height": "18px",
  "--code-block-font-size": "13px",
  "--code-block-radius": "var(--radius)",
} as CSSProperties;

export default function Artifact({ node, onCopy }: ArtifactProps) {
  return (
    <CodeBlock
      code={node.code ?? ""}
      language={node.language || "markdown"}
      showLineNumbers={false}
      className="w-full overflow-hidden bg-background [&_[data-slot=code-block-line]]:px-2.5"
      style={artifactMetrics}
    >
      <CodeBlockHeader className="h-8 min-h-8 gap-2 px-2.5">
        <CodeBlockTitle>{node.filename || `example.${node.language || "markdown"}`}</CodeBlockTitle>
        <CodeBlockCopyButton
          size="icon-xs"
          className="ml-auto"
          labels={{ copy: "Copy code", copied: "Copied" }}
          onCopy={onCopy}
        />
      </CodeBlockHeader>
    </CodeBlock>
  );
}
