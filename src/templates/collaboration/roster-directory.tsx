import { useState } from 'react';
import { Frame, FrameHeader, FramePanel, FrameTitle, FrameDescription } from '@/components/reui/frame';
import { Badge } from '@/components/reui/badge';
import { ReferenceGrid } from './reference-grid';
import { Avatar, Button, Input, Export } from './shared';
import { ChevronDown, ChevronRight, Filter, Settings2 } from 'lucide-react';
const data=[
['Isabel Ferreira','Founder & CEO','People','London','7 of 20','5','7 years','15 Jan 2019'],
['Amara Okafor','VP Engineering','Engineering','London','2 of 4','1','5 years','15 Mar 2021'],
['Hannah Weber','Head of Product','Product','Berlin','2 of 3','1','4 years','2 Aug 2021'],
['Elena Petrova','Sales Director','Sales','Amsterdam','2 of 2','1','5 years','16 Nov 2020'],
['Aisha Rahman','Marketing Manager','Marketing','Dubai','1 of 1','—','3 years','6 Feb 2023'],
['Grace Adeyemi','CS Lead','Customer Success','Lagos','1 of 1','1','4 years','20 Jun 2022'],
['Bruno Duarte','People Partner','People','Lisbon','1 of 1','—','4 years','27 Sep 2021'],
['Ingrid Larsen','Finance Manager','Finance','Oslo','1 of 1','1','3 years','14 Nov 2022'],
];
export function RosterDirectory({query,setQuery,onOpen,extras=[]}:{query:string,setQuery:(v:string)=>void,onOpen:(v:string[])=>void,extras?:string[][]}){const [collapsed,setCollapsed]=useState(false);const [attention,setAttention]=useState(false);const [compact,setCompact]=useState(false);const displayed=[...extras.filter(p=>p[2]==='New team member'||p[2]==='Candidate').map(p=>[p[0],p[2],p[1],p[3],'0','—','New','Today']),...data];const rows=displayed.map((values,i)=>({id:String(i),values})).filter(r=>(!collapsed||r.id==='0')&&(!attention||['2','4','6'].includes(r.id))&&r.values.join(' ').toLowerCase().includes(query.toLowerCase()));return <Frame className={compact?'ct-directory compact':'ct-directory'}><FrameHeader><div className="ct-between"><div><FrameTitle>Reporting Lines</FrameTitle><FrameDescription>Roster UK · 30 Jul 2026</FrameDescription></div><Export rows={data} name="reporting-lines"/></div><div className="ct-directory-metrics">{[['Headcount','21'],['Layers','4'],['Avg Span','2.0'],['Open Roles','5']].map(([label,value])=><span key={label}>{label}<b>{value}</b></span>)}</div></FrameHeader><FramePanel><div className="ct-toolbar mb-4"><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search people…"/><span className="ct-subtle">Depth</span>{['Collapse','1','2','All'].map(v=><Button key={v} size="sm" variant={(collapsed&&v==='Collapse')||(!collapsed&&v==='All')?'secondary':'ghost'} onClick={()=>setCollapsed(v==='Collapse')}>{v}</Button>)}<div className="ct-grow"/><Button variant={attention?'secondary':'outline'} onClick={()=>setAttention(!attention)}><Filter/>Filter</Button><Button variant="outline" onClick={()=>setCompact(!compact)}><Settings2/>Display</Button></div><ReferenceGrid rows={rows} onRowClick={r=>onOpen([r.values[0],r.values[2],r.values[1],r.values[3],'Full-time'])} columns={[
{id:'person',title:'Person',value:r=>r.values[0],render:r=><div className="ct-person" style={{paddingLeft:r.id==='0'?0:24}}><button aria-label={'Expand '+r.values[0]} onClick={e=>{e.stopPropagation();setCollapsed(!collapsed)}}>{collapsed?<ChevronRight size={14}/>:<ChevronDown size={14}/>}</button><Avatar name={r.values[0]}/><span><b>{r.values[0]}</b><small>{r.values[1]}</small></span></div>},
{id:'department',title:'Department',value:r=>r.values[2],render:r=><Badge variant="outline">{r.values[2]}</Badge>},
{id:'location',title:'Location',value:r=>r.values[3],render:r=>r.values[3]},
{id:'reports',title:'Reports',value:r=>r.values[4],render:r=>r.values[4]},
{id:'roles',title:'Open Roles',value:r=>r.values[5],render:r=>r.values[5]},
{id:'tenure',title:'Tenure',value:r=>r.values[6],render:r=><>{r.values[6]}<small className="block ct-muted">{r.values[7]}</small></>},
{id:'status',title:'Status',value:()=>1,render:()=><Badge variant="success-light">Active</Badge>}
]}/><footer className="ct-directory-footer">Roster UK <span>21 people</span><span>5 open roles</span><span>3 need attention</span></footer></FramePanel></Frame>}
