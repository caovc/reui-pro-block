import FinalNavbarBlock from "./navbar-variants/final-bars";
import DeveloperNavbarBlock from "./navbar-variants/developer";
import PublishingNavbarBlock from "./navbar-variants/publishing";
import ToolbarNavbarBlock from "./navbar-variants/toolbars";
import RefinedNavbarBlock from "./navbar-variants/first-run";
import RefinedDialogBlock from "./dialog-variants/first-run";
import WorkspaceDialogBlock from "./dialog-variants/workspace";
import FinalWorkspaceDialogBlock from "./dialog-variants/workspace-final";
import RefinedEmptyBlock from "./empty-variants";
import WorkspaceSetupEmptyBlock from "./empty-variants/workspace-setup";
import TeamSetupEmptyBlock from "./empty-variants/team-setup";
import type { BlockProps } from "@/data/types";
import AuthBlock from "./auth";
import Whiteboard from "./whiteboard";
import RichEditorBlock from "./editor";
import ScheduleBlock from "./schedule";
import CardsBlock from "./cards";
import { SettingsBlock, WizardBlock, DialogBlock } from "./forms";
import { DashboardBlock, StatsBlock, NavBlock, ListBlock } from "./workspace";
import AppShell from "./shells/audited";
import { CalendarBlock, BoardBlock, GanttBlock, FlowBlock, TimelineBlock } from "./planning";
export default function ApplicationBlock({ block }: BlockProps) {
  switch (block.category) {
    case "auth":
      return <AuthBlock block={block} />;
    case "card":
      return <CardsBlock block={block} />;
    case "app-shell":
      return <AppShell block={block} />;
    case "dashboard":
      return <DashboardBlock block={block} />;
    case "stats":
      return <StatsBlock block={block} />;
    case "navbar":
      if (block.index >= 11 && block.index < 13) {
        return <FinalNavbarBlock block={block} />;
      }
      if (block.index >= 9 && block.index < 11) {
        return <DeveloperNavbarBlock block={block} />;
      }
      if (block.index >= 6 && block.index < 9) {
        return <PublishingNavbarBlock block={block} />;
      }
      if (block.index >= 3 && block.index < 6) {
        return <ToolbarNavbarBlock block={block} />;
      }
      return block.index < 3 ? <RefinedNavbarBlock block={block} /> : <NavBlock block={block} />;
    case "list":
      return <ListBlock block={block} />;
    case "form":
    case "settings":
    case "profile":
      return <SettingsBlock block={block} />;
    case "wizard":
    case "onboarding":
      return <WizardBlock block={block} />;
    case "dialog":
      return block.index < 5 ? (
        <RefinedDialogBlock block={block} />
      ) : block.index < 10 ? (
        <WorkspaceDialogBlock block={block} />
      ) : (
        <FinalWorkspaceDialogBlock block={block} />
      );
    case "sheet":
      return <DialogBlock block={block} />;
    case "event-calendar":
      return <CalendarBlock block={block} />;
    case "schedule":
      return <ScheduleBlock block={block} />;
    case "kanban-board":
      return <BoardBlock block={block} />;
    case "gantt":
      return <GanttBlock block={block} />;
    case "flow":
      return <FlowBlock block={block} />;
    case "timeline":
      return <TimelineBlock block={block} />;
    case "whiteboard":
      return <Whiteboard block={block} />;
    case "rich-text-editor":
      return <RichEditorBlock block={block} />;
    case "empty-state":
      return block.index < 5 ? (
        <RefinedEmptyBlock block={block} />
      ) : block.index < 10 ? (
        <TeamSetupEmptyBlock block={block} />
      ) : (
        <WorkspaceSetupEmptyBlock block={block} />
      );
    default:
      throw new Error(`Unknown application category: ${block.category}`);
  }
}
