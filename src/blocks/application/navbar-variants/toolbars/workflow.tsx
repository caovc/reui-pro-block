import { downloadContent } from "./download";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, History, LoaderCircle, Play } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DialogSurface } from "../../dialog-variants/first-run/free/dialog-surface";
import { WorkflowActive } from "./free/active-switch";
import { WorkflowMenu } from "./free/workflow-menu";
import { initialRuns } from "./data";
import { PlaceholderPanel, ToolbarNotice, ToolbarScene } from "./support";

export default function WorkflowEditorNavbar() {
  const [active, setActive] = useState(true);
  const [running, setRunning] = useState(false);
  const [runs, setRuns] = useState(initialRuns);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [duplicates, setDuplicates] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function testRun() {
    if (running || deleted) return;
    setRunning(true);
    timer.current = setTimeout(() => {
      setRuns((current) => [
        {
          id: `run-${103 + current.length - initialRuns.length}`,
          status: "Succeeded",
          date: "Just now · local demo",
          duration: "1.2s",
        },
        ...current,
      ]);
      setRunning(false);
      setNotice("Test run succeeded in the local simulator. No automation was executed remotely.");
    }, 1200);
  }
  function action(value: string) {
    if (value === "export")
      downloadContent(
        "workflow.json",
        JSON.stringify({ name: "Workflow", active, duplicates, runs, demo: true }, null, 2),
        "application/json",
      );
    if (value === "duplicate") {
      setDuplicates((current) => current + 1);
      setNotice(`Created local workflow copy ${duplicates + 1}.`);
    }
    if (value === "share") {
      void navigator.clipboard.writeText(window.location.href).then(
        () => setNotice("Local preview link copied. No sharing permissions changed."),
        () => setNotice(`Local preview link: ${window.location.href}`),
      );
    }
    if (value === "delete") setDeleteOpen(true);
  }
  return (
    <ToolbarScene id={5}>
      <header className="toolbar-workflow">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setNotice("Returned to the local workflows view.")}
        >
          <ArrowLeft data-icon="inline-start" />
          Workflows
        </Button>
        <div className="toolbar-actions">
          <WorkflowActive active={active} onChange={setActive} />
          <Separator orientation="vertical" className="h-5" />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Run history"
            onClick={() => setHistoryOpen(true)}
          >
            <History />
          </Button>
          <Button size="sm" disabled={running || deleted} onClick={testRun}>
            {running ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <Play data-icon="inline-start" />
            )}
            {running ? "Running…" : "Test Run"}
          </Button>
          <WorkflowMenu onAction={action} />
        </div>
      </header>
      <PlaceholderPanel />
      {deleted && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDeleted(false);
              setNotice("Workflow restored locally.");
            }}
          >
            Restore local workflow
          </Button>
        </div>
      )}
      <ToolbarNotice>{notice}</ToolbarNotice>
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogSurface
          id={105}
          title="Run history"
          description="Sample runs and this session's local simulations."
          footer={
            <Button variant="outline" onClick={() => setHistoryOpen(false)}>
              Close history
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>{run.id}</TableCell>
                  <TableCell>
                    <Badge
                      variant={run.status === "Succeeded" ? "success-light" : "destructive-light"}
                    >
                      {run.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{run.date}</TableCell>
                  <TableCell>{run.duration}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogSurface>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogSurface
          id={106}
          title="Delete local workflow?"
          description="Only the example in this preview is affected. You can restore it afterward."
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleted(true);
                  setDeleteOpen(false);
                  setNotice("Workflow removed locally. No remote workflow was deleted.");
                }}
              >
                Delete local workflow
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">
            Test runs are unavailable until this local workflow is restored.
          </p>
        </DialogSurface>
      </Dialog>
    </ToolbarScene>
  );
}
