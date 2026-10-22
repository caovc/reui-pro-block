import { Component, lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import type { BlockMeta } from '@/data/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
const Application = lazy(() => import('./application'))
const Data = lazy(() => import('./data'))
const Commerce = lazy(() => import('./commerce'))
class PreviewBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state: {error: string | null} = { error: null }
  static getDerivedStateFromError(error: Error) { return { error: error.message } }
  render() { return this.state.error ? <Alert variant="destructive"><AlertTitle>Preview could not render</AlertTitle><AlertDescription>{this.state.error}</AlertDescription></Alert> : this.props.children }
}
export function BlockRenderer({ block }: { block: BlockMeta }) {
  const Family = block.group === 'application' ? Application : ['ecommerce', 'marketing'].includes(block.group) ? Commerce : Data
  return <PreviewBoundary key={`${block.group}/${block.id}`}><Suspense fallback={<div className="flex flex-col gap-4 p-10"><Skeleton className="h-8 w-40"/><Skeleton className="h-48 w-full"/></div>}><Family block={block}/></Suspense></PreviewBoundary>
}
