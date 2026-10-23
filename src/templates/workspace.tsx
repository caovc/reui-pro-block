import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowLeft, Code2, ExternalLink, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { templates } from './catalog';
import { TemplateRenderer } from './renderer';
import './templates.css';
const SourceDialog = lazy(() => import('./source-dialog'));

export default function TemplateWorkspace({ id, dark, onThemeChange }: { id: string; dark: boolean; onThemeChange: () => void }) {
  const template = templates.find(t => t.id === id);
  const [sourceOpen, setSourceOpen] = useState(false);
  useEffect(() => { document.title = `${template?.name ?? 'Template'} — REUI Templates`; }, [template]);
  return <div className="template-workspace">
    <nav className="template-workspace-toolbar" aria-label="Template preview navigation">
      <a href="#/templates" className="template-back"><ArrowLeft size={14}/><span>Templates</span></a>
      <span className="template-toolbar-divider"/>
      <span className="font-medium">{template?.name ?? 'Unknown template'}</span>
      <span className="template-demo-label">Local demo</span>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon-xs" aria-label="View template source" onClick={() => setSourceOpen(true)}><Code2/></Button>
        <Button variant="ghost" size="icon-xs" aria-label="Toggle template theme" onClick={onThemeChange}>{dark ? <Sun/> : <Moon/>}</Button>
        {template && <a href={template.reference} target="_blank" rel="noopener noreferrer" className="template-reference"><span>Original preview</span><ExternalLink size={13}/></a>}
      </div>
    </nav>
    <main className="template-workspace-content"><TemplateRenderer id={id}/></main>
    {template && sourceOpen && <Suspense fallback={null}><SourceDialog template={template} open={sourceOpen} onOpenChange={setSourceOpen}/></Suspense>}
  </div>;
}
