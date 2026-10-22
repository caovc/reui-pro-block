import type { BlockProps } from "@/data/types";
import AuthBlock from "./auth";
import Whiteboard from "./whiteboard";
import RichEditorBlock from "./editor";
import ScheduleBlock from "./schedule";
import CardsBlock from "./cards";
import { SettingsBlock, WizardBlock, DialogBlock } from "./forms";
import {
  ShellBlock,
  DashboardBlock,
  StatsBlock,
  NavBlock,
  ListBlock,
} from "./workspace";
import {
  CalendarBlock,
  BoardBlock,
  GanttBlock,
  FlowBlock,
  TimelineBlock,
  EmptyBlock,
} from "./planning";
export default function ApplicationBlock({ block }: BlockProps) {
  switch (block.category) {
    case "auth":
      return <AuthBlock block={block} />;
    case "card":
      return <CardsBlock block={block} />;
    case "app-shell":
      return <ShellBlock block={block} />;
    case "dashboard":
      return <DashboardBlock block={block} />;
    case "stats":
      return <StatsBlock block={block} />;
    case "navbar":
      return <NavBlock block={block} />;
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
      return <EmptyBlock block={block} />;
    default:
      throw new Error(`Unknown application category: ${block.category}`);
  }
}
