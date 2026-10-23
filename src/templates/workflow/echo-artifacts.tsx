import { ChevronLeft, ChevronRight, Code, Download, FileText, X } from "lucide-react";
import Artifact from "@/blocks/data/branching-chat-artifact";
import { Button } from "./shared";
import "./refinement.css";
import { echoArtifacts } from "./echo-artifact-data";
export function EchoArtifactList({
  selected,
  onSelect,
}: {
  selected: number | null;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="echo-artifact-list">
      <p>Recent artifacts</p>
      {echoArtifacts.map((artifact, i) => (
        <button
          key={artifact.filename}
          className={selected === i ? "active" : ""}
          onClick={() => onSelect(i)}
        >
          {artifact.language === "typescript" || artifact.language === "diff" ? (
            <Code className="size-4" />
          ) : (
            <FileText className="size-4" />
          )}
          <span>{artifact.filename}</span>
        </button>
      ))}
    </div>
  );
}
export function EchoArtifactPanel({
  index,
  onSelect,
  onClose,
}: {
  index: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const artifact = echoArtifacts[index];
  function download() {
    const url = URL.createObjectURL(
      new Blob([artifact.code], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = /\.(pdf|png)$/.test(artifact.filename)
      ? `${artifact.filename}.txt`
      : artifact.filename;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <aside className="echo-artifact-panel" aria-label="Artifact preview">
      <header>
        <strong>{artifact.filename}</strong>
        <div className="wf-inline">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Previous artifact"
            disabled={index === 0}
            onClick={() => onSelect(index - 1)}
          >
            <ChevronLeft />
          </Button>
          <small>
            {index + 1} of {echoArtifacts.length}
          </small>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Next artifact"
            disabled={index === echoArtifacts.length - 1}
            onClick={() => onSelect(index + 1)}
          >
            <ChevronRight />
          </Button>
          <Button size="sm" variant="outline" onClick={download}>
            <Download />
            Download
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Close artifact preview"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
      </header>
      <div className="echo-artifact-code">
        <Artifact
          node={{ code: artifact.code, language: artifact.language, filename: artifact.filename }}
        />
      </div>
    </aside>
  );
}
