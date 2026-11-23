import { useState, type Dispatch, type SetStateAction } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  applyEdgeChanges,
  type Connection,
  type Edge,
} from "@xyflow/react";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadFile } from "@/lib/download";
import { canLinkSignal, initialGoals, initialTeam, weightedProgress } from "./signal-model";
import "@xyflow/react/dist/style.css";

const nodes = [
  {
    id: "visits",
    type: "input",
    position: { x: 15, y: 20 },
    data: { label: "Qualified visits" },
    deletable: false,
  },
  {
    id: "setup",
    position: { x: 220, y: 20 },
    data: { label: "Workspace setup" },
    deletable: false,
  },
  {
    id: "team",
    position: { x: 220, y: 145 },
    data: { label: "Team invitations" },
    deletable: false,
  },
  {
    id: "adoption",
    type: "output",
    position: { x: 430, y: 80 },
    data: { label: "Weekly adoption" },
    deletable: false,
  },
];

export default function SignalGoals({
  goals,
  onGoalsChange,
  edges,
  onEdgesChange,
}: {
  goals: typeof initialGoals;
  onGoalsChange: (goals: typeof initialGoals) => void;
  edges: Edge[];
  onEdgesChange: Dispatch<SetStateAction<Edge[]>>;
}) {
  const [group, setGroup] = useState(0);
  const [linkError, setLinkError] = useState("");
  const [source, setSource] = useState(nodes[0].id);
  const [target, setTarget] = useState(nodes[1].id);
  const perspective = goals[group];
  const totals = weightedProgress(perspective.metrics);
  const objectives = perspective.objectives.map((name) => ({
    name,
    ...weightedProgress(perspective.metrics.filter((metric) => metric.objective === name)),
  }));
  function changeWeight(index: number, weight: number) {
    if (!Number.isInteger(weight) || weight < 0 || weight > 100) return;
    onGoalsChange(
      goals.map((item, position) =>
        position === group
          ? {
              ...item,
              metrics: item.metrics.map((metric, i) =>
                i === index ? { ...metric, weight } : metric,
              ),
            }
          : item,
      ),
    );
  }
  function connect(connection: Connection) {
    if (!canLinkSignal(edges, connection.source, connection.target)) {
      setLinkError("Choose a new link without a cycle.");
      return;
    }
    setLinkError("");
    onEdgesChange((current) =>
      canLinkSignal(current, connection.source, connection.target)
        ? addEdge(connection, current)
        : current,
    );
  }
  function exportGoals() {
    const rows = goals.flatMap(({ name, metrics }) =>
      metrics.map((metric) =>
        [
          name,
          metric.objective,
          metric.name,
          metric.actual,
          metric.target,
          metric.change,
          metric.owner,
          metric.weight,
        ].join(","),
      ),
    );
    downloadFile(
      "signal-goals.csv",
      ["Perspective,Objective,Metric,Actual,Target,Monthly change,Owner,Weight", ...rows].join(
        "\r\n",
      ),
      "text/csv",
    );
  }
  return (
    <>
      <Frame>
        <FrameHeader>
          <FrameTitle>Metric connections</FrameTitle>
        </FrameHeader>
        <FramePanel>
          <div className="signal-network">
            <ReactFlow
              defaultNodes={nodes}
              edges={edges}
              onConnect={connect}
              onEdgesChange={(changes) =>
                onEdgesChange((current) => applyEdgeChanges(changes, current))
              }
              fitView
              aria-label="North Star metric map"
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={20} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
          <form
            className="mt-4 flex flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              connect({ source, target, sourceHandle: null, targetHandle: null });
            }}
          >
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger aria-label="From metric">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {nodes
                  .filter((node) => node.type !== "output")
                  .map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.data.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger aria-label="To metric">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {nodes
                  .filter((node) => node.type !== "input")
                  .map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.data.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline">
              Connect metrics
            </Button>
          </form>
          {linkError && (
            <p role="status" className="mt-2 text-sm text-destructive">
              {linkError}
            </p>
          )}
        </FramePanel>
      </Frame>
      <Frame>
        <FrameHeader className="flex-wrap gap-3">
          <FrameTitle>KPI scorecard</FrameTitle>
          <Button variant="outline" size="sm" onClick={exportGoals}>
            Export scorecard CSV
          </Button>
        </FrameHeader>
        <FramePanel>
          <div className="mb-4 flex flex-wrap gap-2" aria-label="Scorecard perspectives">
            {goals.map((item, index) => {
              const score = weightedProgress(item.metrics);
              return (
                <Button
                  variant={index === group ? "default" : "outline"}
                  aria-pressed={index === group}
                  key={item.name}
                  onClick={() => setGroup(index)}
                >
                  {item.name} {score.progress}%
                </Button>
              );
            })}
          </div>
          <ul aria-label="Objective progress" className="mb-4 flex flex-wrap gap-3">
            {objectives.map((objective) => (
              <li key={objective.name} className="rounded-md border px-3 py-2 text-sm">
                {objective.name} <strong>{objective.progress}%</strong>
              </li>
            ))}
          </ul>
          {totals.weight !== 100 && (
            <Badge variant="warning-light" className="mb-4" role="status">
              Weights add up to {totals.weight}%.
            </Badge>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Monthly change</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Weight (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perspective.metrics.map((metric, index) => (
                <TableRow key={metric.name}>
                  <TableCell className="whitespace-normal">
                    {metric.name}
                    <span className="block text-xs text-muted-foreground">{metric.objective}</span>
                  </TableCell>
                  <TableCell>
                    {metric.actual}
                    {metric.actual < metric.target * 0.9 && (
                      <Badge variant="warning-light" className="ml-2">
                        Below target
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{metric.target}</TableCell>
                  <TableCell>
                    {metric.change > 0 ? "+" : ""}
                    {metric.change}
                  </TableCell>
                  <TableCell>
                    {initialTeam.find((member) => member.id === metric.owner)?.name}
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-18"
                      type="number"
                      min="0"
                      max="100"
                      value={metric.weight}
                      aria-label={`${metric.name} weight`}
                      onChange={(event) => changeWeight(index, Number(event.currentTarget.value))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </FramePanel>
      </Frame>
    </>
  );
}
