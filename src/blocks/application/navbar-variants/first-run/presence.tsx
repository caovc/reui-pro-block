import { useState } from "react";
import { ArrowDownWideNarrow, Filter } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { WorkspaceTrail } from "./free/trail";
import { ChoiceMenu } from "./free/choice-menu";
import { WorkspaceActions } from "./free/actions-menu";
import { PresenceGroup } from "./free/presence";
import { LocalNotice } from "./support";
import { InvitePopover } from "./free/inline-invite";
import { collaborators, filterOptions, sortOptions, workspaceRecords } from "./data";
import "./navbar.css";

export default function TeamPresenceNavbar() {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Date");
  const [notice, setNotice] = useState<string | null>(null);
  const records = workspaceRecords
    .filter((record) => filter === "All" || record.status === filter)
    .sort((a, b) =>
      sort === "Name"
        ? a.name.localeCompare(b.name)
        : sort === "Status"
          ? a.status.localeCompare(b.status)
          : b.date.localeCompare(a.date),
    );
  return (
    <section className="refined-navbar-scene" data-navbar-entry="2">
      <h1 className="navbar-demo-heading">Navbar</h1>
      <header className="navbar-presence-header">
        <WorkspaceTrail
          items={[{ label: "Workspace" }, { label: "Projects" }]}
          onNavigate={(label) => setNotice(`${label} selected locally.`)}
        />
        <div className="navbar-presence-actions">
          <PresenceGroup names={collaborators} extra={8} online />
          <InvitePopover
            onInvite={(email) =>
              setNotice(`Invitation saved locally for ${email}. No email was sent.`)
            }
          />
          <Separator orientation="vertical" className="h-5" />
          <ChoiceMenu
            label="Filter"
            value={filter}
            onChange={setFilter}
            options={filterOptions}
            icon={Filter}
          />
          <ChoiceMenu
            label="Sort"
            value={sort}
            onChange={setSort}
            options={sortOptions}
            icon={ArrowDownWideNarrow}
          />
          <WorkspaceActions
            onAction={(action) => setNotice(`${action}: local workspace action only.`)}
          />
        </div>
      </header>
      <div className="navbar-demo-placeholder" aria-label="Workspace content placeholder">
        <output className="sr-only" aria-live="polite">
          {filter} projects sorted by {sort}:{" "}
          {records.map((record) => record.name).join(", ") || "No matching projects"}
        </output>
      </div>
      <LocalNotice>{notice}</LocalNotice>
    </section>
  );
}
