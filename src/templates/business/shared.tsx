import userAvatar from './assets/commerce-3.jpg';
/* Shared template primitives and small data helpers intentionally share one module. */
/* eslint-disable react/only-export-components */
import { useState, type ReactNode } from 'react';
import { Search, Plus, Download, ChevronLeft, ChevronRight, X, Menu, LayoutDashboard, Users, Package, ShoppingBag, Settings, CalendarDays, ChartNoAxesCombined, FileText, Bell, Stethoscope, CircleCheck, Activity, Target, BriefcaseBusiness, Clock, Folder, Tag, Star, CreditCard, PanelLeftClose, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/reui/badge';
import { Frame, FramePanel, FrameHeader, FrameTitle, FrameDescription } from '@/components/reui/frame';
import { BusinessGrid } from './grid';
import { BusinessBars, BusinessArea } from './charts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
export { Button, Input, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Table, TableHeader, TableHead, TableRow, TableBody, TableCell, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Tabs, TabsList, TabsTrigger, toast };
export const icons = { Payments: CreditCard, Dashboard: LayoutDashboard, Deals: FileText, Products: Package, Billing: CreditCard, Users, Reports: ChartNoAxesCombined, Orders: ShoppingBag, Inventory: Package, Customers: Users, Categories: Folder, Promotions: Tag, Reviews: Star, Analytics: ChartNoAxesCombined, Settings, Approvals: CircleCheck, People: Users, Hiring: BriefcaseBusiness, Time: Clock, Today: CalendarDays, 'Activity Feed': Activity, 'Quick Stats': ChartNoAxesCombined, Attainment: Target, 'Quota Plan': FileText, Patients: Users, Appointments: CalendarDays, Staff: Stethoscope, Invoices: CreditCard, Calendar: CalendarDays, Pipeline: Target, Contacts: Users, Companies: BriefcaseBusiness, Forecast: ChartNoAxesCombined };
export function Mark() { return <span className="bt-mark" aria-hidden="true">∪<i /></span>; }
export function NavItems({ items, active, onSelect, atlas=false }: {
    items: string[];
    active: string;
    onSelect: (x: string) => void;
    atlas?: boolean;
}) { const [usersOpen,setUsersOpen]=useState(false); return <nav className="bt-nav">{items.map(item => { const Icon = icons[item as keyof typeof icons] ?? FileText; if(atlas&&item==='Users')return <div key={item} className="bt-user-nav"><Button variant="ghost" className="justify-start w-full" aria-expanded={usersOpen} onClick={()=>setUsersOpen(!usersOpen)}><Users/>Users<ChevronRight className={usersOpen?'ml-auto rotate-90':'ml-auto'}/></Button>{usersOpen&&<div className="bt-user-subnav">{['All Users','Roles & Permissions','Access Control','Audit Log'].map(name=><Button key={name} variant={active===name?'secondary':'ghost'} aria-current={active===name?'page':undefined} onClick={()=>{if(name==='All Users')onSelect(name)}}>{name}</Button>)}</div>}</div>; return <Button key={item} type="button" variant={active === item ? 'secondary' : 'ghost'} className="justify-start w-full" aria-current={active === item ? 'page' : undefined} onClick={() => onSelect(item)}><Icon />{item}</Button>; })}</nav>; }
export function Shell({ id, brand, active, setActive, items, children, aside, rail = false, top, footer }: {
    id: string;
    brand: string;
    active: string;
    setActive: (x: string) => void;
    items: string[];
    children: ReactNode;
    aside?: ReactNode;
    rail?: boolean;
    top?: ReactNode;
    footer?: ReactNode;
}) {
    const [mobile, setMobile] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [search, setSearch] = useState('');
    const nav = <><div className="bt-brand"><Mark /><strong>{brand}</strong><Button type="button" variant="ghost" size="icon-sm" aria-label="Collapse sidebar" onClick={() => setCollapsed(!collapsed)}><PanelLeftClose /></Button></div>{!aside && id !== 'atlas' && <label className="bt-search"><Search size={15}/><Input aria-label="Search navigation" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}/><kbd>⌘K</kbd></label>}{aside ?? <><p className="bt-nav-label">{id === 'atlas' ? 'Menu' : id === 'cohort' ? 'Workspace' : 'Store'}</p><NavItems atlas={id==='atlas'} items={items.filter(x => x.toLowerCase().includes(search.toLowerCase()))} active={active} onSelect={x => { setActive(x); setMobile(false); }}/>{!items.some(x => x.toLowerCase().includes(search.toLowerCase())) && <div className="bt-empty">No pages found.<Button variant="outline" onClick={() => setSearch('')}>Clear search</Button></div>}</>}<>{id === 'atlas' && <div className="bt-nav"><p className="text-xs text-muted-foreground mb-2">Favorites</p>{['Weekly revenue', 'Open deals', 'New signups', 'Low stock'].map((name, i) => <Button key={name} variant="ghost" className="justify-start" onClick={() => setActive(['Reports', 'Deals', 'Users', 'Products'][i])}><span className="bt-metric-dot" style={{ background: `var(--bt-series-${i})` }}/>{name}</Button>)}</div>}</>{id==='cohort'&&<div className="bt-nav bt-departments"><p className="text-xs text-muted-foreground mb-2">Headcount by department</p>{['Engineering','People','Sales','Customer Success','Design'].map((x,i)=><Button key={x} variant="ghost" className="justify-start" onClick={()=>setActive('People')}><span className="bt-metric-dot" style={{background:`var(--bt-series-${i})`}}/>{x}</Button>)}</div>}<div className="bt-sidebar-bottom">{footer}<Button type="button" variant="ghost" onClick={() => setActive('Settings')} className="w-full justify-start"><span className="bt-avatar">{id==='cohort'?'BD':<img src={userAvatar} alt="Nick Bold"/>}</span><span>{id === 'cohort' ? 'Bruno Duarte' : 'Nick Bold'}<small>{id === 'cohort' ? 'Cohort UK' : 'nick@reui.io'}</small></span></Button></div></>;
    return <div className={`bt-app bt-${id} ${rail ? 'bt-has-rail' : ''} ${collapsed ? 'bt-collapsed' : ''}`}>
 {rail && <div className="bt-icon-rail"><Mark />{items.map(item => { const Icon = icons[item as keyof typeof icons] ?? FileText; return <Button type="button" key={item} variant={active === item ? 'secondary' : 'ghost'} size="icon" aria-label={item} title={item} onClick={() => setActive(item)}><Icon /></Button>; })}<div className="bt-rail-end"><Button type="button" variant="ghost" size="icon" aria-label="Notifications" onClick={() => toast('You are all caught up')}><Bell /></Button><Button type="button" variant="ghost" size="icon" aria-label="Settings" onClick={() => setActive('Settings')}><Settings /></Button></div></div>}
 <aside className="bt-sidebar">{nav}</aside><div className="bt-main"><header className="bt-topbar"><Button type="button" variant="ghost" size="icon" className="bt-mobile-menu" aria-label="Open menu" onClick={() => setMobile(true)}><Menu /></Button>{collapsed && <Button variant="ghost" size="icon" aria-label="Expand sidebar" onClick={() => setCollapsed(false)}><Menu /></Button>}<span>{top ?? active}</span><div className="bt-topbar-right">{['surge','manifest'].includes(id)?<Button variant="outline" size="sm">◉ Store <Badge variant="warning-light">Attention</Badge></Button>:<Button type="button" variant="ghost" size="icon" aria-label="Notifications" onClick={() => toast('No new notifications')}><Bell /></Button>}</div></header><div className="bt-content">{children}</div></div>
 <Sheet open={mobile} onOpenChange={setMobile}><SheetContent side="left"><SheetTitle>{brand}</SheetTitle><SheetDescription>Workspace navigation</SheetDescription><NavItems atlas={id==='atlas'} items={items} active={active} onSelect={x => { setActive(x); setMobile(false); }}/></SheetContent></Sheet>
 </div>;
}
export function Heading({ title, description, action, onAction, date = 'May 12, 2026 - Jun 10, 2026', onExport }: {
    title: string;
    description?: string;
    action?: string;
    onAction?: () => void;
    date?: string;
    onExport?: () => void;
}) { return <div className="bt-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div><div className="bt-actions"><Button variant="outline" type="button" onClick={() => toast('Showing the current demo reporting period')}><CalendarDays />{date}</Button><Button variant="outline" type="button" onClick={onExport ?? (() => exportCsv('report', [['Metric', 'Value'], ['Revenue', '20000'], ['Orders', '33']]))}><Download />Export</Button>{action && <Button type="button" onClick={onAction}><Plus />{action}</Button>}</div></div>; }
export function exportCsv(name: string, rows: string[][]) { const blob = new Blob([rows.map(row => row.map(x => '"' + x.replaceAll('"', '""') + '"').join(',')).join('\n')], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name + '.csv'; a.click(); URL.revokeObjectURL(url); toast.success('CSV downloaded'); }
export function Panel({ title, description, children, action, className = '' }: {
    title: string;
    description?: string;
    children: ReactNode;
    action?: ReactNode;
    className?: string;
}) { return <Frame className={`bt-panel ${className}`}><FrameHeader><div className="bt-panel-heading"><div><FrameTitle>{title}</FrameTitle>{description && <FrameDescription>{description}</FrameDescription>}</div>{action}</div></FrameHeader><FramePanel>{children}</FramePanel></Frame>; }
export function Spark({ color = 'var(--bt-green)', index = 0 }: {
    color?: string;
    index?: number;
}) { const paths = ['M0 26 L10 20 L20 25 L30 9 L40 15 L50 8 L60 20 L70 13 L80 2', 'M0 22 L10 28 L20 15 L30 12 L40 18 L50 7 L60 17 L70 5 L80 10']; return <svg className="bt-spark" viewBox="0 0 80 35" aria-hidden="true"><path d={paths[index % 2]} fill="none" stroke={color} strokeWidth="1.5"/></svg>; }
export function Bars(props:{labels:string[];large?:boolean;multi?:boolean;values?:number[]}) {return <BusinessBars {...props}/>}
export function Area(props:{mono?:boolean}) {return <BusinessArea {...props}/>}
export function Period({ value, onChange }: {
    value: string;
    onChange: (v: string) => void;
}) { return <Tabs value={value} onValueChange={onChange}><TabsList>{['Week', 'Month', 'Year'].map(x => <TabsTrigger key={x} value={x}>{x}</TabsTrigger>)}</TabsList></Tabs>; }
export function RecordDialog({ title, open, onOpenChange, fields, onSave }: {
    title: string;
    open: boolean;
    onOpenChange: (v: boolean) => void;
    fields: {
        name: string;
        label: string;
        type?: string;
        value?: string;
    }[];
    onSave: (values: Record<string, string>) => void;
}) { return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Update your workspace with this record.</DialogDescription></DialogHeader><form className="bt-form" onSubmit={e => { e.preventDefault(); onSave(Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>); onOpenChange(false); }}>{fields.map(f => <label key={f.name}>{f.label}<Input name={f.name} aria-label={f.label} type={f.type ?? 'text'} required defaultValue={f.value ?? ''}/></label>)}<DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Save</Button></DialogFooter></form></DialogContent></Dialog>; }
export function DataTable({ columns, rows, query = '', onRow, onReset }: {
    columns: string[];
    rows: (string | ReactNode)[][];
    query?: string;
    onRow?: (i: number) => void;
    onReset?: () => void;
}) { const filtered=rows.map((row,i)=>({row,i})).filter(({row})=>row.some(c=>typeof c==='string'&&c.toLowerCase().includes(query.toLowerCase()))); return <><BusinessGrid headers={columns} rows={filtered.map(x=>x.row)} onRow={onRow?i=>onRow(filtered[i].i):undefined}/>{!filtered.length&&onReset&&<Button variant="outline" onClick={onReset}>Clear filters</Button>}</>; }

export function SettingsPage({ brand }: {
    brand: string;
}) { const [saved, setSaved] = useState(false); return <><Heading title="Settings" description="Manage your workspace preferences."/><Panel title="Workspace profile" description="Your team’s shared information."><form className="bt-form bt-settings" onSubmit={e => { e.preventDefault(); setSaved(true); toast.success('Settings saved'); }}><label>Workspace name<Input defaultValue={brand} required/></label><label>Contact email<Input defaultValue="hello@example.com" type="email" required/></label><label>Timezone<Input defaultValue="Asia/Shanghai" required/></label><Button type="submit">Save changes</Button>{saved && <p role="status">Your workspace settings have been updated.</p>}</form></Panel></>; }
export const allIcons = { Search, Plus, Download, ChevronLeft, ChevronRight, X, CalendarDays, ChevronDown };
