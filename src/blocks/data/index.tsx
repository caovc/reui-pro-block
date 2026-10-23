import FilteringGrid from './grid-filtering';
import BaseGrid from './grid-base';
import ColumnsGrid from './grid-columns';
import AdvancedGrid from './grid-advanced';
import GroupingGrid from './grid-grouping';
import DragDropGrid from './grid-drag-drop';
import EditingGrid from './grid-editing';
import ExpansionGrid from './grid-expansion';
import VirtualGrid from './grid-virtualization';
import './grid-refinement.css';
import type { BlockProps } from '@/data/types'
import { BookingBlock, DetailBlock, FilesBlock, ItineraryBlock } from './business'
import DigitalTwinBlock from './digital-twin'
import { AgentOpsBlock, AnalyticsBlock, DashboardBlock, OpsBlock } from './operations'
import QueueBlock from './queues'
import GridBlock from './grid'
import ChartBlock from './charts'
import BarChartBlock from './bar-charts'
import GenerationMix from './generation-mix'
import AreaPanel from './area-panels'
import PieChartBlock from './pie-charts'
import RadialChartBlock from './radial-charts'
import SlopeChartBlock from './slope-charts'
import SankeyChartBlock from './sankey-charts'
import { ActivityBlock, ChatBlock, UsageBlock } from './ai'
import { BoardBlock, PermissionBlock, PlansBlock, SettingsBlock, TimelineBlock, WizardBlock } from './workflows'
export default function DataBlock({block}:BlockProps){
 if (block.group === "data-grid") {
    const refined = {
      base: BaseGrid,
      columns: ColumnsGrid,
      advanced: AdvancedGrid,
      grouping: GroupingGrid,
      filtering: FilteringGrid,
      "drag-drop": DragDropGrid,
      editing: EditingGrid,
      expansion: ExpansionGrid,
      virtualization: VirtualGrid,
    }[block.category];
    const Refined = refined || GridBlock;
    const previous = [
      "data-grid-drag-drop-3",
      "data-grid-editing-2",
      "data-grid-expansion-2",
    ].includes(block.id);
    return (
      <main className={`data-grid-refinement min-w-0 w-full ${previous ? block.id === 'data-grid-editing-2' ? 'px-12 sm:px-6' : 'px-8 sm:px-6' : 'px-3 py-8 sm:px-6 sm:py-12'}`}>
        {previous ? <GridBlock block={block} /> : <Refined block={block} />}
      </main>
    );
  }
 if(block.id==='chart-16')return <GenerationMix/>
 if(block.group==='chart'&&block.category==='area-chart')return <AreaPanel block={block}/>
 if(block.group==='chart'&&block.category==='pie-chart')return <PieChartBlock block={block}/>
 if(block.group==='chart'&&block.category==='radial-chart')return <RadialChartBlock block={block}/>
 if(block.group==='chart'&&block.category==='slope-chart')return <SlopeChartBlock block={block}/>
 if(block.group==='chart'&&block.category==='sankey-chart')return <SankeyChartBlock block={block}/>
 if(block.group==='chart'&&block.category==='bar-chart')return <BarChartBlock block={block}/>
 if(block.group==='chart')return <ChartBlock block={block}/>
 if(block.group==='ai-agents')return block.category==='ai-chat'?<ChatBlock block={block}/>:block.category==='agent-activity'?<ActivityBlock block={block}/>:<UsageBlock block={block}/>
 if(block.category==='digital-twin')return <DigitalTwinBlock block={block}/>
 if((block.category==='billing'&&[2,5,8].includes(block.index))||(block.category==='users'&&[3,4].includes(block.index)))return <QueueBlock block={block}/>
 if(block.category==='files')return <FilesBlock/>
 if(block.category==='bookings')return <BookingBlock block={block}/>
 if(block.category==='travel'&&block.index===1)return <ItineraryBlock/>
 if(block.category==='analytics'&&block.index!==8)return <AnalyticsBlock block={block}/>
 if(block.category==='dev-ops'&&[0,1,2,3,4].includes(block.index))return <OpsBlock block={block}/>
 if(block.category==='agents'&&[1,2,4,6,8].includes(block.index))return <AgentOpsBlock block={block}/>
 if((block.category==='inventory'&&[3,6,8,9,10].includes(block.index))||(block.category==='users'&&block.index===1)||(block.category==='billing'&&block.index===3)||(block.category==='crm'&&[3,8].includes(block.index)))return <DetailBlock block={block}/>
 if(/Dashboard|Overview|Product Signals|Spend vs Budget|Travel Operator Home|Shop Activity|Agent Eval Report/.test(block.name))return <DashboardBlock block={block}/>
 if(/Permission|Tool Access Matrix/.test(block.name))return <PermissionBlock block={block}/>
 if(/CSV Import|Builder|Plan Change/.test(block.name))return <WizardBlock block={block}/>
 if(/Settings|Routing Policy|Connections|Feature Flags|SSO|Reorder Rules|Alert Rules|Prompt Editor/.test(block.name))return <SettingsBlock block={block}/>
 if(/Timeline|Access Audit/.test(block.name))return <TimelineBlock block={block}/>
 if(/Deal Board|Pipeline Workspace|Forecast Call/.test(block.name))return <BoardBlock block={block}/>
 if(/Plan Catalog|Tenant Billing/.test(block.name))return <PlansBlock block={block}/>
 const category=block.category==='billing'&&block.index===6?'filtering':block.category==='users'&&block.index===0?'columns':block.category==='inventory'&&block.index===2?'editing':block.category==='agents'&&block.index===1?'grouping':'base'
 return <GridBlock block={{...block,category}}/>
}
