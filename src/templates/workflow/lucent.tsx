import "./lucent-layout.css";
import { LucentAccountPage } from "./lucent-account";
import { useLucentAccountModel } from "./lucent-account-model";
import { LucentAccountMenu } from "./lucent-account-menu";
import { useLucentAccountRoute, type LucentDestination } from "./lucent-account-routes";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLucentSecurityModel, useLucentIntegrationsModel } from "./workflow-models";
import { LucentSecurity, LucentIntegrations } from "./lucent-settings";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  Activity,
  ClipboardCheck,
  ChartPie,
  Radio,
  ChevronRight,
  Home,
  Layers,
  Ellipsis,
  Plug,
  Plus,
  Rocket,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { SidebarCollection, SidebarNavigation } from "@/components/reui/sidebar";
import { SidebarMenuAction, useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Shell,
  Logo,
  Panel,
  Button,
  Input,
  Status,
  Chart,
  Segments,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  CreateDialog,
  Detail,
  ExportButton,
  EmptyResults,
} from "./shared";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Deployments } from "./deployments";
import { Person } from "./controls";
import { serviceLogos } from "./service-logos";
import { useLucentInfrastructureModel } from "./lucent-infrastructure-model";
import { LucentClusters } from "./lucent-clusters";
import { LucentHosts } from "./lucent-hosts";
import { LucentRegistry } from "./lucent-registry";
import { LucentGeneralSettings } from "./lucent-general-settings";
import { LucentNotificationRules } from "./lucent-notification-rules";
import "@/blocks/reference.css";
import "./lucent-preferences.css";
// These are the existing local deployment fixtures, shared with service details.
const serviceCatalog = [
  {
    name: "api-gateway",
    version: "v3.14.0",
    environment: "Production",
    status: "Degraded",
    owner: "Marcus Webb",
    team: "Edge & routing",
  },
  {
    name: "orders-db",
    version: "v2.13.0",
    environment: "Production",
    status: "Down",
    owner: "Rafael Duarte",
    team: "Data platform",
  },
  {
    name: "edge-cache",
    version: "v1.12.0",
    environment: "Production",
    status: "Healthy",
    owner: "Amelia Hart",
    team: "Edge & routing",
  },
  {
    name: "recommender",
    version: "v3.11.0",
    environment: "Canary",
    status: "Healthy",
    owner: "Adam Reyes",
    team: "Model serving",
  },
];
const services = serviceCatalog.map((service) => service.name);
const initialPinnedServices = ["api-gateway", "recommender", "orders-db", "edge-cache"];
const settingsNavigation = [
  { label: "Integrations", icon: <Plug /> },
  { label: "Security", icon: <Shield /> },
  { label: "Settings", icon: <Settings /> },
];
const initialFlags = [
  "Checkout canary routing",
  "Edge failover router",
  "Payment write guardrail",
  "Cold storage read path",
  "Async migration runner",
];

function LucentServicesNavigation({
  onOpen,
  pinned,
  setPinned,
}: {
  onOpen: (name: string, returnFocus?: HTMLElement) => void;
  pinned: string[];
  setPinned: Dispatch<SetStateAction<string[]>>;
}) {
  const { state, isMobile } = useSidebar();
  const navigation = useRef<HTMLDivElement>(null);
  const actionTriggers = useRef(new Map<string, HTMLButtonElement>());
  const detailsRequested = useRef(false);
  const rows = pinned.flatMap((name) => {
    const service = serviceCatalog.find((item) => item.name === name);
    return service ? [service] : [];
  });
  const icon = (status: string) => (
    <span className="wf-service-dot" data-health={status} aria-hidden="true" />
  );
  return (
    <div className="lucent-services-navigation" ref={navigation}>
      {!isMobile && state === "collapsed" ? (
        <SidebarNavigation
          className="wf-native-navigation"
          items={rows.map((service) => ({
            label: `${service.name}, ${service.status}. Open service details`,
            icon: icon(service.status),
          }))}
          active=""
          onSelect={(label) => {
            const service = rows.find((item) => label.startsWith(`${item.name},`));
            if (service) onOpen(service.name);
          }}
        />
      ) : (
        <SidebarCollection
          label="Services"
          onSelect={onOpen}
          rows={rows.map((service) => ({
            label: service.name,
            icon: icon(service.status),
            badge: <span className="sr-only">{service.status}. Open service details</span>,
            actions: (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction
                    showOnHover
                    aria-label={`Actions for ${service.name}`}
                    ref={(element) => {
                      if (element) actionTriggers.current.set(service.name, element);
                      else actionTriggers.current.delete(service.name);
                    }}
                  >
                    <Ellipsis />
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="reui-reference min-w-44"
                  side="right"
                  align="start"
                  onCloseAutoFocus={(event) => {
                    if (detailsRequested.current) {
                      event.preventDefault();
                      detailsRequested.current = false;
                    } else if (!actionTriggers.current.get(service.name)?.isConnected) {
                      event.preventDefault();
                      navigation.current
                        ?.querySelector<HTMLButtonElement>("button[aria-expanded]")
                        ?.focus();
                    }
                  }}
                >
                  <DropdownMenuLabel>Local pinned services</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onSelect={() => {
                        detailsRequested.current = true;
                        onOpen(service.name, actionTriggers.current.get(service.name));
                      }}
                    >
                      Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={async () => {
                        try {
                          await navigator.clipboard.writeText(service.name);
                          toast.success("Service name copied");
                        } catch {
                          toast.error("Could not copy the service name");
                        }
                      }}
                    >
                      Copy name
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        setPinned((current) => [
                          service.name,
                          ...current.filter((name) => name !== service.name),
                        ]);
                        toast.success(`${service.name} moved to the top of the local pinned list`);
                      }}
                    >
                      Pin to top
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => {
                      setPinned((current) => current.filter((name) => name !== service.name));
                      toast.success(`${service.name} removed from the local pinned list`, {
                        action: {
                          label: "Undo",
                          onClick: () =>
                            setPinned((current) =>
                              current.includes(service.name) ? current : [...current, service.name],
                            ),
                        },
                      });
                    }}
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          }))}
        />
      )}
    </div>
  );
}

export default function Lucent() {
  const securityModel = useLucentSecurityModel();
  const integrationModel = useLucentIntegrationsModel();
  const infrastructureModel = useLucentInfrastructureModel();
  const [workspaceView, setWorkspaceView] = useState("Overview");
  const accountModel = useLucentAccountModel();
  const accountRoute = useLucentAccountRoute();
  const view = accountRoute.settings ? "Settings" : workspaceView;
  const setView = (next: string) => {
    if (next !== "Settings") setWorkspaceView(next);
    accountRoute.navigate(next === "Settings" ? "settings" : "root");
  };
  const navigateAccount = (destination: LucentDestination) => {
    if (destination === "root") setWorkspaceView("Overview");
    accountRoute.navigate(destination);
  };
  const [period, setPeriod] = useState("30 days");
  const [query, setQuery] = useState("");
  const [flags, setFlags] = useState(initialFlags);
  const [enabled, setEnabled] = useState(["Edge failover router"]);
  const [filter, setFilter] = useState("All");
  const [create, setCreate] = useState(false);
  const [selected, setSelected] = useState("");
  const [approved, setApproved] = useState<string[]>([]);
  const [renewed, setRenewed] = useState<string[]>([]);
  const [invite, setInvite] = useState(false);
  const [serviceDetails, setServiceDetails] = useState("");
  const [pinnedServices, setPinnedServices] = useState(initialPinnedServices);
  const serviceReturnFocus = useRef<HTMLElement | null>(null);
  const activeService = serviceCatalog.find((service) => service.name === serviceDetails);
  const openService = (name: string, returnFocus?: HTMLElement) => {
    serviceReturnFocus.current = returnFocus ?? (document.activeElement as HTMLElement | null);
    setServiceDetails(name);
  };
  const activeNavigation = accountRoute.account ? "" : view;
  const deploymentList = (
    <Panel
      title={view === "Infrastructure" ? "Services" : "Deployment ledger"}
      description="Production delivery across all services"
      action={<ExportButton name="deployments" rows={services} />}
    >
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search deployments"
        placeholder="Search services…"
      />
      <Table>
        <TableHeader>
          <TableRow>
            {["Service", "Version", "Environment", "Status", "Owner", ""].map((x) => (
              <TableHead key={x}>{x}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {serviceCatalog
            .filter((service) => service.name.includes(query.toLowerCase()))
            .map((service) => (
              <TableRow key={service.name}>
                <TableCell>{service.name}</TableCell>
                <TableCell>{service.version}</TableCell>
                <TableCell>{service.environment}</TableCell>
                <TableCell>
                  <Status>{service.status}</Status>
                </TableCell>
                <TableCell>{service.owner}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => openService(service.name)}>
                    Inspect
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {!services.some((x) => x.includes(query.toLowerCase())) && (
        <EmptyResults reset={() => setQuery("")} />
      )}
    </Panel>
  );
  return (
    <Shell
      brand="DevOps"
      view={accountRoute.account ? "Account" : view}
      setView={setView}
      accountMenu={
        <LucentAccountMenu
          name={String(accountModel.profileSaved.fullName)}
          email={String(accountModel.profileSaved.email)}
          avatar={accountModel.savedAvatar}
          href={accountRoute.href}
          onNavigate={navigateAccount}
        />
      }
      headerTitle={
        accountRoute.account ? (
          <Breadcrumb className="lucent-account-breadcrumb">
            <span className="lucent-account-mobile-brand">
              <Logo />
            </span>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={accountRoute.href("root") ?? undefined}
                  onClick={(event) => {
                    if (
                      event.button === 0 &&
                      !event.metaKey &&
                      !event.ctrlKey &&
                      !event.shiftKey &&
                      !event.altKey
                    ) {
                      event.preventDefault();
                      navigateAccount("root");
                    }
                  }}
                >
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Account</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {accountRoute.account[0].toUpperCase() + accountRoute.account.slice(1)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ) : undefined
      }
      nav={[
        { label: "Overview", icon: Home },
        { label: "Delivery", icon: Rocket },
        { label: "Infrastructure", icon: Layers, children: ["Clusters", "Hosts", "Registry"] },
        { label: "Observability", icon: Activity },
        { label: "Reliability", icon: Shield },
      ]}
      retainExtraWhenCollapsed
      extra={
        <div className="wf-nav-group lucent-navigation">
          <LucentServicesNavigation
            onOpen={openService}
            pinned={pinnedServices}
            setPinned={setPinnedServices}
          />
          <div className="wf-nav-spacer" />
          <SidebarNavigation
            className="wf-native-navigation lucent-settings-navigation"
            items={settingsNavigation}
            active={activeNavigation}
            onSelect={setView}
          />
        </div>
      }
      actions={
        <Button variant="outline" size="sm" onClick={() => setInvite(true)}>
          <Users />
          <span>Invite</span>
        </Button>
      }
    >
      {accountRoute.account ? (
        <LucentAccountPage
          page={accountRoute.account}
          onPageChange={navigateAccount}
          model={accountModel}
        />
      ) : view === "Overview" ? (
        <>
          <div className="wf-grid wf-three">
            <Panel icon={ClipboardCheck} title="Runbook Coverage" description="Verified services">
              <strong className="wf-stat-value">70%</strong>
              <span className="wf-muted">　+4.8%　 services with a verified runbook</span>
              <div className="wf-tick-meter">
                {Array.from({ length: 56 }, (_, i) => (
                  <i className={i < 39 ? "filled" : ""} key={i} />
                ))}
              </div>
              <p className="wf-muted">Services in scope: 10</p>
              <div className="wf-inline wf-owner-row">
                {[
                  "Marcus Webb",
                  "Klara Nowak",
                  "Rafael Duarte",
                  "Amelia Hart",
                  "Adam Reyes",
                  "Tomas Okonkwo",
                ].map((x) => (
                  <span className="wf-owner-avatar" key={x}>
                    <Person name={x} />
                  </span>
                ))}
                <span className="wf-muted">6 Owners</span>
              </div>
            </Panel>
            <Panel icon={ChartPie} title="Traffic Mix" description="Week">
              <div className="wf-traffic">
                <div className="wf-donut">
                  <span>
                    Requests<strong>185M</strong>
                  </span>
                </div>
                <div>
                  {["api-gateway", "edge-cache", "identity"].map((x, i) => (
                    <div className="wf-traffic-row" key={x}>
                      <i style={{ background: `var(--chart-${i + 1})` }} />
                      {x}
                      <span>{["92.5M", "50M", "42.5M"][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
            <Panel icon={Radio} title="Queue wait" description="42 queued">
              <div className="wf-queue-zone">
                <strong>Queue Lag Zone</strong>
                <div>
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <p>
                  <span>0m</span>
                  <span>15m</span>
                  <span>30m</span>
                  <span>60m</span>
                </p>
              </div>
            </Panel>
          </div>
          <div className="wf-grid wf-wide">
            <Panel
              title="Deploy Frequency"
              action={
                <Segments
                  items={["12 months", "6 months"]}
                  value={period === "6 months" ? "6 months" : "12 months"}
                  onChange={setPeriod}
                />
              }
            >
              <strong className="wf-stat-value">{period === "6 months" ? "412" : "796"}</strong>
              <span className="wf-muted">　↗ 13.4%</span>
              <Chart height={290} />
            </Panel>
            <Panel
              title="Deploys by Service"
              action={
                <Segments items={["30 days", "90 days"]} value={period} onChange={setPeriod} />
              }
            >
              {services.map((x, i) => (
                <div className="wf-list-row wf-service-row" key={x}>
                  <img
                    className="wf-service-logo"
                    src={`data:image/svg+xml,${encodeURIComponent(serviceLogos[i])}`}
                    alt=""
                  />
                  <div>
                    <strong>{x}</strong>
                    <small className="wf-sub">
                      {["Edge & routing", "Data platform", "Edge & routing", "Model serving"][i]}{" "}
                      <Status>{["↗ 8.6%", "↗ 0.5%", "↗ 10.0%", "↘ 2.3%"][i]}</Status>
                    </small>
                  </div>
                  <div className="wf-number">
                    <strong>{[279, 197, 96, 56][i] * (period === "90 days" ? 3 : 1)}</strong>
                    <small className="wf-sub">{[9, 7, 3, 2][i]}/day</small>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => setView("Delivery")}>
                View all deployments
                <ChevronRight />
              </Button>
            </Panel>
          </div>
          <div className="wf-grid wf-three">
            <Panel title="Deployments Awaiting Approval">
              {["Marcus Webb", "Klara Nowak", "Rafael Duarte", "Amelia Hart", "Adam Reyes"].map(
                (name, i) => (
                  <div className="wf-list-row" key={name}>
                    <span className="wf-avatar">
                      {name
                        .split(" ")
                        .map((x) => x[0])
                        .join("")}
                    </span>
                    <div>
                      <strong>{name}</strong>
                      <small className="wf-sub">{services[i % 4]} v2.14.0 → prod</small>
                    </div>
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={approved.includes(name)}
                      onClick={() => setSelected(name)}
                    >
                      {approved.includes(name) ? "Approved" : "Review"}
                    </Button>
                  </div>
                ),
              )}
            </Panel>
            <Panel
              title="Pipeline Runs"
              action={<ExportButton name="pipeline-runs" rows={{ total: 925 }} />}
            >
              <div className="wf-pipeline-donut">
                <div>
                  <span>Total Runs</span>
                  <strong>925</strong>
                </div>
              </div>
              <div className="wf-chart-legend">
                <span>
                  <i />
                  Passed 87%
                </span>
                <span>
                  <i />
                  Running 8%
                </span>
                <span>
                  <i />
                  Failed 5%
                </span>
              </div>
            </Panel>
            <Panel title="Certificate Alerts" description="Next 30 days">
              <div className="wf-inline wf-between">
                <div>
                  <small className="wf-sub">MANAGED CERTS</small>
                  <strong className="wf-stat-value">312</strong>
                </div>
                <div>
                  <small className="wf-sub">EXPIRING</small>
                  <strong className="wf-stat-value">{4 - renewed.length}</strong>
                </div>
              </div>
              {["api-gateway", "payments-api", "edge-cache", "identity"].map((x, i) => (
                <div className="wf-list-row" key={x}>
                  <div>
                    <strong>{x}</strong>
                    <small className="wf-sub">
                      {renewed.includes(x)
                        ? "Valid for 90 days"
                        : `Expires in ${[3, 5, 7, 21][i]}d`}
                    </small>
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={renewed.includes(x)}
                    onClick={() => {
                      setRenewed([...renewed, x]);
                      toast.success(`${x} certificate renewed in demo`);
                    }}
                  >
                    Renew
                  </Button>
                </div>
              ))}
            </Panel>
          </div>
          <Panel
            title="Delivery feature flags"
            description={`${flags.length} flags`}
            action={
              <Button size="sm" onClick={() => setCreate(true)}>
                <Plus />
                New flag
              </Button>
            }
          >
            <Segments
              items={["All", "Live", "Staged", "Review", "Paused"]}
              value={filter}
              onChange={setFilter}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  {["Flag", "Owner", "Readiness", "Stage", "Enabled"].map((x) => (
                    <TableHead key={x}>{x}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags
                  .filter(
                    (_, i) =>
                      filter === "All" ||
                      ["Staged", "Live", "Review", "Paused", "Staged"][i % 5] === filter,
                  )
                  .map((x) => {
                    const i = flags.indexOf(x);
                    return (
                      <TableRow key={x}>
                        <TableCell>
                          {x}
                          <small className="wf-sub">{services[i % 4]}</small>
                        </TableCell>
                        <TableCell>
                          {
                            [
                              "Marcus Webb",
                              "Amelia Hart",
                              "Klara Nowak",
                              "Rafael Duarte",
                              "Adam Reyes",
                            ][i % 5]
                          }
                        </TableCell>
                        <TableCell>{[4.8, 4.7, 4.3, 3.9, 4.5][i % 5]}</TableCell>
                        <TableCell>
                          <Status>{["Staged", "Live", "Review", "Paused", "Staged"][i % 5]}</Status>
                        </TableCell>
                        <TableCell>
                          <Switch
                            aria-label={`Enable ${x}`}
                            checked={enabled.includes(x)}
                            onCheckedChange={(v) =>
                              setEnabled(v ? [...enabled, x] : enabled.filter((y) => y !== x))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </Panel>
        </>
      ) : view === "Delivery" ? (
        <Deployments />
      ) : view === "Clusters" || view === "Infrastructure" ? (
        <LucentClusters model={infrastructureModel} />
      ) : view === "Hosts" ? (
        <LucentHosts model={infrastructureModel} />
      ) : view === "Registry" ? (
        <LucentRegistry model={infrastructureModel} />
      ) : view === "Security" ? (
        <LucentSecurity model={securityModel} />
      ) : view === "Settings" ? (
        <div className="wf-lucent-preferences">
          <h1 className="sr-only">Settings</h1>
          <LucentGeneralSettings />
          <LucentNotificationRules />
        </div>
      ) : view === "Integrations" ? (
        <LucentIntegrations model={integrationModel} />
      ) : (
        <>
          {deploymentList}
          {view === "Observability" && (
            <Panel title="Request latency" description="p95 across production services">
              <Chart mode="layers" />
            </Panel>
          )}
        </>
      )}
      <CreateDialog
        title="New feature flag"
        open={create}
        onClose={() => setCreate(false)}
        onCreate={(name) => setFlags([...flags, name])}
      />
      <CreateDialog
        title="Invite teammate"
        label="Email"
        open={invite}
        onClose={() => setInvite(false)}
        onCreate={() => toast.success("Local invite created")}
      />
      <Detail title={selected} open={!!selected} onClose={() => setSelected("")}>
        <div className="flex flex-col gap-4 p-4">
          <Status>Production</Status>
          <p>
            Change reviewed against the current delivery policy. Checks passed: build, integration
            suite, and rollback readiness.
          </p>
          <Panel title="Release details">
            <p>Version 2.14.0</p>
            <p>Region eu-west-1</p>
            <p>Last deployment Oct 22, 2026</p>
          </Panel>
          <Button
            onClick={() => {
              setApproved([...approved, selected]);
              setSelected("");
              toast.success("Change approved in local workspace");
            }}
          >
            Approve change
          </Button>
        </div>
      </Detail>
      <Sheet open={!!activeService} onOpenChange={(open) => !open && setServiceDetails("")}>
        <SheetContent
          className="lucent-service-sheet"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = [
              serviceReturnFocus.current,
              ...document.querySelectorAll<HTMLElement>(
                '.wf-devops [data-slot="sidebar"] [aria-current="page"], .wf-devops button[aria-label="Open navigation"]',
              ),
            ].find(
              (element) =>
                element?.isConnected &&
                element.getClientRects().length &&
                getComputedStyle(element).visibility !== "hidden",
            );
            target?.focus({ preventScroll: true });
          }}
        >
          <SheetHeader>
            <SheetTitle>{activeService?.name}</SheetTitle>
            <SheetDescription>{activeService?.team} · Local demo service</SheetDescription>
          </SheetHeader>
          {activeService && (
            <Panel title="Service details" className="lucent-service-overview">
              <dl className="lucent-service-metadata">
                <div>
                  <dt>Status</dt>
                  <dd>
                    <Status>{activeService.status}</Status>
                  </dd>
                </div>
                {[
                  ["Version", activeService.version],
                  ["Environment", activeService.environment],
                  ["Owner", activeService.owner],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <Button
                variant="outline"
                onClick={() => {
                  setServiceDetails("");
                  setView("Delivery");
                }}
              >
                View deployments
                <ChevronRight />
              </Button>
            </Panel>
          )}
        </SheetContent>
      </Sheet>
    </Shell>
  );
}
