import { useRef, useState } from "react";
import { AlertTriangle, CreditCard } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { DialogSurface } from "./free/dialog-surface";
import { DialogLauncher, FooterHelp } from "./support";

const reasons = [
  "Only needed one launch",
  "Budget changed",
  "Missing a few patterns",
  "Moved back in-house",
  "Not the right stack fit",
  "Wanted better Figma parity",
  "Output felt inconsistent",
  "Something else",
];

export default function CancellationDialog() {
  const [open, setOpen] = useState(false);
  const [noticeVisible, setNoticeVisible] = useState(true);
  const [manageVisible, setManageVisible] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [saved, setSaved] = useState<{ reasons: string[]; feedback: string } | null>(null);
  const keepButton = useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogLauncher
        id={3}
        title="Your workspace plan"
        description="Review your plan before making a change."
        icon={<CreditCard />}
        action="Open cancellation survey"
        result={
          saved && (
            <span>
              {saved.reasons.join(" · ")}
              {saved.feedback && ` — ${saved.feedback}`}. Survey saved locally. Your actual plan,
              billing and access are unchanged.
            </span>
          )
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-sm">Team workspace</strong>
            <Badge variant="success-light">Active</Badge>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Shared access stays on through the current billing period.
          </p>
        </div>
      </DialogLauncher>
      <DialogSurface
        id={3}
        title="Cancel Your Plan"
        description="Your workspace stays active through the current billing period."
        initialFocus={() => keepButton.current?.focus()}
        footer={
          <>
            <FooterHelp label="Billing stays active">
              This local survey does not cancel a subscription or change billing.
            </FooterHelp>
            <div className="refined-dialog-actions">
              <DialogClose asChild>
                <Button variant="outline" ref={keepButton}>
                  Keep plan
                </Button>
              </DialogClose>
              <Button
                disabled={!selected.length}
                onClick={() => {
                  setSaved({ reasons: selected, feedback: feedback.trim() });
                  setOpen(false);
                }}
              >
                Cancel plan
              </Button>
            </div>
          </>
        }
      >
        <FieldGroup>
          {noticeVisible && (
            <Alert variant="warning">
              <AlertTriangle />
              <AlertTitle className="line-clamp-none">
                Shared access pauses after expiry.
              </AlertTitle>
              <AlertDescription>
                Team access stays on until the current period ends.
              </AlertDescription>
              <AlertAction>
                <Button variant="outline" size="xs" onClick={() => setNoticeVisible(false)}>
                  Dismiss
                </Button>
                <Button size="xs" onClick={() => setManageVisible((value) => !value)}>
                  Manage
                </Button>
              </AlertAction>
            </Alert>
          )}
          {manageVisible && (
            <Alert variant="info">
              <CreditCard />
              <AlertTitle>Local plan summary</AlertTitle>
              <AlertDescription>
                No billing account is connected. This example never changes a subscription or
                payment method.
              </AlertDescription>
            </Alert>
          )}
          <FieldSet>
            <FieldLegend className="sr-only">Select cancellation reasons</FieldLegend>
            <div className="refined-dialog-reasons">
              {reasons.map((reason, index) => (
                <FieldLabel
                  key={reason}
                  htmlFor={`refined-reason-${index}`}
                  className="refined-dialog-reason"
                  data-selected={selected.includes(reason)}
                >
                  <span>{reason}</span>
                  <Checkbox
                    id={`refined-reason-${index}`}
                    checked={selected.includes(reason)}
                    onCheckedChange={(checked) =>
                      setSelected((current) =>
                        checked
                          ? [...current, reason]
                          : current.filter((entry) => entry !== reason),
                      )
                    }
                  />
                </FieldLabel>
              ))}
            </div>
          </FieldSet>
          <Field>
            <FieldLabel className="sr-only" htmlFor="refined-cancellation-feedback">
              Additional feedback
            </FieldLabel>
            <Textarea
              id="refined-cancellation-feedback"
              className="min-h-24"
              value={feedback}
              maxLength={1200}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Anything we should improve before you leave Bricklane?"
            />
          </Field>
        </FieldGroup>
      </DialogSurface>
    </Dialog>
  );
}
