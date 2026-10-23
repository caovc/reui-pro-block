import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
const BusinessApp = lazy(() => import('./app'));
export default function BusinessTemplate({ id }: {
    id: string;
}) { return <Suspense fallback={<div className="p-8"><Skeleton className="h-96 w-full"/></div>}><BusinessApp key={id} id={id}/></Suspense>; }
