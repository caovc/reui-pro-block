import { useState } from "react";
import { Layers, Search, WandSparkles } from "lucide-react";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActionRow, EmptyHero, EmptyStage, LocalDialog } from "./first-run/shared";

const signals = [
  { title: "Launch readiness", description: "Design review passed; engineering sign-off is next." },
  {
    title: "Customer feedback",
    description: "Onboarding clarity is the highest-priority follow-up.",
  },
  { title: "Review decision", description: "Keep the first release focused on the core workflow." },
];

export default function BriefEmpty() {
  const [modal, setModal] = useState<"draft" | "signals" | null>(null);
  const [title, setTitle] = useState("Weekly review brief");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [brief, setBrief] = useState<{ title: string; notes: string; signals: string[] } | null>(
    null,
  );

  return (
    <EmptyStage id={5}>
      <Frame className="empty-first-split">
        <FramePanel className="empty-first-split-inner">
          <div className="empty-first-split-copy">
            <EmptyHero
              media={
                <div className="grid size-12 place-items-center rounded-xl border bg-muted/60">
                  <Layers className="size-6" />
                </div>
              }
              title={brief ? "Your Brief Is Ready" : "No Brief Is Ready Yet"}
              description={
                brief
                  ? "A local draft brings your selected signals and notes together for review."
                  : "Pull open signals, notes, and decisions into one clear brief before the review starts."
              }
            >
              <ActionRow>
                <Button onClick={() => setModal("draft")}>
                  <WandSparkles />
                  Draft Brief
                </Button>
                <Button variant="outline" onClick={() => setModal("signals")}>
                  <Search />
                  Browse Signals
                </Button>
                {brief && (
                  <Button variant="ghost" onClick={() => setBrief(null)}>
                    Reset preview
                  </Button>
                )}
              </ActionRow>
            </EmptyHero>
          </div>
          <section
            className="empty-first-preview"
            data-testid="brief-preview"
            data-populated={!!brief}
            aria-label="Brief preview"
          >
            {brief && (
              <>
                <Badge variant="secondary">Local draft</Badge>
                <h2 className="mt-4">{brief.title}</h2>
                <p>{brief.notes || "No additional notes."}</p>
                <div className="empty-first-preview-list">
                  {brief.signals.length ? (
                    brief.signals.map((name) => (
                      <div key={name}>
                        <span>{name}</span>
                        <span>Included</span>
                      </div>
                    ))
                  ) : (
                    <p>No signals attached.</p>
                  )}
                </div>
              </>
            )}
          </section>
        </FramePanel>
      </Frame>
      <LocalDialog
        title={modal === "signals" ? "Browse Signals" : "Draft Brief"}
        description={
          modal === "signals"
            ? "Select local example signals to include in your brief."
            : "Save a local draft. This demo does not generate text with an AI service."
        }
        open={modal !== null}
        onOpenChange={(open) => !open && setModal(null)}
      >
        {modal === "signals" ? (
          <div className="grid gap-4">
            {signals.map((signal) => (
              <label className="flex items-start gap-3 rounded-lg border p-3" key={signal.title}>
                <Checkbox
                  className="mt-0.5"
                  checked={selected.includes(signal.title)}
                  onCheckedChange={(checked) =>
                    setSelected((current) =>
                      checked
                        ? [...current, signal.title]
                        : current.filter((value) => value !== signal.title),
                    )
                  }
                />
                <span>
                  <strong className="block text-sm">{signal.title}</strong>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {signal.description}
                  </span>
                </span>
              </label>
            ))}
            <Button onClick={() => setModal("draft")}>
              Use {selected.length} selected signals
            </Button>
          </div>
        ) : (
          <form
            className="empty-first-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!title.trim()) return;
              setBrief({ title: title.trim(), notes: notes.trim(), signals: selected });
              setModal(null);
            }}
          >
            <label>
              Brief title
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={80}
              />
            </label>
            <label>
              Review notes
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Key decisions and next steps…"
                rows={4}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              {selected.length} signals attached · Stored only while this preview is open
            </p>
            <Button type="submit">Save brief draft</Button>
          </form>
        )}
      </LocalDialog>
    </EmptyStage>
  );
}
