import { useEffect, useRef, useState } from "react";
import { Copy, LoaderCircle, Play, Share2 } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DialogSurface } from "../../dialog-variants/first-run/free/dialog-surface";
import { WorkspaceTrail } from "../first-run/free/trail";
import { BranchPicker } from "./free/branch-picker";
import { PlaceholderPanel, ToolbarNotice, ToolbarScene } from "./support";

export default function RepositoryNavbar() {
  const [branch, setBranch] = useState("main");
  const [target, setTarget] = useState("Vite");
  const [running, setRunning] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const link = window.location.href;
  function run() {
    const selectedBranch = branch;
    const selectedTarget = target;
    setRunning(true);
    timer.current = setTimeout(() => {
      setRunning(false);
      setNotice(
        `Local run simulated for ${selectedBranch} via ${selectedTarget}. No repository code was executed.`,
      );
    }, 1200);
  }
  return (
    <ToolbarScene id={9}>
      <header className="publishing-repo-header">
        <div className="publishing-repo-path">
          <div className="publishing-brand">
            <BrandMark className="size-7" />
            <span className="text-sm font-semibold">Bricklane</span>
          </div>
          <Separator orientation="vertical" className="h-5" />
          <WorkspaceTrail
            items={[{ label: "bricklane" }, { label: "component-studio" }]}
            onNavigate={() => setNotice("Organization selected in this local preview.")}
          />
        </div>
        <div className="publishing-actions">
          <BranchPicker
            value={branch}
            onChange={setBranch}
            onTarget={(value) => {
              setTarget(value);
              setNotice(`${value} target selected locally for ${branch}. No deployment started.`);
            }}
          />
          <Separator orientation="vertical" className="h-5" />
          <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
            <Share2 data-icon="inline-start" />
            Share
          </Button>
          <Button size="sm" disabled={running} onClick={run}>
            {running ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <Play data-icon="inline-start" />
            )}
            {running ? "Running…" : "Run"}
          </Button>
        </div>
      </header>
      <PlaceholderPanel>
        <output className="sr-only" aria-live="polite">
          Repository bricklane/component-studio. Branch {branch}. Target {target}.
        </output>
      </PlaceholderPanel>
      <ToolbarNotice>{notice}</ToolbarNotice>
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogSurface
          id={213}
          title="Share repository preview"
          description="Share this public example URL. Branch selection remains local; repository access is not changed."
          footer={
            <Button variant="outline" onClick={() => setShareOpen(false)}>
              Close share
            </Button>
          }
        >
          <Field>
            <FieldLabel htmlFor="navbar9-preview-link">Preview link</FieldLabel>
            <Input id="navbar9-preview-link" value={link} readOnly />
          </Field>
          <p className="mt-3 text-xs text-muted-foreground">
            Current local branch: {branch} · target: {target}
          </p>
          <Button
            className="mt-3"
            size="sm"
            onClick={() => {
              void navigator.clipboard.writeText(link).then(
                () => setNotice("Preview link copied. No repository permissions changed."),
                () => setNotice(`Preview URL: ${link}`),
              );
            }}
          >
            <Copy data-icon="inline-start" />
            Copy link
          </Button>
        </DialogSurface>
      </Dialog>
    </ToolbarScene>
  );
}
