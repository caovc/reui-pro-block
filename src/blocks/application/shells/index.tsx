import type { BlockProps } from '@/data/types'
import { AiAgentsConsole, AppsGridHeader, FloatingSidebarAdmin, IconRailDashboard, ProjectTrackerSidebar, TeamCalendarPanel, TeamPresenceWorkspace } from './standard'
import MailInbox from './mail'
import CalendarHub from './hub'
import EnvironmentShell from './environment'
import InventoryShell from './inventory'
import OperationsShell from './operations'
import './shells.css'
export default function DetailedShell({block}:BlockProps){switch(block.id){case'app-shell-1':return <IconRailDashboard/>;case'app-shell-2':return <FloatingSidebarAdmin/>;case'app-shell-3':return <ProjectTrackerSidebar/>;case'app-shell-4':return <MailInbox/>;case'app-shell-5':return <CalendarHub/>;case'app-shell-6':return <TeamCalendarPanel/>;case'app-shell-7':return <EnvironmentShell/>;case'app-shell-8':return <InventoryShell/>;case'app-shell-9':return <TeamPresenceWorkspace/>;case'app-shell-10':return <AiAgentsConsole/>;case'app-shell-11':return <OperationsShell/>;case'app-shell-12':return <AppsGridHeader/>;default:throw new Error(`Shell reference not implemented: ${block.id}`)}}
