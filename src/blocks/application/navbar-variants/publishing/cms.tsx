import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DialogSurface } from "../../dialog-variants/first-run/free/dialog-surface";
import { PublishControls } from "./free/publish-controls";
import { article } from "./data";
import { SchedulePostDialog } from "./schedule";
import { PlaceholderPanel, ToolbarNotice, ToolbarScene } from "./support";

export default function CmsPublishNavbar() {
  const [status, setStatus] = useState("Draft");
  const [notice, setNotice] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleNow, setScheduleNow] = useState(() => Date.now());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [history, setHistory] = useState(["Draft created locally"]);
  function record(value: string) {
    setHistory((current) => [value, ...current]);
    setNotice(`${value}. Local demonstration only; nothing was published remotely.`);
  }
  function action(value: string) {
    if (value === "preview") setPreviewOpen(true);
    if (value === "publish") {
      setStatus("Published");
      record("Published the local post");
    }
    if (value === "draft") {
      setStatus("Draft");
      record("Saved as draft");
    }
    if (value === "schedule") {
      setScheduleNow(Date.now());
      setScheduleOpen(true);
    }
    if (value === "duplicate") record("Created a local post copy");
    if (value === "history") setHistoryOpen(true);
    if (value === "archive") {
      setStatus("Archived");
      record("Archived the local post");
    }
    if (value === "delete") setDeleteOpen(true);
  }
  return (
    <ToolbarScene id={7}>
      <header className="publishing-cms-header">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setNotice("Returned to the local Blog Posts view.")}
        >
          <ArrowLeft data-icon="inline-start" />
          Blog Posts
        </Button>
        <PublishControls
          onAction={action}
          disabled={status === "Deleted" || status === "Archived"}
        />
      </header>
      <PlaceholderPanel>
        <output className="sr-only" aria-live="polite">
          Post status: {status}.
        </output>
      </PlaceholderPanel>
      <ToolbarNotice>{notice}</ToolbarNotice>
      {["Archived", "Deleted"].includes(status) && (
        <Button
          className="mt-3"
          variant="outline"
          size="sm"
          onClick={() => {
            setStatus("Draft");
            record("Restored local post as draft");
          }}
        >
          Restore local post
        </Button>
      )}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogSurface
          id={208}
          title="Post preview"
          description="Original demo content; this preview is not publicly published."
          footer={
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close preview
            </Button>
          }
        >
          <article className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">{article.title}</h2>
            <p className="text-sm font-medium">{article.summary}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{article.body}</p>
          </article>
        </DialogSurface>
      </Dialog>
      <SchedulePostDialog
        referenceTime={scheduleNow}
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        onSchedule={(date) => {
          setStatus(`Scheduled ${date}`);
          record(`Scheduled for ${date}`);
        }}
      />
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogSurface
          id={209}
          title="Post history"
          description="Changes recorded in this browser session."
          footer={
            <Button variant="outline" onClick={() => setHistoryOpen(false)}>
              Close history
            </Button>
          }
        >
          <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm">
            {history.map((item, index) => (
              <li key={`${index}-${item}`}>{item}</li>
            ))}
          </ol>
        </DialogSurface>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogSurface
          id={210}
          title="Delete local post?"
          description="This affects only this example; Restore remains available."
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setStatus("Deleted");
                  setDeleteOpen(false);
                  record("Deleted the local post");
                }}
              >
                Delete local post
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">No content is deleted remotely.</p>
        </DialogSurface>
      </Dialog>
    </ToolbarScene>
  );
}
