import { lazy, Suspense } from 'react';
const Marketing = lazy(() => import('./marketing'));
const Drive = lazy(() => import('./drive'));
const Roster = lazy(() => import('./roster'));
const Pulse = lazy(() => import('./pulse'));
export default function CollaborationTemplate({ id }: { id: string }) {
  return <Suspense fallback={<div role="status" className="p-8">Loading workspace…</div>}>
    {id === 'limelight' || id === 'overture' ? <Marketing id={id} /> : id === 'filespace' || id === 'filebox' ? <Drive id={id} /> : id === 'roster' ? <Roster /> : <Pulse />}
  </Suspense>;
}
