import { referencePhotos } from "./photo-assets";
import { useState, type ReactNode } from "react";
import {
  Bell,
  Search,
  PanelLeft,
  ChevronDown,
  Home,
  LayoutDashboard,
  Settings,
  Users,
  Calendar,
  Briefcase,
  CheckSquare,
  Ticket,
  BookOpen,
  BarChart3,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import "./styles.css";
export {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
};
export function Mark() {
  return (
    <span className="ct-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M5.5 6v7.5a6.5 6.5 0 0 0 13 0V10"
          stroke="currentColor"
          strokeWidth="2.7"
          strokeLinecap="round"
        />
        <circle cx="18.5" cy="5.5" r="1.5" fill="currentColor" />
      </svg>
    </span>
  );
}
const avatarSources: Record<string, string> = {
  "Bruno Duarte": "https://roster-hr.reui.io/avatars/15.jpg",
  "Aisha Rahman": "https://roster-hr.reui.io/avatars/12.jpg",
  "Ingrid Larsen": "https://roster-hr.reui.io/avatars/17.jpg",
  "Priya Patel":
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=96&h=96&dpr=2&q=80",
  "Leo Grant": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&dpr=2&q=80",
  "Sana Qureshi":
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&dpr=2&q=80",
  "Kenji Tan": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=96&h=96&dpr=2&q=80",
  "Theo Park": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&dpr=2&q=80",
  "Alex Rivera": "https://images.unsplash.com/photo-1543299750-19d1d6297053?w=96&h=96&dpr=2&q=80",
  "Quanta Devices": "https://pulse-helpdesk.reui.io/avatars/carla-ferreira.jpg",
  "Apex Manufacturing": "https://pulse-helpdesk.reui.io/avatars/marcus-hale.jpg",
  "Brightwave Media": "https://pulse-helpdesk.reui.io/avatars/priya-raman.jpg",
  "Atlas Freight": "https://pulse-helpdesk.reui.io/avatars/aisha-bello.jpg",
};
export function Avatar({ name }: { name: string }) {
  const src =
    avatarSources[name] ||
    "https://pulse-helpdesk.reui.io/avatars/" + name.toLowerCase().replace(" ", "-") + ".jpg";
  return (
    <span className="ct-avatar">
      {name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")}
      {(referencePhotos[src] || avatarSources[name]) && (
        <img
          src={referencePhotos[src] || avatarSources[name]}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </span>
  );
}
export function ReferenceSheet({
  title,
  description,
  open,
  onClose,
  children,
  footer,
  width = 480,
}: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        className="ct-reference-sheet"
        style={{ width, maxWidth: "calc(100vw - 32px)" }}
      >
        <div className="ct-sheet-heading">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className={description ? "" : "sr-only"}>
            {description || title}
          </SheetDescription>
        </div>
        <div className="ct-sheet-body">{children}</div>
        {footer && <div className="ct-sheet-footer">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
export function Modal({
  title,
  description,
  open,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={title === "New Folder" ? "ct-folder-modal" : undefined}>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {description || "Changes are saved in this local demo workspace."}
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}
const icons = [LayoutDashboard, CheckSquare, Users, Briefcase, Calendar, Settings];
export function Shell({
  kind,
  view,
  setView,
  children,
  extra,
  query,
  setQuery,
}: {
  kind: "roster" | "pulse";
  view: string;
  setView: (v: string) => void;
  children: ReactNode;
  extra?: ReactNode;
  query: string;
  setQuery: (v: string) => void;
}) {
  const [mobile, setMobile] = useState(false);
  const [invite, setInvite] = useState(false);
  const [peopleNav, setPeopleNav] = useState(false);
  const nav =
    kind === "roster"
      ? ["Dashboard", "Approvals", "People", "Hiring", "Time", "Settings"]
      : ["Dashboard", "Tickets", "Contacts", "Team", "Knowledge Base", "Reports", "Settings"];
  const pulseIcons = [LayoutDashboard, Ticket, Users, Users, BookOpen, BarChart3, Settings];
  const side = (
    <>
      <div className="ct-side-search">
        <Search size={15} />
        <Input
          aria-label="Search workspace"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <kbd>⌘K</kbd>
      </div>
      <p className="ct-nav-label">{kind === "roster" ? "Workspace" : "Platform"}</p>
      <nav className="ct-nav">
        {nav.map((n, i) => {
          const Icon = kind === "roster" ? icons[i] : pulseIcons[i];
          return (
            <Button
              type="button"
              key={n}
              variant={n === view ? "secondary" : "ghost"}
              className="justify-start"
              aria-current={n === view ? "page" : undefined}
              onClick={() => {
                if (kind === "roster" && n === "People") setPeopleNav(!peopleNav);
                else {
                  setView(n);
                  setMobile(false);
                  setQuery("");
                }
              }}
            >
              <Icon />
              {n}
              {n === "Tickets" && <span className="ml-auto">24</span>}
            </Button>
          );
        })}
        {kind === "roster" && peopleNav && (
          <div className="ct-nav-sub">
            <Button
              variant={view === "People" ? "secondary" : "ghost"}
              onClick={() => setView("People")}
            >
              Directory
            </Button>
            <Button variant="ghost" onClick={() => setView("Import")}>
              Import
            </Button>
          </div>
        )}
      </nav>
      {kind === "roster" ? (
        <>
          <p className="ct-nav-label">Headcount by department</p>
          <div className="ct-nav">
            {["Engineering", "People", "Sales", "Customer Success", "Design"].map((d, i) => (
              <Button
                type="button"
                key={d}
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  setView("People");
                  setQuery(d);
                  setMobile(false);
                }}
              >
                <span className={"ct-dept-dot ct-color-" + i} />
                {d}
              </Button>
            ))}
          </div>
        </>
      ) : null}
      <div className="ct-side-bottom">
        {kind === "roster" ? (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Headcount plan</CardTitle>
              <CardDescription>
                Approved headcount for FY26. Resets when the plan is re-baselined.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="ct-progress">
                <span style={{ width: "92%" }} />
              </div>
              <div className="ct-between text-xs">
                <span>
                  <b>92%</b> Filled
                </span>
                <span>
                  <b>8%</b> Open
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card size="sm">
            <CardHeader>
              <CardTitle>SLA clock pauses on waits</CardTitle>
              <CardDescription>
                Waiting Customer holds a ticket's clock until the reply.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <button
                type="button"
                onClick={() => setView("Knowledge Base")}
                aria-label="Read about SLA clock pauses"
              >
                <img
                  className="ct-pulse-promo"
                  src={
                    referencePhotos["https://pulse-helpdesk.reui.io/news/sla-clock-pause.jpg"] ||
                    "https://pulse-helpdesk.reui.io/news/sla-clock-pause.jpg"
                  }
                  alt=""
                />
              </button>
            </CardContent>
          </Card>
        )}
        <div className="ct-profile">
          <Avatar name={kind === "roster" ? "Bruno Duarte" : "Nick Bold"} />
          <span>
            <b>{kind === "roster" ? "Bruno Duarte" : "Nick Bold"}</b>
            <small>{kind === "roster" ? "Roster UK" : "nick.bold@pulse.io"}</small>
          </span>
          <ChevronDown size={14} />
        </div>
      </div>
    </>
  );
  return (
    <div className={"ct-app ct-" + kind}>
      {kind === "pulse" && (
        <header className="ct-global">
          <Mark />
          <b>Help Desk</b>
          <ChevronDown size={12} />
          <span className="ct-muted">/</span>
          <span>All products</span>
          <ChevronDown size={12} />
          <div className="ct-grow" />
          <Avatar name="Mira Stone" />
          <Avatar name="Leo Grant" />
          <span className="ct-muted">+7</span>
          <Button variant="outline" onClick={() => setInvite(true)}>
            <Users />
            Invite
          </Button>
        </header>
      )}
      <div className="ct-app-body">
        <aside className="ct-sidebar">
          {kind === "roster" && (
            <div className="ct-side-brand">
              <Mark />
              <b>Roster</b>
              <div className="ct-grow" />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Notifications"
                onClick={() => toast("You are all caught up")}
              >
                <Bell />
              </Button>
              <PanelLeft size={15} />
            </div>
          )}
          {side}
        </aside>
        <main className="ct-main">
          <header className="ct-pagebar">
            <Button
              variant="ghost"
              size="icon"
              className="ct-mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </Button>
            <Home size={15} />
            <span>{kind === "roster" ? "People" : "Home"}</span>
            {(kind === "roster" || view !== "Dashboard") && (
              <>
                <span className="ct-muted">{kind === "roster" ? "–" : "/"}</span>
                <b>{view}</b>
              </>
            )}
            <div className="ct-grow" />
            {extra}
          </header>
          {children}
        </main>
      </div>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left">
          <SheetTitle>{kind === "roster" ? "Roster" : "Help Desk"}</SheetTitle>
          <SheetDescription>Workspace navigation</SheetDescription>
          {side}
        </SheetContent>
      </Sheet>
      <Modal title="Invite a teammate" open={invite} onClose={() => setInvite(false)}>
        <form
          className="ct-form"
          onSubmit={(e) => {
            e.preventDefault();
            setInvite(false);
            toast.success("Invitation prepared for your teammate");
          }}
        >
          <label>
            Email
            <Input type="email" required placeholder="name@company.com" />
          </label>
          <Button type="submit">Invite teammate</Button>
        </form>
      </Modal>
    </div>
  );
}
export function Empty({ reset }: { reset: () => void }) {
  return (
    <div className="ct-empty">
      <Search />
      <h3>No matching records</h3>
      <p>Try another search or clear the current filters.</p>
      <Button variant="outline" onClick={reset}>
        Clear filters
      </Button>
    </div>
  );
}
export function Sparkline({
  color = "var(--ct-green)",
  seed = 0,
}: {
  color?: string;
  seed?: number;
}) {
  return (
    <svg viewBox="0 0 180 60" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        points={
          seed % 2
            ? "0,49 15,32 30,34 45,22 60,9 75,18 90,35 105,43 120,25 135,37 150,27 165,18 180,24"
            : "0,30 18,25 34,30 50,38 66,25 82,29 98,19 114,26 132,21 150,22 165,14 180,18"
        }
      />
    </svg>
  );
}
export function Export({ rows, name }: { rows: string[][]; name: string }) {
  return (
    <Button
      size="sm"
      onClick={() => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(
          new Blob(
            [
              rows
                .map((r) => r.map((v) => '"' + v.replaceAll('"', '""') + '"').join(","))
                .join("\n"),
            ],
            { type: "text/csv" },
          ),
        );
        a.download = name + ".csv";
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Export downloaded");
      }}
    >
      Export
    </Button>
  );
}
