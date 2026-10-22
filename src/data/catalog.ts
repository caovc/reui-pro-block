import raw from './catalog.json'
import type { CategoryMeta } from './types'
export const categories = raw as CategoryMeta[]
export const blocks = categories.flatMap(category => category.blocks)
export const groups = [
  { id: 'all', name: 'All', count: blocks.length },
  ...['application', 'data-grid', 'chart', 'solutions', 'ai-agents', 'ecommerce', 'marketing'].map(id => ({
    id, name: categories.find(c => c.group === id)!.groupLabel,
    count: categories.filter(c => c.group === id).reduce((n, c) => n + c.count, 0),
  })),
]
export const blockKey = (b: { group: string; category: string; id: string }) => `${b.group}/${b.category}/${b.id}`
export const blockHref = (b: { group: string; category: string; id: string }) => `#/block/${blockKey(b)}`
export const categoryHref = (c: CategoryMeta) => `#/category/${c.group}/${c.id}`
