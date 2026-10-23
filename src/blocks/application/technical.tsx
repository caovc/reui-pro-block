import { useState } from "react";
import { Check, Database, Play, Plus, RefreshCw, Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Person, SmallTabs, toast } from "./shared";
import type { BlockMeta } from "@/data/types";
export default function TechnicalPanel({ block }: { block: BlockMeta }) {
  const n = block.name;
  const [preset, setPreset] = useState("Every hour");
  const [cron, setCron] = useState("0 * * * *");
  const [retry, setRetry] = useState(false);
  const [tab, setTab] = useState("Overview");
  const [operator, setOperator] = useState("equals");
  const [threshold, setThreshold] = useState("99.9");
  const [conditions, setConditions] = useState(["country"]);
  const valid = /^(\S+\s+){4}\S+$/.test(cron);
  const newItem = /New/.test(n);
  const [tested, setTested] = useState(false);
  if (/Cron/.test(n))
    return (
      <div className="flex flex-col gap-5">
        {newItem ? (
          <FieldGroup>
            <Field>
              <FieldLabel>Job name</FieldLabel>
              <Input placeholder="Nightly database backup" />
            </Field>
            <Field>
              <FieldLabel>Schedule preset</FieldLabel>
              <SmallTabs
                items={["Every hour", "Every day", "Every week"]}
                value={preset}
                onChange={(v) => {
                  setPreset(v);
                  setCron(
                    v === "Every hour"
                      ? "0 * * * *"
                      : v === "Every day"
                        ? "0 0 * * *"
                        : "0 0 * * 1",
                  );
                }}
              />
            </Field>
            <Field data-invalid={!valid}>
              <FieldLabel>Cron expression</FieldLabel>
              <Input
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                aria-invalid={!valid}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {valid
                  ? "Valid expression — UTC timezone"
                  : "Enter five fields: minute hour day month weekday"}
              </p>
            </Field>
            <Field>
              <FieldLabel>Command</FieldLabel>
              <Input placeholder="npm run backup" className="font-mono" />
            </Field>
          </FieldGroup>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Badge variant="outline">Active</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("Job triggered manually")}
              >
                <Play />
                Run now
              </Button>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Schedule</p>
              <p className="mt-2 font-mono text-sm">0 * * * *</p>
              <p className="mt-2 text-xs">Every hour · UTC</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["99.8%", "Success rate"],
                ["1.4s", "Avg duration"],
                ["721", "Total runs"],
              ].map(([v, l]) => (
                <div key={l}>
                  <p className="text-lg font-semibold">{v}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="rounded-lg border">
          <h4 className="border-b px-4 py-3 text-xs font-medium">
            {newItem ? "Next scheduled runs" : "Recent executions"}
          </h4>
          {[1, 2, 3, 4].map((v) => (
            <div
              key={v}
              className="flex items-center justify-between gap-2 border-b p-3 text-xs last:border-b-0"
            >
              <span className="font-mono">Oct 22, {12 + v}:00 UTC</span>
              <Badge variant="secondary">{newItem ? "Scheduled" : "Succeeded"}</Badge>
              {!newItem && <span className="text-muted-foreground">1.{v}s</span>}
            </div>
          ))}
        </div>
      </div>
    );
  if (/Deploy|Rollout/.test(n))
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">web-app-production</p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              main · a8f2c91 · 3 minutes ago
            </p>
          </div>
          <Badge variant="outline">
            {retry ? "Healthy" : /Failed/.test(n) ? "Failed" : "Rolling out"}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-2">
          {["Build", "Test", "Deploy", "Verify"].map((t, i) => (
            <div className="flex-1 rounded-lg border p-2 text-center" key={t}>
              {i === 2 && /Failed/.test(n) && !retry ? (
                <X className="mx-auto size-4" />
              ) : (
                <Check className="mx-auto size-4" />
              )}
              <p className="mt-2 text-[10px]">{t}</p>
            </div>
          ))}
        </div>
        {!/Failed/.test(n) && (
          <>
            <div className="flex items-center justify-between text-xs">
              <span>Canary traffic</span>
              <span>{retry ? "100" : "25"}%</span>
            </div>
            <Progress value={retry ? 100 : 25} />
          </>
        )}
        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2 text-xs">
            <Terminal className="size-3" />
            Deployment logs
          </div>
          <pre className="overflow-x-auto bg-muted/20 p-4 text-[10px] leading-6">{`12:04:12  Installing dependencies…\n12:04:18  Dependencies installed successfully\n12:04:19  Running build command\n12:04:28  Build completed (9.2s)\n12:04:29  Uploading deployment artifacts\n12:04:31  ${/Failed/.test(n) && !retry ? "Error: health check timed out" : "Deployment ready"}\n12:04:32  ${retry ? "All health checks passed" : /Failed/.test(n) ? "Process exited with code 1" : "Monitoring canary metrics…"}`}</pre>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setRetry(true);
            toast.success(
              /Failed/.test(n) ? "Deployment retried successfully" : "Rollout promoted to 100%",
            );
          }}
        >
          <RefreshCw />
          {/Failed/.test(n) ? "Retry deployment" : "Promote rollout"}
        </Button>
      </div>
    );
  if (/Firewall/.test(n))
    return (
      <div className="flex flex-col gap-5">
        {/Request/.test(n) ? (
          <>
            <Badge variant="outline">Request blocked</Badge>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {[
                ["IP address", "203.0.113.42"],
                ["Country", "United States"],
                ["Path", "/api/v1/auth"],
                ["Matched rule", "Rate limit protection"],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-muted-foreground">{l}</p>
                  <p className="mt-1 font-mono">{v}</p>
                </div>
              ))}
            </div>
            <Separator />
            <h4 className="text-xs font-medium">Decision trace</h4>
            {[
              "Request received at edge",
              "Bot score evaluated: 12 / 100",
              "Rate limit exceeded",
              "Action applied: Block",
            ].map((t, i) => (
              <div key={t} className="flex items-center gap-3 text-xs">
                <span className="flex size-5 items-center justify-center rounded-full border text-[10px]">
                  {i + 1}
                </span>
                {t}
              </div>
            ))}
          </>
        ) : (
          <>
            <Field>
              <FieldLabel>Rule name</FieldLabel>
              <Input
                defaultValue={newItem ? "" : "Block suspicious traffic"}
                placeholder="Give your rule a name"
              />
            </Field>
            <p className="text-xs font-medium">When incoming requests match…</p>
            {conditions.map((c, i) => (
              <div key={i} className="flex gap-2 rounded-lg border p-3">
                <Input aria-label="Condition field" defaultValue={c} className="w-28 text-xs" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOperator(operator === "equals" ? "contains" : "equals")}
                >
                  {operator}
                </Button>
                <Input aria-label="Condition value" placeholder="US" className="text-xs" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove condition"
                  onClick={() => setConditions(conditions.filter((_, j) => i !== j))}
                >
                  <X />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setConditions([...conditions, "path"])}
            >
              <Plus />
              Add condition
            </Button>
            <Field>
              <FieldLabel>Then take action</FieldLabel>
              <SmallTabs
                items={["Block", "Challenge", "Allow", "Log"]}
                value={tab === "Overview" ? "Block" : tab}
                onChange={setTab}
              />
            </Field>
          </>
        )}
        <div className="rounded-lg border bg-muted/20 p-4">
          <h4 className="text-xs font-medium">Recent traffic preview</h4>
          <p className="mt-2 text-2xl font-semibold">
            1,284{" "}
            <span className="text-xs font-normal text-muted-foreground">matching requests</span>
          </p>
          <div className="mt-3 flex h-12 items-end gap-1">
            {Array.from({ length: 24 }, (_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-primary/70"
                style={{ height: `${20 + ((i * 37) % 80)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  if (/SLO|Error Budget/.test(n))
    return (
      <div className="flex flex-col gap-5">
        {newItem ? (
          <FieldGroup>
            <Field>
              <FieldLabel>SLO name</FieldLabel>
              <Input placeholder="API availability" />
            </Field>
            <Field>
              <FieldLabel>Service level objective</FieldLabel>
              <SmallTabs
                items={["99", "99.9", "99.95", "99.99"]}
                value={threshold}
                onChange={setThreshold}
              />
            </Field>
            <Field>
              <FieldLabel>Evaluation window</FieldLabel>
              <Input defaultValue="Rolling 30 days" />
            </Field>
          </FieldGroup>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current availability</p>
                <p className="mt-2 text-3xl font-semibold">
                  99.97<span className="text-lg">%</span>
                </p>
              </div>
              <Badge variant="outline">Meeting objective</Badge>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex justify-between text-xs">
                <span>Error budget remaining</span>
                <span>72.4%</span>
              </div>
              <Progress value={72.4} />
              <p className="mt-3 text-[10px] text-muted-foreground">31m 16s remaining of 43m 12s</p>
            </div>
          </>
        )}
        <Card className="gap-4 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">Error budget preview</CardTitle>
            <CardDescription>Based on a {threshold}% objective</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-20 items-end gap-1.5">
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-primary/60"
                  style={{ height: `${95 - i * 3}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">Fast burn alert</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Notify when budget burns at 14.4× rate
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">Slow burn alert</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Notify when budget burns at 6× rate
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <Separator />
        <Person name="Olivia Rhye" sub="SLO owner · Platform engineering" />
      </div>
    );
  if (/Data|Connection/.test(n))
    return (
      <div className="flex flex-col gap-5">
        {/New Connection/.test(n) ? (
          <>
            <Field>
              <FieldLabel>Connection name</FieldLabel>
              <Input placeholder="Production analytics" />
            </Field>
            <Field>
              <FieldLabel>Database URL</FieldLabel>
              <Input type="password" placeholder="postgresql://user:password@host:5432/db" />
            </Field>
            <Button
              variant="outline"
              onClick={() => {
                setTested(true);
                toast.success("Demo connection test passed");
              }}
            >
              <Database />
              {tested ? "Connection verified" : "Test connection"}
            </Button>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Production analytics</p>
              <p className="mt-1 text-xs text-muted-foreground">
                PostgreSQL · Last synced 2 minutes ago
              </p>
            </div>
            <Badge variant="outline">Healthy</Badge>
          </div>
        )}
        <Tabs defaultValue="data">
          <TabsList className="w-full">
            <TabsTrigger value="data" className="flex-1">
              Sample data
            </TabsTrigger>
            <TabsTrigger value="schema" className="flex-1">
              Schema
            </TabsTrigger>
          </TabsList>
          <TabsContent value="data">
            <div className="overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>id</TableHead>
                    <TableHead>email</TableHead>
                    <TableHead>status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">usr_00{i}</TableCell>
                      <TableCell className="font-mono text-xs">u•••{i}@•••.com</TableCell>
                      <TableCell>
                        <Badge variant="outline">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">
              Sensitive values are masked in this preview.
            </p>
          </TabsContent>
          <TabsContent value="schema">
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              {[
                ["id", "uuid", "Primary key"],
                ["email", "varchar(255)", "Masked"],
                ["status", "enum", "Required"],
                ["created_at", "timestamp", "Default: now()"],
              ].map(([f, t, d]) => (
                <div key={f} className="flex items-center justify-between gap-3 text-xs">
                  <code>{f}</code>
                  <span className="text-muted-foreground">{t}</span>
                  <Badge variant="secondary">{d}</Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex items-center justify-between text-xs">
          <span>Automatic sync</span>
          <Switch defaultChecked />
        </div>
      </div>
    );
  return (
    <div className="flex flex-col gap-5">
      <Badge variant="outline">Audit event</Badge>
      <div className="rounded-lg border p-4">
        <p className="text-xs text-muted-foreground">Event type</p>
        <p className="mt-2 font-mono text-sm">workspace.settings.updated</p>
        <p className="mt-2 text-xs text-muted-foreground">Oct 22, 2026 · 12:04:32 UTC</p>
      </div>
      <Person name="Alex Morgan" sub="alex@acme.com · 203.0.113.10" />
      <Tabs defaultValue="diff">
        <TabsList>
          <TabsTrigger value="diff">Changes</TabsTrigger>
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          <TabsTrigger value="trace">Trace</TabsTrigger>
        </TabsList>
        <TabsContent value="diff">
          <pre className="overflow-auto rounded-lg border bg-muted/20 p-4 font-mono text-[11px] leading-7">
            {
              '  workspace.name: "Acme"\n− public_access: true\n+ public_access: false\n  updated_by: "usr_001"'
            }
          </pre>
        </TabsContent>
        <TabsContent value="raw">
          <pre className="overflow-auto rounded-lg border bg-muted/20 p-4 text-[11px] leading-6">
            {JSON.stringify(
              {
                id: "evt_9c82a",
                action: "workspace.settings.updated",
                actor: "usr_001",
                status: "success",
                timestamp: "2026-10-22T12:04:32Z",
              },
              null,
              2,
            )}
          </pre>
        </TabsContent>
        <TabsContent value="trace">
          <div className="rounded-lg border p-4 text-xs leading-7">
            Request received → Authorized → Validated → Settings updated → Audit recorded
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
