import { useRef, useState } from "react";
import { Badge } from "@/components/reui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToolbarNotice, ToolbarScene } from "../toolbars/support";
import { editorDocument } from "./data";
import { DemoContentCard } from "./free/content-card";
import { CloseEditorButton, PreviewToggle, ReviewSubmitButton } from "./free/editor-actions";
import "./final-bars.css";

export default function EditorActionNavbar() {
  const [closed, setClosed] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const heading = useRef<HTMLElement>(null);
  const summary = `${editorDocument.reference} · ${editorDocument.customer} · ${editorDocument.amount} · Due ${editorDocument.due}`;
  return (
    <ToolbarScene id={13}>
      {closed ? (
        <DemoContentCard
          label="Closed editor"
          title="Editor closed"
          description="The sample draft remains in this preview until the page is reloaded."
          actionLabel="Reopen draft"
          onAction={() => {
            setClosed(false);
            requestAnimationFrame(() => heading.current?.querySelector("button")?.focus());
          }}
        >
          <p className="text-sm text-muted-foreground">
            {editorDocument.title} · {submitted ? "Sent for review locally" : "Draft"}
          </p>
        </DemoContentCard>
      ) : (
        <>
          <Card className="final-editor-card">
            <header className="final-editor-heading" ref={heading}>
              <div className="final-editor-title">
                <CloseEditorButton onClose={() => setClosed(true)} />
                <Separator orientation="vertical" className="h-5" />
                <h1 className="truncate" title={editorDocument.title}>
                  {editorDocument.title}
                </h1>
              </div>
              <div className="final-editor-actions">
                <PreviewToggle visible={previewVisible} onChange={setPreviewVisible} />
                <ReviewSubmitButton
                  submitted={submitted}
                  onSubmitted={() => {
                    setSubmitted(true);
                    setNotice(
                      "Marked as sent for review locally. No invoice or message was transmitted.",
                    );
                  }}
                />
              </div>
            </header>
          </Card>
          {previewVisible && (
            <div className="final-invoice-preview">
              <DemoContentCard
                id="navbar-invoice-preview"
                label="Invoice preview"
                title={editorDocument.reference}
                description="Original Bricklane sample invoice, supplied only to demonstrate the preview toggle."
                actionLabel="Copy invoice summary"
                onAction={() => {
                  void navigator.clipboard.writeText(summary).then(
                    () => setNotice("Original demo invoice summary copied."),
                    () => setNotice("Clipboard access is unavailable in this browser."),
                  );
                }}
              >
                <dl className="final-invoice-fields">
                  <div>
                    <dt>Bill to</dt>
                    <dd>{editorDocument.customer}</dd>
                  </div>
                  <div>
                    <dt>Due date</dt>
                    <dd>{editorDocument.due}</dd>
                  </div>
                  <div>
                    <dt>Amount</dt>
                    <dd>{editorDocument.amount}</dd>
                  </div>
                </dl>
                <p className="mt-5 text-sm text-muted-foreground">{editorDocument.description}</p>
                <Badge variant={submitted ? "success-light" : "secondary"} className="mt-3">
                  {submitted ? "Sent for review · Local demo" : "Draft · Local demo"}
                </Badge>
              </DemoContentCard>
            </div>
          )}
          <output className="sr-only" aria-live="polite">
            Preview {previewVisible ? "visible" : "collapsed"}. Review{" "}
            {submitted ? "submitted locally" : "not submitted"}.
          </output>
        </>
      )}
      <ToolbarNotice>{notice}</ToolbarNotice>
    </ToolbarScene>
  );
}
