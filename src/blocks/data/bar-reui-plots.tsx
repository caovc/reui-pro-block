/** Adapted from the free REUI c-chart-1 / c-chart-2 / c-chart-3 / c-chart-12 examples.
 * Copyright (c) 2025 Keenthemes Inc. MIT (src/components/reui/REUI-LICENSE.txt).
 * Retains ChartContainer, accessible BarChart, Bar/Cell rendering, patterned fill,
 * rounded bars and ChartTooltipContent. Historical overlay and plan tapes are extensions.
 */
import { useId } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ReferenceDot, ReferenceLine, Rectangle, XAxis, YAxis, type BarShapeProps } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ReuiStripePattern } from './reui-free-chart-primitives'
import { barColors, useBarNarrow } from './bar-chart-utils'
export function TrainingBars({values,comparison,compare,max,metric,week,onWeek,grid,pattern,format}:{values:number[];comparison:number[];compare:string;max:number;metric:string;week:number;onWeek:(i:number)=>void;grid:boolean;pattern:boolean;format:(n:number)=>string}) {
  const id=useId().replaceAll(':',''),narrow=useBarNarrow()
  const rows=values.map((value,i)=>({week:`W${i+1}`,value,prior:comparison[i]}))
  return <div role="img" aria-label={`${metric} by training week`} data-reui-chart="c-chart-2 c-chart-3" className="h-[300px] w-full">
    <ChartContainer config={{value:{label:metric,color:barColors.purple},prior:{label:compare,color:'var(--border)'}}} className="h-full w-full aspect-auto">
      <BarChart accessibilityLayer data={rows} margin={{top:20,right:12,bottom:12,left:12}} barGap={-30}>
        <defs><ReuiStripePattern id={`${id}-neutral`} color="var(--muted-foreground)"/ ><ReuiStripePattern id={`${id}-active`} color={barColors.purple}/></defs>
        {grid&&<CartesianGrid vertical={false} stroke="var(--border)"/>}
        <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} interval={narrow?1:0}/>
        <YAxis domain={[0,max]} tickLine={false} axisLine={false} width={40} tickFormatter={v=>metric==='Time'?`${v/60}h`:`${v}km`}/>
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" className="min-w-40 gap-2.5" formatter={(value,name)=><div className="flex w-full items-center justify-between gap-2"><span className="text-muted-foreground">{name==='value'?metric:compare}</span><span className="font-semibold">{format(Number(value))}</span></div>}/>}/>
        {compare==='Last Block'&&<Bar dataKey="prior" fill="var(--border)" fillOpacity={.6} radius={[4,4,4,4]} barSize={34} isAnimationActive={false}/>}
        <Bar dataKey="value" strokeWidth={1} radius={[4,4,4,4]} barSize={34} isAnimationActive={false} onMouseEnter={(_,i)=>onWeek(i)} onClick={(_,i)=>onWeek(i)}>
          {rows.map((r,i)=><Cell key={r.week} fill={pattern?`url(#${id}-${i===week?'active':'neutral'})`:i===week?barColors.purple:'var(--muted)'} stroke={i===week?barColors.purple:'var(--border)'}/>)}
        </Bar>
        {compare==='Training Plan'&&rows.map((r,i)=><ReferenceDot key={r.week} x={r.week} y={r.prior} r={0} ifOverflow="extendDomain" shape={p=><g aria-label={`Week ${i+1} plan ${format(r.prior)}`}><path d={`M${Number(p.cx)-21} ${p.cy}H${Number(p.cx)+21}`} stroke={r.value>=r.prior?barColors.green:barColors.yellow} strokeWidth={2} strokeDasharray={r.value>=r.prior?'8 5':undefined}/></g>}/>)}
      </BarChart>
    </ChartContainer>
  </div>
}

// c-chart-1 standard columns + c-chart-12 horizontal bars. The domain, track
// background, stock-health colors and keyboard focus are application extensions.
export function InventoryBars({rows,onFocus}:{rows:{name:string;index:number;value:number;days:number;color:string}[];onFocus:(index:number|null)=>void}) {
  const id=useId().replaceAll(':',''),narrow=useBarNarrow()
  return <div role={narrow?'group':'img'} aria-label="Inventory velocity by category" data-reui-chart="c-chart-1 c-chart-12" className="h-[335px] w-full">
    <ChartContainer config={{value:{label:'Units per day',color:barColors.blue}}} className="size-full aspect-auto">
      <BarChart accessibilityLayer data={rows} layout={narrow?'vertical':'horizontal'} margin={narrow?{left:4,right:20,top:2,bottom:2}:{left:12,right:12,top:8,bottom:12}} barCategoryGap="30%">
        <defs><ReuiStripePattern id={`${id}-track`} color="var(--muted-foreground)" opacity={.2}/></defs>
        {narrow?<><YAxis type="category" dataKey="name" tickLine={false} tickMargin={10} axisLine={false} width={86} interval={0}/><XAxis type="number" tickLine={false} axisLine={false} domain={[0,1000]} hide/></>:<><XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} interval={0} tick={{fontSize:11}}/><YAxis domain={[0,1000]} tickLine={false} axisLine={false} ticks={[0,250,500,750,1000]} width={40}/></>}
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" className="min-w-40 gap-2.5" formatter={(value)=><div className="flex w-full items-center justify-between gap-2"><span className="text-muted-foreground">Units per day</span><span className="font-semibold">{Number(value).toLocaleString()}</span></div>}/>}/>
        <Bar dataKey="value" radius={narrow?4:15} barSize={narrow?8:30} background={{fill:`url(#${id}-track)`,radius:narrow?4:15}} isAnimationActive={false} shape={(props:BarShapeProps)=>{
          const row=rows[props.index]
          return <Rectangle x={props.x} y={props.y} width={props.width} height={props.height} fill={row.color} radius={narrow?4:15} role="button" tabIndex={0} aria-label={`${row.name}: ${row.value} units per day, ${row.days} days of supply`} onMouseEnter={()=>onFocus(row.index)} onMouseLeave={()=>onFocus(null)} onClick={()=>onFocus(row.index)} onFocus={()=>onFocus(row.index)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onFocus(row.index)}}}/>
        }}/>
      </BarChart>
    </ChartContainer>
  </div>
}

// c-chart-12's actual dual horizontal Bar composition. Signed domains and a
// target line extend it into diverging transit lanes; labels and row focus are local.
export function TransitBars({rows,metric,grid,labels,focus,onFocus}:{rows:{name:string;short:string;index:number;road:number;rail:number}[];metric:string;grid:boolean;labels:boolean;focus:number|null;onFocus:(i:number|null)=>void}) {
  const narrow=useBarNarrow(),gap=(v:number)=>`${v<0?'−':'+'}${Math.abs(v).toFixed(1)} d`
  const lane=(props:BarShapeProps,color:string,key:'road'|'rail')=>{
    const row=rows[props.index];if(!row)return <g/>
    const value=row[key],end=props.width<0?props.x+props.width:value>=0?props.x+props.width:props.x
    return <g><Rectangle x={props.x} y={props.y} width={props.width} height={props.height} radius={6} fill={color} opacity={.85}/>{labels&&<text x={end+(value>=0?5:-5)} y={props.y+props.height/2+3.5} fill="var(--muted-foreground)" textAnchor={value>=0?'start':'end'} fontSize={11}>{gap(value)}</text>}</g>
  }
  return <div className="h-[355px] w-full" role="img" aria-label={`${metric} road and rail gaps against target`} data-reui-chart="c-chart-12">
    <ChartContainer config={{road:{label:'Road freight',color:barColors.blue},rail:{label:'Rail freight',color:'#efb125'}}} className="size-full aspect-auto">
      <BarChart accessibilityLayer data={rows} layout="vertical" barGap={4} margin={{left:0,right:35,top:35,bottom:8}}>
        {grid&&<CartesianGrid horizontal={false} stroke="var(--border)"/>}
        <YAxis type="category" dataKey="name" tickLine={false} tickMargin={10} axisLine={false} width={narrow?58:136} tickFormatter={name=>narrow?rows.find(row=>row.name===name)?.short??name:name} tick={{fontSize:12}}/>
        <XAxis type="number" domain={[-4.8,5.1]} ticks={narrow?[-4,0,4]:[-4,-2,0,2,4]} tickLine={false} axisLine={false} tickMargin={10} tickFormatter={value=>value?`${value>0?'+':''}${value} d`:'0'}/>
        <ReferenceArea x1={0} x2={5.1} fill="var(--destructive)" fillOpacity={.025} stroke="none"/>
        <ReferenceLine x={0} stroke="var(--muted-foreground)" strokeOpacity={.45} label={{value:'Target',position:'top',fill:'var(--muted-foreground)',fontSize:12}}/>
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" className="min-w-40 gap-2.5" formatter={(value,name)=><div className="flex w-full items-center justify-between gap-2"><span className="text-muted-foreground">{name==='road'?'Road freight':'Rail freight'}</span><span className="font-semibold">{gap(Number(value))}</span></div>}/>}/>
        <Bar dataKey="road" fill={barColors.blue} radius={6} barSize={12} isAnimationActive={false} shape={(props:BarShapeProps)=>{
          const row=rows[props.index];if(!row)return <g/>
          const background=props.background
          return <g role="button" tabIndex={0} aria-label={`${row.name}: road ${gap(row.road)}, rail ${gap(row.rail)}`} onPointerEnter={()=>onFocus(row.index)} onPointerLeave={()=>onFocus(null)} onClick={()=>onFocus(row.index)} onFocus={()=>onFocus(row.index)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onFocus(row.index)}}}><Rectangle x={background?.x??0} y={props.y-3} width={background?.width??0} height={34} fill={focus===row.index?'var(--muted)':'transparent'}/>{lane(props,barColors.blue,'road')}</g>
        }}/>
        <Bar dataKey="rail" fill="#efb125" radius={6} barSize={12} isAnimationActive={false} onMouseEnter={(_,i)=>onFocus(rows[i].index)} onMouseLeave={()=>onFocus(null)} onClick={(_,i)=>onFocus(rows[i].index)} shape={(props:BarShapeProps)=>lane(props,'#efb125','rail')}/>
      </BarChart>
    </ChartContainer>
  </div>
}
