import { useEffect, useState } from 'react'
export const barColors = {green:'#39b28b',yellow:'#dfb600',red:'#d8342d',blue:'#4e7df1',purple:'#8b3ff0',muted:'#a1a1aa'}
export function useBarNarrow(){const [narrow,setNarrow]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(max-width:639px)').matches);useEffect(()=>{const q=window.matchMedia('(max-width:639px)'),change=()=>setNarrow(q.matches);q.addEventListener('change',change);return()=>q.removeEventListener('change',change)},[]);return narrow}
export const clockHour=(i:number)=>`${String((15+i)%24).padStart(2,'0')}:00`
export const duration=(seconds:number)=>{const total=Math.round(seconds);return total>=3600?`${Math.floor(total/3600)}h ${String(Math.floor(total/60)%60).padStart(2,'0')}m`:total>=60?`${Math.floor(total/60)}m ${String(total%60).padStart(2,'0')}s`:`${total}s`}
