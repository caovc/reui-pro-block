import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { Activity, Bell, Search } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { useGlobalTheme } from "@/components/site/global-theme-store";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { SignalAccounts, SignalSettings, SignalSignIn } from "./signal-accounts";
import { SignalChart } from "./signal-chart";
import {
  campaignStatus,
  featureSeries,
  initialFunnel,
  initialGoals,
  initialSignalEdges,
  initialTeam,
  memberSeries,
  metricSeries,
  retentionCohorts,
  retentionSeries,
  retentionWeeks,
  signalPages,
  sourceFixtures,
  validFunnel,
  type SignalPage,
} from "./signal-model";
import "./signal.css";

const SignalGoals = lazy(() => import("./signal-goals"));
const SignalRoadmap = lazy(() => import("./signal-roadmap"));

function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

function useSignalRoute() {
  // Theme customization can replace the preset in the URL without a hashchange.
  useGlobalTheme();
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "",
  );
  const [path, query] = hash.slice(1).split(/\?(.*)/s);
  const match = path.match(/^(\/(?:templates|template-preview)\/signal)(?:\/(.*))?$/);
  const leaf = match ? match[2] : path.slice(1);
  const page =
    leaf === "sign-in" ? leaf : (signalPages.find(([id]) => id === leaf)?.[0] ?? "overview");
  const href = (destination: SignalPage | "sign-in") => {
    const suffix = destination === "overview" ? "" : destination;
    const next = match ? [match[1], suffix].filter(Boolean).join("/") : `/${suffix}`;
    return `#${next}${query ? `?${query}` : ""}`;
  };
  return { page, href };
}

function SignalFunnels() {
  const [series, setSeries] = useState(initialFunnel);
  const [error, setError] = useState("");
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const values = series.map(({ name }) => Number(fields.get(name)));
    if (!validFunnel(values)) {
      setError("Each stage must have the same or fewer people than the previous stage.");
      return;
    }
    setError("");
    setSeries(series.map((stage, index) => ({ ...stage, value: values[index] })));
  }
  return (
    <>
      <SignalChart
        title="Onboarding conversion"
        id="signal-funnel"
        label="People"
        series={series}
        bars
      />
      <Frame>
        <FrameHeader>
          <FrameTitle>Edit cohort</FrameTitle>
        </FrameHeader>
        <FramePanel>
          <form onSubmit={apply} className="signal-field-grid">
            {series.map(({ name, value }) => (
              <label className="grid gap-2 text-sm" key={name}>
                {name}
                <Input name={name} defaultValue={value} required type="number" min={0} step={1} />
              </label>
            ))}
            <div className="col-span-full space-y-2">
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit">Apply cohort</Button>
            </div>
          </form>
        </FramePanel>
      </Frame>
    </>
  );
}

function SignalRetention() {
  const [weeks, setWeeks] = useState(8);
  const [cohorts, setCohorts] = useState(retentionCohorts);
  const [active, setActive] = useState(cohorts[2].name);
  const cohort = cohorts.find(({ name }) => name === active) ?? cohorts[2];
  const series = retentionSeries(cohort, weeks);
  function updateNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const note = String(fields.get("note") ?? "").trim();
    const start = Number(fields.get("participants"));
    if (!Number.isSafeInteger(start) || start < 1) return;
    setCohorts(cohorts.map((item) => (item === cohort ? { ...item, note, start } : item)));
  }
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Select value={active} onValueChange={setActive}>
          <SelectTrigger aria-label="Cohort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cohorts.map(({ name }) => (
              <SelectItem value={name} key={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(weeks)} onValueChange={(value) => setWeeks(Number(value))}>
          <SelectTrigger aria-label="Retention window">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {retentionWeeks.map((value) => (
              <SelectItem value={String(value)} key={value}>
                {value} weeks
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <SignalChart
        title={`${cohort.name} cohort`}
        id="signal-retention"
        label="Active members"
        series={series}
      />
      <Frame>
        <FrameHeader>
          <FrameTitle>Cohort notes</FrameTitle>
        </FrameHeader>
        <FramePanel>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cohort</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohorts.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.start}</TableCell>
                  <TableCell className="whitespace-normal">{item.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <form
            key={cohort.name}
            className="mt-4 flex flex-wrap items-end gap-3"
            onSubmit={updateNote}
          >
            <label className="grid gap-2 text-sm">
              Participants
              <Input
                name="participants"
                type="number"
                defaultValue={cohort.start}
                min={1}
                step={1}
                required
              />
            </label>
            <label className="grid min-w-44 flex-1 gap-2 text-sm">
              {cohort.name} notes
              <Input name="note" defaultValue={cohort.note} maxLength={180} />
            </label>
            <Button type="submit">Save cohort</Button>
          </form>
        </FramePanel>
      </Frame>
    </>
  );
}

function SignalMetrics() {
  const [metric, setMetric] = useState("workspaces");
  const workspaces = metric === "workspaces";
  return (
    <>
      <Select value={metric} onValueChange={setMetric}>
        <SelectTrigger aria-label="Metric" className="w-fit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="workspaces">Active workspaces</SelectItem>
          <SelectItem value="members">Active members</SelectItem>
        </SelectContent>
      </Select>
      <SignalChart
        id={`signal-metric-${metric}`}
        title={workspaces ? "Monthly active workspaces" : "Monthly active members"}
        label={workspaces ? "Workspaces" : "Members"}
        series={workspaces ? metricSeries : memberSeries}
      />
    </>
  );
}

function Campaigns({ sources }: { sources: typeof sourceFixtures }) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Campaign signals</FrameTitle>
      </FrameHeader>
      <FramePanel>
        <ul className="divide-y">
          {campaignStatus(sources).map((campaign) => (
            <li
              className="flex flex-wrap items-center justify-between gap-3 py-3"
              key={campaign.name}
            >
              <div>
                <p className="text-sm font-medium">{campaign.name}</p>
                <p className="text-xs text-muted-foreground">
                  {campaign.visits.toLocaleString("en-US")} visits
                </p>
              </div>
              <Badge variant={campaign.syncing ? "success-light" : "warning-light"}>
                {campaign.syncing ? "Syncing" : "Sync paused"}
              </Badge>
            </li>
          ))}
        </ul>
      </FramePanel>
    </Frame>
  );
}

export default function Signal() {
  const { page, href } = useSignalRoute();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchButton = useRef<HTMLButtonElement>(null);
  const searchReturn = useRef<HTMLElement | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sources, setSources] = useState(sourceFixtures);
  const [goals, setGoals] = useState(initialGoals);
  const [edges, setEdges] = useState(initialSignalEdges);
  const [team, setTeam] = useState(initialTeam);
  const paused = sources.filter(({ healthy }) => !healthy);
  const title = page === "sign-in" ? "Sign in" : signalPages.find(([id]) => page === id)?.[1];

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!searchReturn.current && document.activeElement instanceof HTMLElement) {
          searchReturn.current = document.activeElement;
        }
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  return (
    <div className="signal-workspace">
      <header className="signal-banner">
        <div className="flex items-center gap-3">
          <div className="signal-mark">
            <Activity size={22} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Product analytics</p>
            <p className="text-lg font-semibold">Signals workspace</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            ref={searchButton}
            variant="outline"
            size="sm"
            onClick={(event) => {
              searchReturn.current = event.currentTarget;
              setSearchOpen(true);
            }}
          >
            <Search /> Find page
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Notifications (${paused.length})`}
            aria-expanded={notificationsOpen}
            aria-controls="signal-notifications"
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <Bell />
          </Button>
        </div>
      </header>
      <div className="signal-layout">
        <nav aria-label="Analytics pages" className="signal-nav">
          {signalPages.map(([id, label]) => (
            <a href={href(id)} key={id} aria-current={page === id ? "page" : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <section className="signal-content" aria-labelledby="signal-heading">
          <h1 id="signal-heading">{title}</h1>
          <div hidden={!notificationsOpen} id="signal-notifications" aria-label="Notifications">
            <Frame>
              <FrameHeader>
                <FrameTitle>Notifications</FrameTitle>
              </FrameHeader>
              <FramePanel>
                {paused.length ? (
                  <ul className="space-y-2">
                    {paused.map(({ id, name }) => (
                      <li key={id}>{name} needs attention. Its campaigns are paused.</li>
                    ))}
                  </ul>
                ) : (
                  <p>All sources are syncing.</p>
                )}
              </FramePanel>
            </Frame>
          </div>
          {page === "overview" && (
            <div className="signal-overview">
              <SignalChart
                id="signal-overview"
                title="Monthly active workspaces"
                label="Workspaces"
                series={metricSeries}
              />
              <Campaigns sources={sources} />
            </div>
          )}
          {page === "funnels" && <SignalFunnels />}
          {page === "retention" && <SignalRetention />}
          {page === "metrics" && <SignalMetrics />}
          {page === "features" && (
            <SignalChart
              id="signal-features"
              title="Workspace adoption by feature"
              label="Workspaces"
              series={featureSeries}
              bars
            />
          )}
          {page === "accounts" && <SignalAccounts team={team} />}
          {page === "settings" && (
            <SignalSettings team={team} onTeamChange={setTeam} signInHref={href("sign-in")} />
          )}
          {page === "sign-in" && <SignalSignIn />}
          {page === "goals" && (
            <Suspense fallback={<p role="status">Loading goals…</p>}>
              <SignalGoals
                goals={goals}
                onGoalsChange={setGoals}
                edges={edges}
                onEdgesChange={setEdges}
              />
            </Suspense>
          )}
          {page === "roadmap" && (
            <Suspense fallback={<p role="status">Loading roadmap…</p>}>
              <SignalRoadmap />
            </Suspense>
          )}
          {page === "sources" && (
            <Frame>
              <FrameHeader>
                <FrameTitle>Connected sources</FrameTitle>
              </FrameHeader>
              <FramePanel>
                <ul className="divide-y">
                  {sources.map((source) => (
                    <li
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                      key={source.id}
                    >
                      <div>
                        <p className="font-medium">{source.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {source.scope} · {source.healthy ? "Healthy" : "Needs attention"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setSources((previous) =>
                            previous.map((item) =>
                              item.id === source.id ? { ...item, healthy: !item.healthy } : item,
                            ),
                          )
                        }
                      >
                        {source.healthy ? `Pause ${source.name}` : `Restore ${source.name}`}
                      </Button>
                    </li>
                  ))}
                </ul>
              </FramePanel>
            </Frame>
          )}
        </section>
      </div>
      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Find a page"
        description="Search analytics pages"
        onCloseAutoFocus={(event) => {
          const opener = searchReturn.current;
          const target =
            opener?.isConnected && opener !== document.body ? opener : searchButton.current;
          searchReturn.current = null;
          if (target) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <Command>
          <CommandInput aria-label="Search analytics pages" placeholder="Search analytics pages" />
          <CommandList>
            <CommandEmpty>No matching pages.</CommandEmpty>
            {signalPages.map(([id, label]) => (
              <CommandItem
                key={id}
                value={label}
                onSelect={() => {
                  window.location.hash = href(id);
                  setSearchOpen(false);
                }}
              >
                {label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
