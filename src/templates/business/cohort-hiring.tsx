/* Board state belongs to Cohort so navigation does not discard candidate edits. */
/* eslint-disable react/only-export-components */
import { useState } from "react";
import { CalendarDays, MapPin, CircleDollarSign, GripVertical } from "lucide-react";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
} from "@/components/reui/kanban";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { demoAvatar } from "@/lib/demo-artwork";
import { Button, Input } from "./shared";
import { Choice, Tone } from "./fidelity";

type Candidate = {
  id: string;
  name: string;
  city: string;
  zone: string;
  applied: string;
  score: number;
  days: number;
  salary: string;
  status: string;
  notes: string;
  interview: string;
};
const stages = ["Sourced", "Screening", "Interview", "Assessment", "Offer"];
const seed = [
  ["Sourced", "Yara Lindholm", "Munich", "CET", "25 Jun", 74, 8],
  ["Sourced", "Halima Ferrand", "Munich", "CET", "23 Jun", 71, 8],
  ["Screening", "Zane Hoffmann", "Amsterdam", "CET", "16 Jun", 71, 28],
  ["Screening", "Otto Yamada", "Paris", "CET", "16 Jun", 71, 9],
  ["Screening", "Nils Adeyinka", "Munich", "CET", "11 Jun", 70, 8],
  ["Interview", "Bilal Nkemdirim", "Manchester", "GMT", "10 Jun", 82, 8],
  ["Interview", "Dilara Ekwueme", "Berlin", "CET", "12 Jun", 73, 7],
  ["Assessment", "Imani Varga", "Madrid", "CET", "11 Jun", 86, 5],
  ["Assessment", "Anouk Almeida", "Munich", "CET", "11 Jun", 82, 10],
  ["Offer", "Bruno Almeida", "London", "GMT", "12 Jun", 87, 3],
  ["Offer", "Ivan Duarte", "Rotterdam", "CET", "10 Jun", 84, 4],
  ["Offer", "Dilara Zielinski", "Madrid", "CET", "23 Jun", 81, 6],
];
const initial = Object.fromEntries(
  stages.map((stage) => [
    stage,
    seed
      .filter((row) => row[0] === stage)
      .map((row, index) => ({
        id: `${stage}-${index}`,
        name: String(row[1]),
        city: String(row[2]),
        zone: String(row[3]),
        applied: `${row[4]} 2026`,
        score: Number(row[5]),
        days: Number(row[6]),
        salary: index % 2 ? "£85k – £105k" : "£90k – £110k",
        status:
          stage === "Sourced" || stage === "Screening"
            ? "Not scheduled"
            : stage === "Interview"
              ? "Scheduled"
              : "Submitted",
        notes: "",
        interview: "",
      })),
  ]),
) as Record<string, Candidate[]>;
export function resetCohortHiring(model: ReturnType<typeof useCohortHiringState>) {
  model[1](initial);
}
export function useCohortHiringState() {
  return useState(initial);
}
export function CohortHiring({ model }: { model: ReturnType<typeof useCohortHiringState> }) {
  const [board, setBoard] = model;
  const [role, setRole] = useState("Senior Engineer");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [stage, setStage] = useState("Sourced");
  const [notes, setNotes] = useState("");
  const [interview, setInterview] = useState("");
  function inspect(candidate: Candidate, current: string) {
    setSelected(candidate);
    setStage(current);
    setNotes(candidate.notes);
    setInterview(candidate.interview);
  }
  return (
    <div className="bt-cohort-hiring">
      <div className="bt-hiring-heading">
        <h1>Hiring</h1>
        <Choice
          label="Hiring role"
          value={role}
          onChange={setRole}
          options={["Senior Engineer", "Product Designer", "Account Executive"]}
        />
      </div>
      <Kanban value={board} onValueChange={setBoard} getItemValue={(item) => item.id}>
        <KanbanBoard className="bt-hiring-board">
          {stages.map((name, stageIndex) => (
            <KanbanColumn key={name} value={name} className="bt-hiring-column">
              <header>
                <i
                  style={{
                    background: ["#91a4bd", "#0eace1", "#9562ed", "#f0a700", "#00ba91"][stageIndex],
                  }}
                />
                <strong>{name}</strong>
                <small>{board[name].length}</small>
              </header>
              <KanbanColumnContent value={name} className="bt-hiring-cards">
                {board[name].map((candidate) => (
                  <KanbanItem key={candidate.id} value={candidate.id} className="bt-hiring-card">
                    <div className="bt-candidate-title">
                      <img src={demoAvatar(candidate.name)} alt="" />
                      <button onClick={() => inspect(candidate, name)}>
                        <strong>{candidate.name}</strong>
                        <span>{role}</span>
                      </button>
                      <KanbanItemHandle aria-label={`Move ${candidate.name}`}>
                        <GripVertical size={14} />
                      </KanbanItemHandle>
                    </div>
                    <div className="bt-candidate-meta">
                      <p>
                        <MapPin size={14} />
                        {candidate.city} <span>{candidate.zone}</span>
                      </p>
                      <p>
                        <CalendarDays size={14} />
                        Applied {candidate.applied}
                      </p>
                      <p>
                        <CircleDollarSign size={14} />
                        {candidate.salary}
                      </p>
                    </div>
                    <div className="bt-match-score">
                      <span>Match score</span>
                      <strong style={{ color: candidate.score > 80 ? "#0eace1" : "#9562ed" }}>
                        {candidate.score}%
                      </strong>
                      <i>
                        <span
                          style={{
                            width: `${candidate.score}%`,
                            background: candidate.score > 80 ? "#0eace1" : "#9562ed",
                          }}
                        />
                      </i>
                    </div>
                    <footer>
                      <Tone
                        tone={
                          candidate.status === "Scheduled"
                            ? "blue"
                            : candidate.status === "Submitted"
                              ? "green"
                              : "neutral"
                        }
                      >
                        {candidate.status}
                      </Tone>
                      {candidate.days > 20 ? (
                        <Tone tone="amber">Stalled {candidate.days}d</Tone>
                      ) : (
                        <small>{candidate.days}d in stage</small>
                      )}
                    </footer>
                  </KanbanItem>
                ))}
              </KanbanColumnContent>
            </KanbanColumn>
          ))}
        </KanbanBoard>
      </Kanban>
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="bt-floating-sheet bt-candidate-sheet">
          <SheetHeader>
            <SheetTitle>{selected?.name}</SheetTitle>
            <SheetDescription>
              {role} · {selected?.city}
            </SheetDescription>
          </SheetHeader>
          <form
            className="bt-form"
            onSubmit={(event) => {
              event.preventDefault();
              setBoard((current) => {
                const next = Object.fromEntries(
                  Object.entries(current).map(([key, candidates]) => [
                    key,
                    candidates.filter((candidate) => candidate.id !== selected?.id),
                  ]),
                );
                if (selected)
                  next[stage] = [
                    ...next[stage],
                    {
                      ...selected,
                      notes,
                      interview,
                      status: interview ? "Scheduled" : selected.status,
                    },
                  ];
                return next;
              });
              setSelected(null);
            }}
          >
            <label>
              Pipeline stage
              <Choice label="Pipeline stage" value={stage} onChange={setStage} options={stages} />
            </label>
            <label>
              Interview date
              <Input
                type="date"
                value={interview}
                onChange={(event) => setInterview(event.target.value)}
              />
            </label>
            <label>
              Hiring notes
              <Textarea
                aria-label="Hiring notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Capture interview feedback and next steps..."
              />
            </label>
            <p className="text-muted-foreground text-sm">
              Match score {selected?.score}% · Applied {selected?.applied}
            </p>
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button type="submit">Save candidate</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
