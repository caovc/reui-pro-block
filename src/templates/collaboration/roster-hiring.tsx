import { useState } from "react";
import { CalendarDays, MapPin, CircleDollarSign } from "lucide-react";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
} from "@/components/reui/kanban";
import { Badge } from "@/components/reui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Avatar, Button, ReferenceSheet } from "./shared";
import "./roster-hiring.css";

type Candidate = {
  id: string;
  name: string;
  city: string;
  timezone: string;
  applied: string;
  salary: string;
  match: number;
  days: number;
  stalled?: boolean;
};
const seed = [
  ["Sourced", "Yara Lindholm", "Munich", "CET", "25 Jun 2026", "£90k – £110k", 74, 8],
  ["Sourced", "Halima Ferrand", "Munich", "CET", "23 Jun 2026", "£90k – £110k", 71, 8],
  ["Screening", "Zane Hoffmann", "Amsterdam", "CET", "16 Jun 2026", "£85k – £105k", 71, 28],
  ["Screening", "Otto Yamada", "Paris", "CET", "16 Jun 2026", "£85k – £105k", 71, 9],
  ["Screening", "Nils Adeyinka", "Munich", "CET", "11 Jun 2026", "£90k – £110k", 70, 8],
  ["Interview", "Bilal Nkemdirim", "Manchester", "GMT", "10 Jun 2026", "£90k – £110k", 82, 8],
  ["Interview", "Dilara Ekwueme", "Berlin", "CET", "12 Jun 2026", "£85k – £105k", 73, 7],
  ["Assessment", "Imani Varga", "Madrid", "CET", "11 Jun 2026", "£85k – £105k", 86, 5],
  ["Assessment", "Anouk Almeida", "Munich", "CET", "11 Jun 2026", "£90k – £110k", 82, 10],
  ["Offer", "Bruno Almeida", "London", "GMT", "12 Jun 2026", "£85k – £105k", 87, 3],
  ["Offer", "Ivan Duarte", "Rotterdam", "CET", "10 Jun 2026", "£90k – £110k", 84, 4],
  ["Offer", "Dilara Zielinski", "Madrid", "CET", "23 Jun 2026", "£85k – £105k", 81, 6],
] as const;
const stages = ["Sourced", "Screening", "Interview", "Assessment", "Offer"];
function candidates(): Record<string, Candidate[]> {
  return Object.fromEntries(
    stages.map((stage) => [
      stage,
      seed
        .filter((row) => row[0] === stage)
        .map((row) => ({
          id: row[1],
          name: row[1],
          city: row[2],
          timezone: row[3],
          applied: row[4],
          salary: row[5],
          match: row[6],
          days: row[7],
          stalled: row[7] === 28,
        })),
    ]),
  );
}
export function useRosterHiringState() {
  const [columns, setColumns] = useState(candidates);
  const [scheduled, setScheduled] = useState<string[]>([]);
  return { columns, setColumns, scheduled, setScheduled };
}
export function RosterHiring({
  query,
  state,
}: {
  query: string;
  state: ReturnType<typeof useRosterHiringState>;
}) {
  const { columns, setColumns, scheduled, setScheduled } = state;
  const [role, setRole] = useState("Senior Engineer");
  const [detail, setDetail] = useState<Candidate | null>(null);
  const [selectedStage, setSelectedStage] = useState("");
  function move(candidate: Candidate, stage: string) {
    setColumns((current) =>
      Object.fromEntries(
        stages.map((name) => [
          name,
          name === stage
            ? [...current[name].filter((item) => item.id !== candidate.id), candidate]
            : current[name].filter((item) => item.id !== candidate.id),
        ]),
      ),
    );
    setSelectedStage(stage);
  }
  return (
    <>
      <div className="ct-heading ct-hiring-heading">
        <h1>Hiring</h1>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger aria-label="Hiring role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              "Senior Engineer",
              "Product Manager",
              "Support Engineer",
              "Account Executive",
              "Product Designer",
            ].map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="ct-hiring-scroll">
        <Kanban
          value={columns}
          onValueChange={setColumns}
          getItemValue={(candidate) => candidate.id}
        >
          <KanbanBoard className="ct-hiring-board">
            {stages.map((stage, index) => (
              <KanbanColumn value={stage} key={stage} className="ct-hiring-column">
                <h2>
                  <i className={`ct-hiring-stage ct-stage-${index}`} />
                  {stage}
                  <small>{columns[stage].length}</small>
                </h2>
                <KanbanColumnContent value={stage}>
                  {columns[stage]
                    .filter((candidate) =>
                      `${candidate.name} ${candidate.city} ${role}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    )
                    .map((candidate) => (
                      <KanbanItem value={candidate.id} key={candidate.id}>
                        <KanbanItemHandle asChild>
                          <button
                            className="ct-candidate-card"
                            aria-label={`Open candidate ${candidate.name}`}
                            onClick={() => {
                              setDetail(candidate);
                              setSelectedStage(stage);
                            }}
                          >
                            <span className="ct-person">
                              <Avatar name={candidate.name} />
                              <span>
                                <strong>{candidate.name}</strong>
                                <small>{role}</small>
                              </span>
                            </span>
                            <span className="ct-candidate-meta">
                              <MapPin />
                              {candidate.city}
                              <span>{candidate.timezone}</span>
                            </span>
                            <span className="ct-candidate-meta">
                              <CalendarDays />
                              Applied {candidate.applied}
                            </span>
                            <span className="ct-candidate-meta">
                              <CircleDollarSign />
                              {candidate.salary}
                            </span>
                            <span className="ct-between ct-candidate-match">
                              <span>Match score</span>
                              <b>{candidate.match}%</b>
                            </span>
                            <Progress
                              aria-label={`${candidate.name} match score`}
                              value={candidate.match}
                              className={
                                candidate.match >= 80 ? "ct-match-blue" : "ct-match-purple"
                              }
                            />
                            <span className="ct-between ct-candidate-foot">
                              <Badge variant="outline">
                                <i className={`ct-hiring-stage ct-stage-${index}`} />
                                {scheduled.includes(candidate.id) || stage === "Interview"
                                  ? "Scheduled"
                                  : index > 2
                                    ? "Submitted"
                                    : "Not scheduled"}
                              </Badge>
                              <span className={candidate.stalled ? "ct-candidate-stalled" : ""}>
                                {candidate.stalled ? "Stalled " : ""}
                                {candidate.days}d{!candidate.stalled && " in stage"}
                              </span>
                            </span>
                          </button>
                        </KanbanItemHandle>
                      </KanbanItem>
                    ))}
                </KanbanColumnContent>
              </KanbanColumn>
            ))}
          </KanbanBoard>
        </Kanban>
      </div>
      <ReferenceSheet
        title={detail?.name || "Candidate"}
        description={role}
        width={480}
        open={!!detail}
        onClose={() => setDetail(null)}
      >
        {detail && (
          <div className="ct-form">
            <div className="ct-person">
              <Avatar name={detail.name} />
              <strong>{detail.name}</strong>
            </div>
            <p>
              {detail.city} · {detail.timezone}
            </p>
            <p>Applied {detail.applied}</p>
            <p>{detail.salary}</p>
            <label>
              Stage
              <Select value={selectedStage} onValueChange={(stage) => move(detail, stage)}>
                <SelectTrigger aria-label="Candidate stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem value={stage} key={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <Button
              onClick={() => {
                setScheduled((current) => [...new Set([...current, detail.id])]);
                setDetail(null);
              }}
            >
              Schedule interview
            </Button>
          </div>
        )}
      </ReferenceSheet>
    </>
  );
}
