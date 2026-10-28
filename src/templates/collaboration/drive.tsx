import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/reui/alert";
import { sharedDriveFiles, folderDriveFiles } from "./drive-fixtures";
import { DriveFolderTree } from "./drive-tree";
import { getDriveTreeFolders } from "./drive-tree-data";
import { DriveFilePanels } from "./drive-panels";
import { ReferenceGrid } from "./reference-grid";
import { useRef, useState } from "react";
import { useFileUpload } from "@/hooks/use-file-upload";
import {
  Folder,
  FolderPlus,
  Upload,
  Star,
  Trash2,
  Clock,
  Users,
  LayoutGrid,
  List,
  Search,
  MoreVertical,
  Image,
  FileText,
  Video,
  ChevronRight,
  Menu,
  Download,
  ArrowLeft,
  Eye,
  EyeOff,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription } from "@/components/ui/item";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Mark,
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Avatar,
  Modal,
  ReferenceSheet,
  Empty,
} from "./shared";
import "./drive.css";
import { DriveLayout, DriveApplicationTrigger } from "./drive-layout";

import { DriveSettings } from "./drive-settings";
import { DriveProfileMenu } from "./drive-settings-profile-menu";
import { useDriveSettingsModel } from "./drive-settings-model";
import { driveSettingsTitles } from "./drive-settings-data";
import type { DriveSettingsNavigation } from "./drive-settings-types";
import { useDriveRoute } from "./drive-route";
import type { DriveRoute, DriveView } from "./drive-route-model";
import {
  createDriveHeaderBindings,
  driveFolderLocation,
  driveHeaderRoute,
  resolveDriveFileDestination,
} from "./drive-file-navigation";
import { DriveHeaderHelp } from "./drive-header-help";
import { DriveHeaderNotifications } from "./drive-header-notifications";
import type { DriveHeaderNavigation } from "./drive-header-data";
import { downloadDrivePdf } from "./drive-settings-downloads";
import { DrivePricing } from "./drive-pricing";
import { DriveWorkspaceMenu } from "./drive-workspace-menu";
import { useDriveWorkspaceModel } from "./drive-workspace-model";
import { setGlobalTheme, useGlobalTheme } from "@/components/site/global-theme-store";

export type FileRecord = {
  id: string;
  name: string;
  owner: string;
  type: string;
  size: string;
  modified: string;
  star: boolean;
  parent: string;
  deleted?: boolean;
  url?: string;
  sharedWith?: string;
};
const seeds: FileRecord[] = [
  ["Client Deliverables", "Priya Patel", "Folder", "501.7 KB", "Today"],
  ["Hero Cut v12.mp4", "Leo Grant", "MP4", "4.74 KB", "Today"],
  ["Hiring Pipeline — Dark.webp", "Sana Qureshi", "WebP", "54.5 KB", "Yesterday"],
  ["Incidents — Light.webp", "Kenji Tan", "WebP", "43.1 KB", "Last week"],
  ["Launch Film Master.mp4", "Leo Grant", "MP4", "4.74 KB", "6 days ago"],
  ["Launch Hero Frame.webp", "Kenji Tan", "WebP", "58.8 KB", "3 days ago"],
  ["Northwind Rebrand", "Theo Park", "Folder", "247.3 KB", "Today"],
  ["Northwind Rebrand Deck.svg", "Theo Park", "SVG", "1.49 KB", "Today"],
  ["Overview Screen.webp", "Theo Park", "WebP", "61.4 KB", "Today"],
  ["Overview — Dark.webp", "Kenji Tan", "WebP", "57.6 KB", "Today"],
  ["Q3 Studio Plan.pdf", "Alex Rivera", "PDF", "88.5 KB", "Today"],
  ["Bricklane symbol.svg", "Theo Park", "SVG", "833 B", "4 days ago"],
  ["Spring Campaign", "Leo Grant", "Folder", "387.1 KB", "Today"],
].map((r, i) => ({
  id: "file-" + i,
  name: r[0],
  owner: r[1],
  type: r[2],
  size: r[3],
  modified: r[4],
  star: true,
  parent: i === 1 ? "Spring Campaign" : "My Drive",
}));
const fileboxSeeds: FileRecord[] = [
  ["Brand Library", "Theo Park", "Folder", "384.0 KB", "4 days ago"],
  ["Spring Campaign", "Leo Grant", "Folder", "387.1 KB", "Today"],
  ["brand-tokens.json", "Kenji Tan", "JSON", "3.07 KB", "2 weeks ago"],
  ["Client Deliverables", "Priya Patel", "Folder", "501.7 KB", "Today"],
  ["New Hire Onboarding.pdf", "Mira Stone", "PDF", "69.3 KB", "Last month"],
  ["Partner Media Kit.zip", "Elijah Morgan", "ZIP", "161.1 KB", "3 weeks ago"],
  ["Product Design", "Sana Qureshi", "Folder", "1.51 MB", "Last week"],
  ["Q3 Studio Plan.pdf", "Alex Rivera", "PDF", "88.5 KB", "Last week"],
  ["Samples", "Nora Vale", "Folder", "241.3 KB", "Last week"],
  ["Studio Operations", "Nora Vale", "Folder", "315.7 KB", "Last week"],
  ["Studio Reel 2026.mp4", "Leo Grant", "MP4", "4.74 KB", "Last week"],
].map((r, i) => ({
  id: "box-" + i,
  name: r[0],
  owner: r[1],
  type: r[2],
  size: r[3],
  modified: r[4],
  star: false,
  parent: "My Drive",
}));
function FileIcon({ type }: { type: string }) {
  const Icon =
    type === "Folder" ? Folder : type === "MP4" ? Video : type === "PDF" ? FileText : Image;
  return <Icon size={17} className={type === "Folder" ? "" : "ct-muted"} />;
}
function Login({ onLogin }: { onLogin: () => void }) {
  const [visible, setVisible] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [sent, setSent] = useState(false);
  return (
    <div className="ct-app ct-drive-login">
      <div className="ct-login-container">
        {!forgot && (
          <p className="ct-login-notice">
            This is a live demo. The credentials are filled in, just click <b>Sign in.</b>
          </p>
        )}
        <Card>
          <CardHeader>
            <div className="ct-login-heading">
              <Mark />
              <CardTitle>{forgot ? "Reset your password" : "Welcome back"}</CardTitle>
              <CardDescription>
                {forgot
                  ? "We will send a link to the address on your account."
                  : "Sign in to continue to your workspace."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {forgot ? (
              <form
                className="ct-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                {sent ? (
                  <p role="status">Reset link prepared for this local demo.</p>
                ) : (
                  <>
                    <label>
                      Email
                      <Input name="email" type="email" placeholder="you@example.com" required />
                      <small className="ct-muted">The address you sign in with.</small>
                    </label>
                    <Button type="submit">Send reset link</Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setForgot(false);
                    setSent(false);
                  }}
                >
                  <ArrowLeft />
                  Back to sign in
                </Button>
              </form>
            ) : (
              <>
                <div className="ct-two">
                  <Button
                    variant="outline"
                    onClick={() => toast("Use the demo email sign-in below")}
                  >
                    <b className="ct-google">G</b>Google
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toast("Use the demo email sign-in below")}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.1 12.3c0-2.5 2-3.7 2.1-3.8-1.2-1.8-3.1-2-3.8-2-1.6-.2-3.1.9-3.9.9-.8 0-2-1-3.3-1-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.8 1.2 10.3.9 1.2 1.9 2.5 3.2 2.4 1.3 0 1.8-.8 3.4-.8s2.1.8 3.5.8 2.3-1.2 3.1-2.4c1-1.4 1.5-2.8 1.5-2.9-.1 0-2.8-1.1-2.8-4M14.5 4.8c.7-.9 1.2-2.1 1.1-3.3-1.1 0-2.5.8-3.3 1.7-.7.8-1.3 2-1.1 3.2 1.3.1 2.6-.7 3.3-1.6" />
                    </svg>
                    Apple
                  </Button>
                </div>
                <div className="ct-login-divider">Or sign in with email</div>
                <form
                  className="ct-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onLogin();
                  }}
                >
                  <label>
                    Email or username
                    <Input type="email" defaultValue="alex.rivera@bricklane.example" required />
                  </label>
                  <div className="ct-form-field">
                    <span className="ct-between">
                      <label htmlFor="ct-login-password">Password</label>
                      <button type="button" className="ct-subtle" onClick={() => setForgot(true)}>
                        Forgot password?
                      </button>
                    </span>
                    <div className="ct-password">
                      <Input
                        id="ct-login-password"
                        type={visible ? "text" : "password"}
                        defaultValue="password"
                        required
                      />
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={visible ? "Hide password" : "Show password"}
                        onClick={() => setVisible(!visible)}
                      >
                        {visible ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit">Sign in</Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default function Drive({ id }: { id: string }) {
  const routing = useDriveRoute(id === "filebox" ? "filebox" : "filespace");
  const { route } = routing;
  const workspaceModel = useDriveWorkspaceModel();
  const settingsModel = useDriveSettingsModel({
    onWorkspaceNameChange: workspaceModel.renameCurrentWorkspace,
  });
  const { theme } = useGlobalTheme();
  const [signed, setSigned] = useState(id !== "filebox");
  const [defaultView, setDefaultView] = useState<DriveView>("Favourites");
  const [files, setFiles] = useState<FileRecord[]>(() => [
    ...(id === "filebox" ? fileboxSeeds : seeds),
    ...sharedDriveFiles,
    ...folderDriveFiles,
  ]);
  const headerRef = useRef<HTMLElement>(null);
  const previewReturn = useRef<{ fileId: string; origin: string } | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All types");
  const [layout, setLayout] = useState("list");
  const [selected, setSelected] = useState<string[]>([]);
  const [localModal, setModal] = useState("");
  const [localTarget, setTarget] = useState<FileRecord | null>(null);
  const [mobile, setMobile] = useState(false);
  const [invite, setInvite] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [shares, setShares] = useState<
    Record<string, { people: string[][]; team: string; restriction: string }>
  >({});
  const [headerBindings] = useState(() => createDriveHeaderBindings(files, getDriveTreeFolders()));
  const treeFolders = getDriveTreeFolders();
  const destination = resolveDriveFileDestination(
    route.kind === "files" ? route.location : undefined,
    files,
    treeFolders,
    defaultView,
    headerBindings,
  );
  const view = destination.status === "ready" ? destination.view : defaultView;
  const routedFile =
    route.kind === "files" && destination.status === "ready" ? destination.file : null;
  const routedDocument =
    route.kind === "files" &&
    (route.location?.kind === "file" ||
      (route.location?.kind === "lookup" && route.location.entity === "file"));
  const target = routedDocument ? routedFile : localTarget;
  const modal = localModal || (routedFile ? "Preview" : "");
  const unavailable =
    route.kind === "missing"
      ? "This link does not match a location in this local Drive demo."
      : route.kind === "files" && destination.status !== "ready"
        ? destination.message
        : null;
  const routeKey = JSON.stringify(route);
  const [previousRouteKey, setPreviousRouteKey] = useState(routeKey);
  if (previousRouteKey !== routeKey) {
    // History renders the URL's location. It clears transient UI without pushing another entry.
    setPreviousRouteKey(routeKey);
    setModal("");
    setTarget(null);
    setQuery("");
    setSelected([]);
    setMobile(false);
    setInvite(false);
  }
  const [uploadState, uploadActions] = useFileUpload({
    multiple: true,
    maxSize: 100 * 1024 * 1024,
    onFilesAdded: (added) => {
      setFiles((f) => [
        ...added.map(({ file, id, preview }) => ({
          id,
          name: file.name,
          owner: "Alex Rivera",
          type: file.name.split(".").pop()?.toUpperCase() || "File",
          size: (file.size / 1024).toFixed(1) + " KB",
          modified: "Today",
          star: false,
          parent: view === "Favourites" ? "My Drive" : view,
          url: preview,
        })),
        ...f,
      ]);
      if (view === "Favourites") openFolder("My Drive");
    },
    onError: (errors) => errors.forEach((error) => toast.error(error)),
  });
  const parentFolder =
    target && target.parent !== "My Drive"
      ? files.find((file) => file.type === "Folder" && file.name === target.parent && !file.deleted)
      : undefined;
  const inherited = !!parentFolder;
  const shareOwner = parentFolder?.owner || target?.owner || "Alex Rivera";
  const permissionKey = parentFolder?.id || target?.id || "";
  const productionTeam = target?.parent === "Spring Campaign" || target?.name === "Spring Campaign";
  const teamName = productionTeam ? "Post Production" : "Client Services";
  const shared = shares[permissionKey] ?? {
    people: [
      [shareOwner, shareOwner.toLowerCase().replaceAll(" ", ".") + "@bricklane.example", "Owner"],
      ["Nora Vale", "nora.vale@bricklane.example", "Can edit"],
      ["Theo Park", "theo.park@bricklane.example", "Can view"],
    ].filter(([name], index, people) => people.findIndex((person) => person[0] === name) === index),
    team: productionTeam ? "Can comment" : "Can view",
    restriction: "Restricted",
  };
  function changeShare(change: Partial<typeof shared>) {
    if (target) setShares((s) => ({ ...s, [permissionKey]: { ...shared, ...change } }));
  }
  function navigateDrive(destination: DriveRoute) {
    const location = destination.kind === "files" ? destination.location : undefined;
    const opener = document.activeElement;
    previewReturn.current =
      location?.kind === "file" &&
      opener instanceof HTMLElement &&
      opener.dataset.driveFileOpen === location.id
        ? { fileId: location.id, origin: window.location.hash }
        : null;
    setModal("");
    setMobile(false);
    setQuery("");
    setSelected([]);
    routing.navigate(destination);
  }

  const driveHeaderNavigation: DriveHeaderNavigation = {
    href: (target) => routing.href(driveHeaderRoute(target, files, treeFolders, headerBindings)),
    onNavigate: (target) =>
      navigateDrive(driveHeaderRoute(target, files, treeFolders, headerBindings)),
  };
  const settingsNavigation: DriveSettingsNavigation = {
    href: (section, memberSlug) => routing.href({ kind: "settings", section, memberSlug }),
    onNavigate: (section, memberSlug) => navigateDrive({ kind: "settings", section, memberSlug }),
  };

  if (!signed || route.kind === "login")
    return (
      <Login
        onLogin={() => {
          setSigned(true);
          setDefaultView("My Drive");
          // Keep a copied validated destination; bare/login retain the original My Drive entry.
          if (route.kind === "login" || (route.kind === "files" && !route.location)) {
            navigateDrive({ kind: "files" });
          }
        }}
      />
    );
  const visible = files
    .filter(
      (f) =>
        (view === "Bin" ? f.deleted : !f.deleted) &&
        (view === "Favourites"
          ? f.star
          : view === "Shared With Me"
            ? f.parent === "Shared With Me"
            : view === "Recent"
              ? ["Today", "Yesterday"].includes(f.modified)
              : view === "Bin"
                ? true
                : f.parent === view) &&
        (type === "All types" || f.type === type) &&
        f.name.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  function openFolder(name: string) {
    navigateDrive({
      kind: "files",
      location: driveFolderLocation(name, files, treeFolders, headerBindings),
    });
    setQuery("");
    setSelected([]);
    setMobile(false);
  }
  function recordRoute(file: FileRecord): DriveRoute {
    return {
      kind: "files",
      location:
        file.type === "Folder"
          ? { kind: "folder", source: "record", id: file.id }
          : { kind: "file", id: file.id },
    };
  }
  function recordHref(file: FileRecord) {
    return new URL(routing.href(recordRoute(file)), window.location.href).href;
  }
  function openFile(file: FileRecord) {
    navigateDrive(recordRoute(file));
  }
  function trash(ids: string[]) {
    setFiles((f) => f.map((x) => (ids.includes(x.id) ? { ...x, deleted: true } : x)));
    setSelected([]);
    toast.success("Moved to bin");
  }
  const side = (
    <>
      <DriveFolderTree
        folders={files.filter((file) => file.type === "Folder" && !file.deleted)}
        view={view}
        onNavigate={openFolder}
      />
      <div className="ct-drive-side-bottom">
        {[
          ["Shared With Me", Users],
          ["Recent", Clock],
          ["Favourites", Star],
          ["Bin", Trash2],
        ].map(([label, Icon]) => (
          <Button
            key={String(label)}
            variant={view === label ? "secondary" : "ghost"}
            className="justify-start"
            onClick={() => {
              openFolder(String(label));
            }}
          >
            {typeof Icon !== "string" && <Icon />}
            {String(label)}
          </Button>
        ))}
        <div className="ct-storage">
          <div className="ct-between">
            <b>Storage</b>
            <span>63% full</span>
          </div>
          <div className="ct-progress">
            <span style={{ width: "63%", background: "var(--foreground)" }} />
          </div>
          <p>643.6 MB of 1.00 GB used</p>
          <Button variant="outline" onClick={() => navigateDrive({ kind: "pricing" })}>
            Get More Storage
          </Button>
        </div>
      </div>
    </>
  );
  return (
    <Sheet open={mobile && route.kind === "files"} onOpenChange={setMobile}>
      <DriveLayout
        onNavigate={() => openFolder("My Drive")}
        activeApplication={
          route.kind === "pricing"
            ? "Pricing"
            : route.kind === "settings"
              ? route.section === "workspace"
                ? "Workspace"
                : "Settings"
              : "Drive"
        }
        profileName={settingsModel.profile.fullName}
        profileMenu={
          <DriveProfileMenu
            name={settingsModel.profile.fullName}
            email={settingsModel.profile.email}
            theme={theme.mode === "light" || theme.mode === "dark" ? theme.mode : "system"}
            onThemeChange={(mode) => setGlobalTheme({ ...theme, mode })}
            navigation={settingsNavigation}
            loginHref={routing.href({ kind: "login" })}
            onSignOut={() => navigateDrive({ kind: "login" })}
          />
        }
        onAction={(action) => {
          if (action === "Get More Storage") navigateDrive({ kind: "pricing" });
          else if (action === "Workspace settings")
            navigateDrive({ kind: "settings", section: "workspace" });
          else if (action === "Account settings")
            navigateDrive({ kind: "settings", section: "profile" });
          else setModal(action);
        }}
      >
        <header ref={headerRef} className="ct-drive-header">
          <DriveApplicationTrigger />
          <DriveWorkspaceMenu
            workspaces={workspaceModel.workspaces}
            value={workspaceModel.selectedId}
            onSelect={workspaceModel.selectWorkspace}
            onCreate={workspaceModel.createWorkspace}
          />
          <span className="ct-muted">/</span>
          <span>
            {route.kind === "settings"
              ? driveSettingsTitles[route.section]
              : route.kind === "pricing"
                ? "Pricing"
                : unavailable
                  ? "Unavailable"
                  : view}
          </span>
          <div className="ct-grow" />
          <DriveHeaderHelp navigation={driveHeaderNavigation} />
          <DriveHeaderNotifications
            navigation={driveHeaderNavigation}
            onDownloadAttachment={({ name, lines }) => downloadDrivePdf(name, lines)}
          />
        </header>
        {route.kind === "settings" ? (
          <DriveSettings
            section={route.section}
            memberSlug={route.memberSlug}
            model={settingsModel}
            navigation={settingsNavigation}
            files={files}
            currentPlan={workspaceModel.currentPlan}
            onOpenFile={(fileId) => {
              const file = files.find((entry) => entry.id === fileId && !entry.deleted);
              if (file) openFile(file);
            }}
            pricingHref={routing.href({ kind: "pricing" })}
            onPricing={() => navigateDrive({ kind: "pricing" })}
          />
        ) : route.kind === "pricing" ? (
          <div className="ds-root reui-reference">
            <DrivePricing
              currentPlan={workspaceModel.currentPlan.id}
              onPlanChange={(plan) => {
                if (plan === workspaceModel.currentPlan.id) return;
                workspaceModel.changeCurrentPlan(plan);
                settingsModel.resetBillingCapacity();
              }}
            />
          </div>
        ) : unavailable ? (
          <main className="reui-reference p-6">
            <Alert variant="destructive">
              <AlertTitle>Drive location unavailable</AlertTitle>
              <AlertDescription>{unavailable}</AlertDescription>
              <AlertAction>
                <Button variant="outline" onClick={() => openFolder("My Drive")}>
                  Back to Drive
                </Button>
              </AlertAction>
            </Alert>
          </main>
        ) : (
          <div className="ct-drive-body">
            <aside className="ct-drive-sidebar">{side}</aside>
            <main
              className={"ct-drive-content " + (uploadState.isDragging ? "ct-drive-dragging" : "")}
              onDragEnter={uploadActions.handleDragEnter}
              onDragLeave={uploadActions.handleDragLeave}
              onDragOver={uploadActions.handleDragOver}
              onDrop={uploadActions.handleDrop}
            >
              <div className="ct-drive-toolbar">
                <div className="ct-toolbar">
                  <SheetTrigger asChild>
                    <Button
                      className="ct-drive-folders-trigger"
                      size="icon"
                      variant="outline"
                      aria-label="Open folders"
                    >
                      <Menu />
                    </Button>
                  </SheetTrigger>
                  <button type="button" className="ct-muted" onClick={() => openFolder("My Drive")}>
                    My Drive
                  </button>
                  {view !== "My Drive" && (
                    <>
                      <ChevronRight size={14} />
                      <span>{view}</span>
                    </>
                  )}
                </div>
                <div className="ct-grow" />
                <div className="ct-toolbar">
                  <div className="ct-drive-search">
                    <Search size={15} />
                    <Input
                      aria-label="Search files"
                      placeholder={"Search " + view}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger aria-label="File type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["All types", "Folder", "PDF", "WebP", "MP4", "SVG"].map((t) => (
                        <SelectItem value={t} key={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    spacing={0}
                    value={layout}
                    onValueChange={(value) => {
                      if (value) setLayout(value);
                    }}
                    className="ct-drive-layout-toggle"
                    aria-label="File view"
                  >
                    <ToggleGroupItem value="list" aria-label="List view">
                      <List />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="grid" aria-label="Grid view">
                      <LayoutGrid />
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" aria-label="Display columns">
                        <SlidersHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {["owner", "type", "size", "modified"].map((key) => (
                        <DropdownMenuCheckboxItem
                          key={key}
                          checked={columnVisibility[key] !== false}
                          onCheckedChange={(value) =>
                            setColumnVisibility((v) => ({ ...v, [key]: value }))
                          }
                        >
                          {key[0].toUpperCase() + key.slice(1)}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="New Folder"
                    onClick={() => setModal("New Folder")}
                  >
                    <FolderPlus />
                  </Button>
                  <Button
                    size="icon"
                    aria-label="Upload"
                    onClick={() => uploadActions.openFileDialog()}
                  >
                    <Upload />
                  </Button>
                </div>
              </div>
              {selected.length > 0 && (
                <div className="ct-drive-selection">
                  <span>{selected.length} selected</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTarget(null);
                      setModal("Move to bin");
                    }}
                  >
                    <Trash2 />
                    Move to bin
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                    Cancel
                  </Button>
                </div>
              )}
              {id === "filebox" && view === "My Drive" && !query && (
                <section className="ct-suggested-folders">
                  <h2>Suggested Folders</h2>
                  <div>
                    {[
                      ["Brand Library", "384.0 KB", "8 items"],
                      ["Samples", "241.3 KB", "6 items"],
                      ["Product Design", "1.51 MB", "36 items"],
                      ["Spring Campaign", "387.1 KB", "10 items"],
                    ].map(([name, size, count]) => (
                      <Item
                        asChild
                        variant="outline"
                        className="ct-drive-suggested-item"
                        key={name}
                      >
                        <button type="button" onClick={() => openFolder(name)}>
                          <ItemMedia variant="icon" className="ct-drive-suggested-icon">
                            <Folder />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>{name}</ItemTitle>
                            <ItemDescription>
                              <span>{size}</span>
                              <span>{count}</span>
                            </ItemDescription>
                          </ItemContent>
                        </button>
                      </Item>
                    ))}
                  </div>
                  <h2>Suggested Files</h2>
                </section>
              )}
              {layout === "list" ? (
                <div className="ct-drive-table">
                  <ReferenceGrid
                    rows={visible}
                    columnVisibility={columnVisibility}
                    columns={[
                      {
                        id: "selection",
                        title: "",
                        header: (
                          <Checkbox
                            aria-label="Select all files"
                            checked={visible.length > 0 && selected.length === visible.length}
                            onCheckedChange={(v) => setSelected(v ? visible.map((f) => f.id) : [])}
                          />
                        ),
                        render: (f) => (
                          <Checkbox
                            aria-label={"Select " + f.name}
                            checked={selected.includes(f.id)}
                            onCheckedChange={(v) =>
                              setSelected((s) => (v ? [...s, f.id] : s.filter((x) => x !== f.id)))
                            }
                          />
                        ),
                      },
                      {
                        id: "name",
                        title: "Name",
                        value: (f) => f.name,
                        render: (f) => (
                          <div className="ct-drive-filename">
                            <button
                              type="button"
                              data-drive-file-open={f.id}
                              onClick={() => openFile(f)}
                            >
                              <FileIcon type={f.type} />
                              <span className="ct-drive-filetext">
                                <span className="ct-drive-title">{f.name}</span>
                                <small className="ct-drive-mobile-meta">
                                  {f.type} ·{" "}
                                  {f.type === "Folder"
                                    ? {
                                        "Client Deliverables": "13 items",
                                        "Northwind Rebrand": "6 items",
                                        "Brand Library": "8 items",
                                        "Spring Campaign": "10 items",
                                        "Studio Operations": "6 items",
                                        "Product Design": "36 items",
                                        Samples: "6 items",
                                        "Harbor Coffee": "4 items",
                                      }[f.name] || "0 items"
                                    : f.size}{" "}
                                  · {f.modified}
                                </small>
                              </span>
                            </button>
                            <button
                              type="button"
                              aria-label={(f.star ? "Unstar " : "Star ") + f.name}
                              onClick={() =>
                                setFiles((a) =>
                                  a.map((x) => (x.id === f.id ? { ...x, star: !x.star } : x)),
                                )
                              }
                            >
                              <Star size={14} className={f.star ? "ct-star" : ""} />
                            </button>
                          </div>
                        ),
                      },
                      {
                        id: "owner",
                        title: "Owner",
                        value: (f) => f.owner,
                        render: (f) => (
                          <span className="ct-person">
                            <Avatar name={f.owner} />
                            {f.owner}
                          </span>
                        ),
                      },
                      {
                        id: "type",
                        title: "Type",
                        value: (f) => f.type,
                        render: (f) => <Badge variant="outline">{f.type}</Badge>,
                      },
                      {
                        id: "size",
                        title: "Size",
                        value: (f) => parseFloat(f.size),
                        render: (f) => (
                          <>
                            {f.size}
                            {f.type === "Folder" && (
                              <small className="block ct-muted">
                                {f.id === "file-0" ? "13" : "6"} items
                              </small>
                            )}
                          </>
                        ),
                      },
                      {
                        id: "modified",
                        title: "Modified",
                        value: (f) => f.modified,
                        render: (f) => (
                          <>
                            {f.modified}
                            <span className="ct-person ct-subtle">
                              <Avatar name={f.owner} />
                              {f.owner}
                            </span>
                          </>
                        ),
                      },
                      {
                        id: "actions",
                        title: "",
                        render: (f) => (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                aria-label={"Actions for " + f.name}
                              >
                                <MoreVertical />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-52">
                              {[
                                "Details",
                                "Share",
                                "Copy Link",
                                "Rename",
                                f.star ? "Remove from Favourites" : "Add to Favourites",
                                "Move",
                                "Version History",
                                "Download",
                                f.deleted ? "Restore" : "Move to Trash",
                              ].map((action) => (
                                <DropdownMenuItem
                                  key={action}
                                  onClick={() => {
                                    setTarget(f);
                                    if (action === "Share") setModal("Share file");
                                    else if (action === "Rename") setModal("Rename file");
                                    else if (action.includes("Favourites"))
                                      setFiles((a) =>
                                        a.map((x) => (x.id === f.id ? { ...x, star: !x.star } : x)),
                                      );
                                    else if (action === "Move to Trash") trash([f.id]);
                                    else if (action === "Restore")
                                      setFiles((a) =>
                                        a.map((x) =>
                                          x.id === f.id ? { ...x, deleted: false } : x,
                                        ),
                                      );
                                    else if (action === "Copy Link") {
                                      navigator.clipboard.writeText(recordHref(f));
                                      toast.success("Link copied");
                                    } else if (action === "Download" && f.url) {
                                      const a = document.createElement("a");
                                      a.href = f.url;
                                      a.download = f.name;
                                      a.click();
                                    } else setModal(action);
                                  }}
                                >
                                  {action}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ),
                      },
                    ]}
                  />
                </div>
              ) : (
                <div className="ct-drive-grid">
                  {visible.map((f) => (
                    <Card key={f.id}>
                      <CardContent>
                        <button
                          type="button"
                          className="ct-drive-grid-file"
                          data-drive-file-open={f.id}
                          onClick={() => openFile(f)}
                        >
                          <FileIcon type={f.type} />
                          <b>{f.name}</b>
                          <small>
                            {f.size} · {f.modified}
                          </small>
                        </button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {!visible.length && (
                <Empty
                  reset={() => {
                    setQuery("");
                    setType("All types");
                    openFolder("My Drive");
                  }}
                />
              )}
            </main>
          </div>
        )}
        <input {...uploadActions.getInputProps()} hidden />
        <ReferenceSheet
          title="Share with people and teams"
          description={target?.name}
          width={416}
          open={route.kind === "files" && modal === "Share file"}
          onClose={() => {
            setModal("");
            setInvite(false);
          }}
          footer={
            <>
              <Select
                value={shared.restriction}
                disabled={inherited}
                onValueChange={(restriction) => changeShare({ restriction })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Restricted">Restricted</SelectItem>
                  <SelectItem value="Anyone with the link">Anyone with the link</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  if (target) navigator.clipboard.writeText(recordHref(target));
                  toast.success("Link copied");
                }}
              >
                Copy Link
              </Button>
              {inherited && (
                <small className="ct-inherited-footer">Managed in {target?.parent}</small>
              )}
            </>
          }
        >
          {inherited && (
            <Alert className="ct-inherited-alert">
              <Folder />
              <AlertTitle>Inherits access from {target?.parent}</AlertTitle>
              <AlertAction>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (parentFolder) setTarget(parentFolder);
                    setInvite(false);
                  }}
                >
                  Manage
                </Button>
              </AlertAction>
            </Alert>
          )}
          <section className="ct-detail-section">
            <div className="ct-between">
              <h4>
                PEOPLE WITH ACCESS <span>{shared.people.length} people</span>
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (parentFolder) setTarget(parentFolder);
                  setInvite(!invite);
                }}
              >
                Invite
              </Button>
            </div>
            {invite && (
              <form
                className="ct-form ct-share-invite"
                onSubmit={(e) => {
                  e.preventDefault();
                  const email = String(new FormData(e.currentTarget).get("email"));
                  if (!shared.people.some((p) => p[1] === email))
                    changeShare({
                      people: [...shared.people, [email.split("@")[0], email, "Can view"]],
                    });
                  setInvite(false);
                }}
              >
                <Input type="email" name="email" required placeholder="Email address" />
                <Button type="submit">Invite</Button>
              </form>
            )}
            {shared.people.map(([name, email, access]) => (
              <div className="ct-share-member" key={email}>
                <Avatar name={name} />
                <span>
                  <b>{name}</b>
                  <small>{email}</small>
                  {inherited && access !== "Owner" && (
                    <small className="ct-inherited-label">
                      {name === "Theo Park" ? "Pending · " : ""}Inherited
                    </small>
                  )}
                </span>
                {access === "Owner" ? (
                  <span className="ct-subtle">Owner</span>
                ) : (
                  <Select
                    value={access}
                    disabled={inherited}
                    onValueChange={(value) =>
                      changeShare({
                        people:
                          value === "Remove access"
                            ? shared.people.filter((p) => p[1] !== email)
                            : shared.people.map((p) => (p[1] === email ? [p[0], p[1], value] : p)),
                      })
                    }
                  >
                    <SelectTrigger aria-label={"Access for " + name}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Can view", "Can edit", "Remove access"].map((v) => (
                        <SelectItem value={v} key={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </section>
          <section className="ct-detail-section">
            <h4>
              TEAMS WITH ACCESS <span>1 team</span>
            </h4>
            <div className="ct-share-member">
              <Users size={24} />
              <span>
                <b>{teamName}</b>
                <small>
                  {productionTeam ? "8 members" : "6 members"}
                  {inherited ? " · Inherited" : ""}
                </small>
              </span>
              <Select
                value={shared.team}
                disabled={inherited}
                onValueChange={(team) => changeShare({ team })}
              >
                <SelectTrigger aria-label={teamName + " access"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Can view">Can view</SelectItem>
                  <SelectItem value="Can comment">Can comment</SelectItem>
                  <SelectItem value="Can edit">Can edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>
        </ReferenceSheet>
        <DriveFilePanels
          mode={route.kind === "files" ? modal : ""}
          file={target ? files.find((f) => f.id === target.id) || target : null}
          files={files}
          onMode={setModal}
          onUpdate={(updated) => {
            setFiles((all) => all.map((f) => (f.id === updated.id ? updated : f)));
            setTarget(updated);
          }}
        />
        <Modal
          onCloseAutoFocus={(event) => {
            const returnTo = previewReturn.current;
            previewReturn.current = null;
            if (!returnTo || returnTo.origin !== window.location.hash) return;
            const scope = headerRef.current?.closest(".ct-drive-native-root");
            const opener = Array.from(
              scope?.querySelectorAll<HTMLElement>(
                `[data-drive-file-open="${CSS.escape(returnTo.fileId)}"]`,
              ) ?? [],
            ).find(
              (candidate) =>
                candidate.isConnected &&
                candidate.getClientRects().length > 0 &&
                !candidate.hasAttribute("disabled"),
            );
            if (opener) {
              opener.focus({ preventScroll: true });
              if (document.activeElement === opener) event.preventDefault();
            }
          }}
          description={modal === "New Folder" ? "Creates a folder inside My Drive." : undefined}
          title={modal === "Preview" ? target?.name || "File preview" : modal}
          open={
            !!modal &&
            route.kind === "files" &&
            !unavailable &&
            !["Share file", "Details", "Move", "Version History", "Download"].includes(modal)
          }
          onClose={() => {
            setModal("");
            if (modal === "Preview" && routedFile) {
              routing.closePreview({
                kind: "files",
                location: driveFolderLocation(
                  routedFile.parent,
                  files,
                  treeFolders,
                  headerBindings,
                ),
              });
            }
          }}
        >
          {modal === "New Folder" || modal === "Rename file" ? (
            <form
              className="ct-form"
              onSubmit={(e) => {
                e.preventDefault();
                const name = String(new FormData(e.currentTarget).get("name"));
                if (modal === "Rename file" && target)
                  setFiles((f) => f.map((x) => (x.id === target.id ? { ...x, name } : x)));
                else {
                  setFiles((f) => [
                    ...f,
                    {
                      id: crypto.randomUUID(),
                      name,
                      owner: "Alex Rivera",
                      type: "Folder",
                      size: "0 B",
                      modified: "Today",
                      star: false,
                      parent: view === "Favourites" ? "My Drive" : view,
                    },
                  ]);
                  if (view === "Favourites") openFolder("My Drive");
                }
                setModal("");
                toast.success("Saved");
              }}
            >
              <label>
                Name
                <Input
                  name="name"
                  placeholder="Untitled folder"
                  required
                  autoFocus
                  defaultValue={modal === "Rename file" ? target?.name : ""}
                />
              </label>
              <div className="ct-folder-footer">
                <Button type="button" variant="outline" onClick={() => setModal("")}>
                  Cancel
                </Button>
                <Button type="submit">{modal === "New Folder" ? "Create" : "Save name"}</Button>
              </div>
            </form>
          ) : modal === "Preview" && target ? (
            <div className="ct-form">
              {target.url && ["PNG", "JPG", "JPEG", "WEBP", "GIF"].includes(target.type) ? (
                <img src={target.url} alt={target.name} className="ct-upload-preview" />
              ) : (
                <div className="ct-file-preview">
                  <FileIcon type={target.type} />
                  <h3>{target.name}</h3>
                  <p>
                    {target.type} · {target.size}
                  </p>
                  <p className="ct-subtle">
                    {target.url
                      ? "Uploaded file is ready to download."
                      : "This seeded demo record has metadata only. Upload a file to preview its contents."}
                  </p>
                </div>
              )}
              <p>
                Owner: {target.owner} · Modified {target.modified}
              </p>
              {target.sharedWith && <p>Shared with: {target.sharedWith}</p>}
              {target.url && (
                <Button asChild>
                  <a href={target.url} download={target.name}>
                    <Download />
                    Download file
                  </a>
                </Button>
              )}
            </div>
          ) : modal === "Share file" ? (
            <form
              className="ct-form"
              onSubmit={(e) => {
                e.preventDefault();
                const email = String(new FormData(e.currentTarget).get("email"));
                setFiles((f) =>
                  f.map((x) => (x.id === target?.id ? { ...x, sharedWith: email } : x)),
                );
                toast.success("Local sharing access updated");
                setModal("");
              }}
            >
              <p>{target?.name}</p>
              <label>
                Add people
                <Input name="email" type="email" required placeholder="Email address" />
              </label>
              <Select defaultValue="view">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Can view</SelectItem>
                  <SelectItem value="edit">Can edit</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit">Share file</Button>
            </form>
          ) : modal === "Move to bin" ? (
            <>
              <p>{selected.length} files will be moved to the bin. You can restore them later.</p>
              <Button
                onClick={() => {
                  trash(selected);
                  setModal("");
                }}
              >
                Move to bin
              </Button>
            </>
          ) : null}
        </Modal>
      </DriveLayout>
      <SheetContent side="left" className="reui-reference ct-drive-folder-sheet">
        <SheetHeader>
          <SheetTitle>Bricklane Drive</SheetTitle>
          <SheetDescription>Pick a folder or a saved view</SheetDescription>
        </SheetHeader>
        <div className="ct-drive-folder-content">{side}</div>
      </SheetContent>
    </Sheet>
  );
}
