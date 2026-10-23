import type { BlockProps } from "@/data/types";
import {
  AiAgentsConsole,
  AppsGridHeader,
  FloatingSidebarAdmin,
  IconRailDashboard,
  ProjectTrackerSidebar,
  TeamCalendarPanel,
  TeamPresenceWorkspace,
} from "./standard";
import EnvironmentShell from "./environment";
import CalendarHub from "./hub";
import InventoryShell from "./inventory";
import MailInbox from "./mail";
import OperationsWorkbench from "./operations";
import { CommunityShell, DualWorkspace, FavoritesShell } from "./workspaces";
import { ModelChat, TodoShell, PlannerShell, WebmailShell } from "./productivity";
import { MissionShell, OperationsShell } from "./fleet-consoles";
import { FleetHeroShell } from "./specialized";
import BoardWorkspace from "./board-workspace";
import ObservabilityShell from "./observability";
import GlassWorkspace from "./glass-workspace";
import ChatWorkspace from "./chat-workspace";
import InvoiceQueue from "./invoice-queue";
import FleetCenter from "./fleet-center";
import "../../reference.css";
import "./shells.css";
import "./fidelity.css";
export default function AppShell({ block }: BlockProps) {
  const variant = Number(block.id.split("-").pop());
  switch (variant) {
    case 1:
      return <IconRailDashboard />;
    case 2:
      return <FloatingSidebarAdmin />;
    case 3:
      return <ProjectTrackerSidebar />;
    case 4:
      return <MailInbox />;
    case 5:
      return <CalendarHub />;
    case 6:
      return <TeamCalendarPanel />;
    case 7:
      return <EnvironmentShell />;
    case 8:
      return <InventoryShell />;
    case 9:
      return <TeamPresenceWorkspace />;
    case 10:
      return <AiAgentsConsole />;
    case 11:
      return <OperationsWorkbench />;
    case 12:
      return <AppsGridHeader />;
    case 13:
      return <CommunityShell />;
    case 14:
    case 16:
      return <DualWorkspace variant={variant} />;
    case 15:
      return <FavoritesShell />;
    case 17:
      return <ModelChat />;
    case 18:
      return <TodoShell />;
    case 19:
      return <PlannerShell />;
    case 20:
      return <WebmailShell />;
    case 21:
      return <ChatWorkspace />;
    case 22:
      return <FleetHeroShell />;
    case 25:
      return <MissionShell />;
    case 31:
      return <GlassWorkspace />;
    case 33:
      return <FleetCenter />;
    case 34:
      return <InvoiceQueue />;
    case 35:
      return <BoardWorkspace />;
    case 36:
      return <ObservabilityShell />;
    case 23:
    case 24:
    case 26:
    case 27:
    case 28:
    case 29:
    case 30:
    case 32:
      return <OperationsShell variant={variant} />;
    default:
      throw new Error(`Unknown app shell: ${block.id}`);
  }
}
