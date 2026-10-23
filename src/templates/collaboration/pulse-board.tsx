import { useState } from 'react';
import { Kanban, KanbanBoard, KanbanColumn, KanbanColumnContent, KanbanItem, KanbanItemHandle } from '@/components/reui/kanban';
import { Badge } from '@/components/reui/badge';
import { Clock, Plus } from 'lucide-react';
import { Avatar, Button } from './shared';
const groups=[
['New',[
['TCK-5012','High','Checkout fails with a card error the bank cannot see','Aisha Bello','Atlas Freight','Priya Patel','3h 40m'],
['TCK-5019','Normal','Push notifications stopped after the 4.2 release','Ryan Mercer','Orbit Software','Diego Ramos','5h 10m'],
['TCK-5024','High','App signs staff out mid-shift on iOS 19','Hana Kim','Meridian Retail','Sana Qureshi','2h 15m']]],
['Needs Reply',[
['TCK-5031','High','Offline orders never sync once phone reconnects','Marcus Hale','Apex Manufacturing','Diego Ramos','1h 40m'],
['TCK-5003','Low','Weekly digest email arrives with empty ticket list','Priya Raman','Brightwave Media','Sana Qureshi','6h 05m'],
['TCK-4988','Normal','Bulk import maps wrong column to customer email','Tom Whitfield','Cedar & Co','Diego Ramos','1h 25m'],
['TCK-4995','High','Invoice total still wrong after plan downgrade','David Okafor','Vertex Health','Priya Patel','48m']]],
['Escalated',[
['TCK-4966','High','Webhook retries stop after first 5xx from endpoint','Carla Ferreira','Quanta Devices','Jamal Reid','1h 05m'],
['TCK-4960','Urgent','Data export failed on 3 consecutive nightly runs','Elena Sokolova','Cobalt','Jamal Reid','36m'],
['TCK-4971','High','Search omits projects migrated in last 24 hours','Ben Travers','Ridgeline','Sana Qureshi','2h 15m']]],
['Waiting Customer',[
['TCK-5038','Normal','Barcode scanner opens camera but never reads a code','Maya Chen','Northwind','Diego Ramos','Paused'],
['TCK-4937','Low','Maintenance window needs a replacement API key','Omar Ali','Acme','Priya Patel','Paused'],
['TCK-4944','Normal','Waiting for customer to approve the allowlist','Ella Gray','Harbor','Sana Qureshi','Paused']]],
['SLA Risk',[
['TCK-4979','High','Refund still not visible after three business days','David Okafor','Vertex Health','Priya Patel','18m'],
['TCK-4972','Urgent','Admins locked out after enabling SSO','Ben Travers','Ridgeline','Jamal Reid','12m'],
['TCK-4976','High','First response target missed on account recovery','Ryan Mercer','Orbit Software','Sana Qureshi','Overdue']]],
['Resolved',[
['TCK-4870','Normal','Seat count was wrong after workspace merge','Hana Kim','Meridian Retail','Priya Patel','Resolved'],
['TCK-4881','Low','Password reset emails landing in spam','Tom Whitfield','Cedar & Co','Diego Ramos','Resolved']]],
] as [string,string[][]][];
export function PulseBoard({query,onOpen,onCreate}:{query:string,onOpen:(row:string[],stage:string)=>void,onCreate:()=>void}){const [columns,setColumns]=useState<Record<string,string[][]>>(()=>Object.fromEntries(groups));return <Kanban value={columns} onValueChange={setColumns} getItemValue={row=>row[0]}><KanbanBoard className="ct-board ct-pulse-board">{Object.entries(columns).map(([stage,rows])=><KanbanColumn value={stage} className="ct-board-col" key={stage}><h3><span>{stage} <small className="ct-muted">{rows.length}</small></span></h3><KanbanColumnContent value={stage}>{rows.filter(r=>r.join(' ').toLowerCase().includes(query.toLowerCase())).map(r=><KanbanItem value={r[0]} key={r[0]}><KanbanItemHandle asChild><button className={'ct-ticket-card '+(r[1]==='Urgent'?'urgent':r[1]==='High'?'high':'')} onClick={()=>onOpen(r,stage)}><span className="ct-between"><small className="ct-muted">{r[0]}</small><Badge variant="outline">{r[1]}</Badge></span><strong>{r[2]}</strong><small>{r[3]} at {r[4]}</small><footer><span className="ct-person"><Avatar name={r[5]}/>{r[5]}</span><Badge variant={r[1]==='Urgent'?'destructive-light':r[1]==='High'?'warning-light':'info-light'}><Clock size={12}/>{r[6]}</Badge></footer></button></KanbanItemHandle></KanbanItem>)}</KanbanColumnContent><Button variant="ghost" className="ct-add-ticket" onClick={onCreate}><Plus/>Add ticket</Button></KanbanColumn>)}</KanbanBoard></Kanban>}
