import { Component, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { templates } from './catalog';
import { TemplateSurface } from './surface';

const Workflow = lazy(() => import('./workflow'));
const Business = lazy(() => import('./business'));
const Collaboration = lazy(() => import('./collaboration'));

class TemplateBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="template-load-state" role="alert"><h2>Unable to load this template</h2><p>Please reload to try again.</p><Button onClick={() => location.reload()}>Retry</Button></div>;
    return this.props.children;
  }
}
export function TemplateRenderer({ id }: { id: string }) {
  const template = templates.find(t => t.id === id);
  if (!template) return <div className="template-load-state"><h1>Template not found</h1><Button asChild><a href="#/templates">Browse templates</a></Button></div>;
  return <TemplateBoundary key={id}><Suspense fallback={<div className="template-load-state" role="status" aria-label="Loading template"><Skeleton className="h-8 w-48"/><Skeleton className="h-80 w-full"/></div>}>
    <TemplateSurface id={id}>{template.family === 'workflow' ? <Workflow id={id}/> : template.family === 'business' ? <Business id={id}/> : <Collaboration id={id}/>}</TemplateSurface>
  </Suspense></TemplateBoundary>;
}
