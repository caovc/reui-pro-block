import { useMemo, useState, type ReactNode } from 'react'
import { Subscribe, useTable, type ColumnDef, type Row, type ReactTable } from '@tanstack/react-table'
import { DataGrid, DataGridContainer, dataGridFeatures, type DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { DataGridTable, DataGridTableRowPin, DataGridTableRowSelectAll } from '@/components/reui/data-grid/data-grid-table'
import { DataGridScrollArea } from '@/components/reui/data-grid/data-grid-scroll-area'
import { DataGridColumnHeader } from '@/components/reui/data-grid/data-grid-column-header'
import { DataGridColumnVisibility } from '@/components/reui/data-grid/data-grid-column-visibility'
import { DataGridPagination } from '@/components/reui/data-grid/data-grid-pagination'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronLeft, ChevronRight, Columns3, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type GridTable<T extends object> = ReactTable<DataGridFeatures,T>
export type GridRow<T extends object> = Row<DataGridFeatures,T>
export type GridColumn<T extends object> = { id:string; title?:string; value?:(data:T)=>unknown; cell:(data:T,row:GridRow<T>)=>ReactNode; width?:number; minWidth?:number; align?:'right'|'center'; sortable?:boolean; hideable?:boolean; cellClassName?:string; headerClassName?:string;onRemove?:()=>void }
export function useGridTable<T extends {id:number}>({data,fields,pageSize=5,filter,initialPinned=[]}:{data:T[];fields:GridColumn<T>[];pageSize?:number;filter:(data:T)=>boolean;initialPinned?:number[]}){
  // The full raw dataset is handed to TanStack. Its registered filtered, sorted
  // and paginated row models produce every rendered row; no manual slice/sort.
  const columns=useMemo<ColumnDef<DataGridFeatures,T>[]>(()=>fields.map(field=>({
    id:field.id,
    accessorFn:field.value??((record:T)=>(record as Record<string,unknown>)[field.id]),
    header:({column})=>field.id==='_select'?<DataGridTableRowSelectAll/>:field.id.startsWith('_')?null:<div className="flex items-center gap-1"><DataGridColumnHeader column={column} title={field.title??field.id} visibility/>{field.onRemove&&<Button size="icon-xs" variant="ghost" aria-label={`Remove ${field.id} column`} onClick={field.onRemove}><X/></Button>}</div>,
    cell:({row})=>field.cell(row.original,row),
    size:field.width??150,minSize:field.minWidth??60,
    enableSorting:field.sortable!==false&&!field.id.startsWith('_'),
    enableHiding:field.hideable!==false&&!field.id.startsWith('_'),
    enableGlobalFilter:!field.id.startsWith('_'),
    meta:{headerTitle:field.title??field.id,headerClassName:cn(field.align==='right'&&'text-right',field.align==='center'&&'text-center',field.headerClassName),cellClassName:cn(field.align==='right'&&'text-right tabular-nums',field.align==='center'&&'text-center',field.cellClassName)},
  })),[fields])
  const table=useTable({
    features:dataGridFeatures,data,columns,
    getRowId:record=>String(record.id),
    initialState:{pagination:{pageIndex:0,pageSize},rowPinning:{top:initialPinned.map(String),bottom:[]}},
    state:{globalFilter:filter},
    getColumnCanGlobalFilter:()=>true,
    globalFilterFn:(row,_column,rule)=>typeof rule!=='function'||rule(row.original),
    columnResizeMode:'onChange',
  })
  return table
}
export function selectionColumn<T extends {id:number;name:string}>():GridColumn<T>{return{id:'_select',width:38,minWidth:38,hideable:false,sortable:false,cell:(record,row)=><Subscribe source={row.table.atoms.rowSelection}>{()=> <Checkbox aria-label={`Select ${record.name}`} checked={row.getIsSelected()} onCheckedChange={value=>row.toggleSelected(!!value)}/>}</Subscribe>}}
export function pinColumn<T extends object>():GridColumn<T>{return{id:'_pin',width:38,minWidth:38,hideable:false,sortable:false,cell:(_record,row)=><DataGridTableRowPin row={row}/>}}
export function NativeGrid<T extends object>({table,children,density='Comfortable',resizable=false,cellBorder=false,className,emptyMessage='No records match your filters.'}:{table:GridTable<T>;children:ReactNode;density?:string;resizable?:boolean;cellBorder?:boolean;className?:string;emptyMessage?:string}){return <DataGrid table={table} recordCount={table.getFilteredRowModel().rows.length} emptyMessage={emptyMessage} tableLayout={{dense:density==='Compact',columnsResizable:resizable,columnsResizeMode:'onChange',columnsVisibility:true,columnsMovable:true,columnsPinnable:true,rowsPinnable:true,cellBorder,rowBorder:true,width:resizable?'fixed':'auto'}} tableClassNames={{base:cn('min-w-[800px] text-sm [&_th]:h-8 [&_th]:px-3 [&_td]:px-3 [&_td]:py-1.5',className),headerRow:'h-8',bodyRow:density==='Spacious'?'h-20':undefined}}>{children}</DataGrid>}
export function NativeTable({footer}:{footer?:ReactNode}){return <DataGridContainer className="rounded-none border-0"><DataGridScrollArea orientation="horizontal"><DataGridTable footerContent={footer}/></DataGridScrollArea></DataGridContainer>}
export function NativePager({noun=''}:{noun?:string}){return <DataGridPagination className="flex-wrap gap-3 border-t px-3 py-2" sizes={[5,6,8,10,20]} info={`{from} - {to} of {count}${noun?' '+noun:''}`} previousPageLabel="Go to previous page" nextPageLabel="Go to next page"/>}
export function NativeColumns<T extends object>({table,label='Columns'}:{table:GridTable<T>;label?:string}){return <DataGridColumnVisibility table={table} trigger={<Button size="sm" variant="outline"><Columns3/>{label}</Button>}/>}
export function NativeSettings<T extends object>({table,density,setDensity,resizable,setResizable}:{table:GridTable<T>;density:string;setDensity:(v:string)=>void;resizable:boolean;setResizable:(v:boolean)=>void}){return <Popover><PopoverTrigger asChild><Button size="sm" variant="outline"><SlidersHorizontal/>Settings</Button></PopoverTrigger><PopoverContent align="end" className="w-72"><strong className="text-xs">Table settings</strong><p className="text-xs text-muted-foreground">Density</p><div className="flex rounded-lg border p-0.5">{['Compact','Comfortable','Spacious'].map(value=><Button key={value} size="sm" className="flex-1 px-1 text-xs" variant={density===value?'secondary':'ghost'} onClick={()=>setDensity(value)}>{value}</Button>)}</div><label className="flex cursor-pointer items-center justify-between border-b py-2 text-xs">Resizable columns<Checkbox checked={resizable} onCheckedChange={v=>setResizable(!!v)}/></label><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Display columns</span><NativeColumns table={table}/></div>{table.getAllLeafColumns().filter(column=>column.getCanHide()).map(column=>{const order=[...table.state.columnOrder,...table.getAllLeafColumns().map(c=>c.id).filter(id=>!table.state.columnOrder.includes(id))];const index=order.indexOf(column.id);const move=(direction:number)=>{const next=[...order];const target=index+direction;if(target<0||target>=next.length||next[target].startsWith('_'))return;[next[index],next[target]]=[next[target],next[index]];table.setColumnOrder(next)};return <div key={column.id} className="flex items-center gap-2 py-1 text-xs"><label className="flex flex-1 cursor-pointer items-center gap-2"><Checkbox checked={column.getIsVisible()} onCheckedChange={v=>column.toggleVisibility(!!v)}/>{column.columnDef.meta?.headerTitle??column.id}</label><Button size="icon-xs" variant="ghost" aria-label={`Move ${column.id} column left`} disabled={index===0||order[index-1]?.startsWith('_')} onClick={()=>move(-1)}><ChevronLeft/></Button><Button size="icon-xs" variant="ghost" aria-label={`Move ${column.id} column right`} disabled={index===order.length-1} onClick={()=>move(1)}><ChevronRight/></Button></div>})}</PopoverContent></Popover>}
export function useGridDisplay(initialDensity='Comfortable'){const[density,setDensity]=useState(initialDensity);const[resizable,setResizable]=useState(false);return{density,setDensity,resizable,setResizable}}
