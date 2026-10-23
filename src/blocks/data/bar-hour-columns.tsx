/** Free REUI c-chart-1/2/3/4 composition, extended for stacked outcome domains.
 * Copyright (c) 2025 Keenthemes Inc. MIT. See components/reui/REUI-LICENSE.txt.
 * Plot scales, accessible BarChart, grid, axes, Bar/Rectangle and tooltip reuse
 * the free examples. Full-bucket hit targets, brush, caps and markers extend it.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Rectangle, XAxis, YAxis, type BarShapeProps } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Hatch } from './bar-primitives'
import { ReuiDotPattern } from './reui-free-chart-primitives'
import { useBarNarrow } from './bar-chart-utils'
export type HourColumn={label:string;segments:number[];note?:string;colors?:string[]}
export function HourColumns({label,data,colors,seriesNames,max,tickValues,format=(v:number)=>String(Math.round(v)),ghost=false,pattern=false,phaseTextures=false,caps=false,rounded=true,grid=true,range,onRange,onSelect,onActive,underlay,chartLayers,markers=[]}:{label:string;data:HourColumn[];colors:string[];seriesNames?:string[];max:number;tickValues?:number[];format?:(v:number)=>string;ghost?:boolean;pattern?:boolean;phaseTextures?:boolean;caps?:boolean;rounded?:boolean;grid?:boolean;range?:[number,number]|null;onRange?:(v:[number,number]|null)=>void;onSelect?:(index:number)=>void;onActive?:(index:number)=>void;underlay?:ReactNode;chartLayers?:ReactNode;markers?:number[]}) {
  const [active,setActive]=useState<number|null>(null),[drag,setDrag]=useState<number|null>(null)
  const id=useId().replaceAll(':',''),narrow=useBarNarrow(),plot=useRef<HTMLDivElement>(null)
  const [size,setSize]=useState({width:1000,height:355})
  useEffect(()=>{const el=plot.current;if(!el)return;const observer=new ResizeObserver(entries=>{const r=entries[0].contentRect;setSize({width:r.width,height:r.height})});observer.observe(el);return()=>observer.disconnect()},[])
  const sx=size.width/1000,sy=size.height/355,step=920/data.length,width=Math.min(40,step*.58)
  const selected=range?[Math.min(...range),Math.max(...range)]:null
  const choose=(i:number)=>{setActive(i);onActive?.(i)}
  const point=active===null?null:data[active]
  const rows=data.map((row,index)=>({...Object.fromEntries(colors.map((_,k)=>[`part${k}`,row.segments[k]??0])),index,hit:max}))
  const config=Object.fromEntries(colors.map((color,k)=>[`part${k}`,{label:seriesNames?.[k]??`Part ${k+1}`,color}]))
  const patternId=(i:number,k:number)=>`${id}-${data[i].colors?`custom-${i}-${k}`:`hatch-${k}`}`
  return <div role="application" tabIndex={0} aria-label={label} className="outline-offset-[-2px]" onKeyDown={event=>{
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();choose(((active??(event.key==='ArrowRight'?-1:1))+(event.key==='ArrowRight'?1:data.length-1))%data.length)}
    else if(event.key==='Enter'||event.key===' '){event.preventDefault();const index=active??data.length-1;if(onRange)onRange(event.shiftKey&&range?[range[0],index]:[index,index]);else onSelect?.(index)}
    else if(event.key==='Escape'){setActive(null);onRange?.(null)}
  }}>
    <div ref={plot} role="img" aria-label={label} className="relative h-[290px] w-full sm:h-[330px]" data-reui-chart="c-chart-1 c-chart-2 c-chart-3 c-chart-4" onPointerMove={event=>{
      if(drag===null)return;const r=event.currentTarget.getBoundingClientRect();const index=Math.max(0,Math.min(data.length-1,Math.floor(((event.clientX-r.left)/r.width*1000-55)/step)));choose(index);onRange?.([drag,index])
    }} onPointerUp={event=>{if(drag!==null){event.currentTarget.releasePointerCapture(event.pointerId);setDrag(null)}}}>
      <svg className={`pointer-events-none absolute inset-0 size-full ${narrow?'[&_text]:text-[28px]':''}`} viewBox="0 0 1000 355" preserveAspectRatio="none" aria-hidden="true">{underlay}{selected&&<rect x={55+selected[0]*step} y="26" width={(selected[1]-selected[0]+1)*step} height="280" fill="var(--primary)" opacity=".06"/>}</svg>
      <ChartContainer config={config} className="absolute inset-0 size-full aspect-auto">
        <BarChart accessibilityLayer data={rows} margin={{top:35*sy,right:24*sx,bottom:25*sy,left:narrow?4:12*sx}} barGap={-width*sx}>
          <defs><Hatch id={`${id}-ghost`} color="var(--muted-foreground)" opacity={.12}/>{colors.map((color,k)=>phaseTextures&&k===0?<ReuiDotPattern key={k} id={`${id}-hatch-${k}`} color={color}/>:<Hatch key={k} id={`${id}-hatch-${k}`} color={color} opacity={.5}/>)}{data.flatMap((row,i)=>(row.colors??[]).map((color,k)=>phaseTextures&&k===0?<ReuiDotPattern key={`${i}-${k}`} id={`${id}-custom-${i}-${k}`} color={color}/>:<Hatch key={`${i}-${k}`} id={`${id}-custom-${i}-${k}`} color={color} opacity={.5}/>))}</defs>
          {grid&&<CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={.6}/>}
          <XAxis type="category" dataKey="index" tickLine={false} axisLine={false} height={30*sy} tickMargin={9*sy} ticks={rows.filter((_,i)=>i%Math.max(1,Math.ceil(data.length/(narrow?4:7)))===0).map(row=>row.index)} tickFormatter={i=>data[Number(i)]?.label??''} tick={{fontSize:narrow?10:12}}/>
          <YAxis type="number" domain={[0,max]} allowDataOverflow tickLine={false} axisLine={false} width={narrow?26:40*sx} tickMargin={narrow?3:8*sx} tick={{fontSize:narrow?10:12}} ticks={tickValues??[0,max/3,max*2/3,max]} tickFormatter={format}/>
          {chartLayers}
          <ChartTooltip cursor={false} content={<ChartTooltipContent className="min-w-40 gap-2.5" labelFormatter={(_,payload)=>data[Number(payload?.[0]?.payload?.index)]?.label??''} formatter={(value,name)=>name==='hit'?null:<div className="flex w-full items-center justify-between gap-2"><span className="text-muted-foreground">{config[String(name)]?.label??name}</span><span className="font-semibold">{format(Number(value))}</span></div>}/>}/>
          {colors.map((color,k)=><Bar key={k} dataKey={`part${k}`} stackId="outcomes" barSize={width*sx} fill={color} isAnimationActive={false} background={ghost&&k===0?{fill:`url(#${id}-ghost)`,radius:rounded?width*sx/2:2}:undefined} shape={(props:BarShapeProps)=>{
            const i=props.index,row=data[i];if(!row)return <g/>;const fill=row.colors?.[k]??color,radius=rounded?Math.min(3,props.height/2):0
            return <g><Rectangle x={props.x} y={props.y} width={props.width} height={props.height} radius={radius} fill={fill} opacity={caps?.17:pattern?.15:1}/>{pattern&&<Rectangle x={props.x} y={props.y} width={props.width} height={props.height} radius={radius} fill={`url(#${patternId(i,k)})`}/>} {caps&&<Rectangle x={props.x} y={props.y} width={props.width} height={Math.min(3,props.height)} radius={1} fill={fill}/>}</g>
          }}/>) }
          <Bar dataKey="hit" tooltipType="none" fill="transparent" barSize={width*sx} isAnimationActive={false} shape={(props:BarShapeProps)=>{
            const i=props.index,row=data[i];if(!row)return <g/>
            return <Rectangle x={props.x} y={props.y} width={props.width} height={props.height} fill={active===i?'var(--muted)':'transparent'} fillOpacity={.16} role="button" tabIndex={-1} aria-label={`${row.label}: ${format(row.segments.reduce((sum,n)=>sum+n,0))}${row.note?`. ${row.note}`:''}`} style={{cursor:onRange?'crosshair':'pointer'}} onPointerEnter={()=>choose(i)} onPointerDown={event=>{if(onRange){event.preventDefault();setDrag(i);choose(i);onRange([i,i]);plot.current?.setPointerCapture(event.pointerId)}}} onClick={()=>{choose(i);if(!onRange)onSelect?.(i)}}/>
          }}/>
        </BarChart>
      </ChartContainer>
      <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 1000 355" preserveAspectRatio="none" aria-hidden="true">{markers.map(i=>{const row=data[i],x=55+i*step+step/2,y=300-row.segments.reduce((sum,n)=>sum+n,0)/max*265;return <g key={i}><path d={`M${x-4} ${y-9}h8l-4 6Z`} fill="var(--foreground)"/></g>})}</svg>
      {markers.filter(i=>data[i].note?.startsWith('Timeout')).map(i=>{const x=55+i*step+step/2,y=300-data[i].segments.reduce((sum,n)=>sum+n,0)/max*265;return <span key={i} className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap text-[10px] text-muted-foreground" style={{left:`${x/10}%`,top:`${(y-13)/355*100}%`}}>Timeout burn</span>})}
    </div>
    {point&&<div role="status" className="mx-4 mb-3 flex flex-wrap items-center gap-2 rounded-md border bg-muted/15 px-3 py-2 text-xs"><strong className="font-medium">{point.label}</strong><span>{format(point.segments.reduce((sum,n)=>sum+n,0))}</span>{point.note&&<span className="text-muted-foreground">{point.note}</span>}{selected&&<span className="ml-auto">Selected {selected[1]-selected[0]+1} buckets</span>}</div>}
  </div>
}
