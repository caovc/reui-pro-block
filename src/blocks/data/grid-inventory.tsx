import { createContext, useCallback, useContext, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useTable, type ColumnDef } from '@tanstack/react-table'
import { CircleCheck, Copy, Ellipsis, Plus, Search, Trash2, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/reui/badge'
import { Frame, FrameHeader, FrameTitle, FrameDescription, FramePanel, FrameFooter } from '@/components/reui/frame'
import { NumberField, NumberFieldGroup, NumberFieldInput } from '@/components/reui/number-field'
import { DataGrid, DataGridContainer, dataGridFeatures, type DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table'
import { DataGridScrollArea } from '@/components/reui/data-grid/data-grid-scroll-area'
import { DataGridColumnHeader } from '@/components/reui/data-grid/data-grid-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Facet } from './grid-base-common'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import './grid-specialized.css'

type Product = { id: number; name: string; sku: string; category: string; price: string; stock: string; status: string; visible: boolean }
type EditableField = 'name' | 'category' | 'price' | 'stock' | 'status'
const categories = ['Apparel', 'Footwear', 'Accessories', 'Outerwear', 'Bags']
const statuses = ['Active', 'Draft', 'Archived']
const products: Product[] = [
  { id: 1, name: 'Everyday Cotton Tee', sku: 'APP-1042', category: 'Apparel', price: '28', stock: '320', status: 'Active', visible: true },
  { id: 2, name: 'Suede Chelsea Boot', sku: 'FTW-3502', category: 'Footwear', price: '189', stock: '14', status: 'Draft', visible: false },
  { id: 3, name: 'Aviator Sunglasses', sku: 'ACC-5260', category: 'Accessories', price: '120', stock: '64', status: 'Active', visible: true },
  { id: 4, name: 'Trail Runner GTX', sku: 'FTW-3381', category: 'Footwear', price: '145', stock: '7', status: 'Active', visible: true },
  { id: 5, name: 'Linen Camp Shirt', sku: 'APP-2380', category: 'Apparel', price: '64', stock: '0', status: 'Archived', visible: false },
]
function errorFor(product: Product, field: EditableField) {
  if (field === 'name' && !product.name.trim()) return 'Product name is required.'
  if (field === 'price') {
    if (!product.price.trim() || !Number.isFinite(Number(product.price))) return 'Enter a valid price.'
    if (Number(product.price) < 0) return 'Price cannot be negative.'
    if (Number(product.price) > 100000) return 'Price cannot exceed $100,000.'
  }
  if (field === 'stock' && (!product.stock.trim() || !Number.isSafeInteger(Number(product.stock)) || Number(product.stock) < 0)) return 'Stock must be a non-negative whole number.'
  return ''
}
// The context keeps column/cell component identities stable while an editor's
// draft changes. Rebuilding cell functions per keystroke would remount inputs.
type InventoryCellState = {
  renderCell: (row: Product, field: EditableField) => ReactNode
  update: (id: number, field: keyof Product, value: string | boolean) => void
  duplicate: (row: Product) => void
  remove: (row: Product) => void
}
const InventoryCells = createContext<InventoryCellState | null>(null)
function EditableCell({ product, field }: { product: Product; field: EditableField }) {
  return useContext(InventoryCells)!.renderCell(product, field)
}
function VisibilityCell({ product }: { product: Product }) {
  const state = useContext(InventoryCells)!
  return <Switch size="sm" aria-label={`Show ${product.name || product.sku} in storefront`} checked={product.visible} onCheckedChange={checked => state.update(product.id, 'visible', checked)} />
}
function ActionsCell({ product }: { product: Product }) {
  const state = useContext(InventoryCells)!
  return <DropdownMenu><DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label={`Actions for ${product.name || product.sku}`}><Ellipsis /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuGroup><DropdownMenuItem onSelect={() => state.duplicate(product)}><Copy />Duplicate</DropdownMenuItem><DropdownMenuItem variant="destructive" onSelect={() => state.remove(product)}><Trash2 />Delete</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent></DropdownMenu>
}
export default function InventoryGrid() {
  const [rows, setRows] = useState(products)
  const [saved, setSaved] = useState(products)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string[]>([])
  const [editing, setEditing] = useState<{ id: number; field: EditableField; value: string } | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const dirty = JSON.stringify(rows) !== JSON.stringify(saved)
  const invalid = rows.some(row => (['name', 'price', 'stock'] as const).some(field => errorFor(row, field))) || !!(editing && errorFor({ ...rows.find(row => row.id === editing.id)!, [editing.field]: editing.value }, editing.field))
  const changed = rows.filter(row => JSON.stringify(row) !== JSON.stringify(saved.find(s => s.id === row.id))).length + saved.filter(row => !rows.some(r => r.id === row.id)).length
  const columns = useMemo<ColumnDef<DataGridFeatures, Product>[]>(() => [
    ...(['name', 'category', 'price', 'stock', 'status'] as const).map((field, index) => ({
      id: field,
      accessorFn: (product: Product) => field === 'price' || field === 'stock' ? Number(product[field]) : product[field],
      header: ({ column }: Parameters<Exclude<ColumnDef<DataGridFeatures, Product>['header'], string | undefined>>[0]) => <DataGridColumnHeader column={column} title={['Product', 'Category', 'Price', 'Stock', 'Status'][index]} />,
      cell: ({ row }: { row: { original: Product } }) => <EditableCell product={row.original} field={field} />,
      size: [265, 160, 140, 100, 130][index],
      meta: { headerTitle: ['Product', 'Category', 'Price', 'Stock', 'Status'][index], ...(field === 'price' || field === 'stock' ? { headerClassName: 'text-right [&_button]:ml-auto', cellClassName: 'text-right tabular-nums' } : {}) },
    })),
    { id: 'visible', accessorKey: 'visible', header: 'Visible', cell: ({ row }) => <VisibilityCell product={row.original} />, size: 90, meta: { headerClassName: 'text-center', cellClassName: 'text-center' } },
    { id: 'actions', header: '', cell: ({ row }) => <ActionsCell product={row.original} />, size: 55, enableSorting: false, enableGlobalFilter: false },
  ], [])
  const filter = useCallback((product: Product) => `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(search.toLowerCase()) && (!status.length || status.includes(product.status)), [search, status])
  const table = useTable({
    features: dataGridFeatures, data: rows, columns, getRowId: product => String(product.id),
    state: { globalFilter: filter }, getColumnCanGlobalFilter: () => true,
    globalFilterFn: (row, _column, matches) => matches(row.original),
    // This small editable inventory intentionally displays the complete filtered
    // model without pagination. Raw data is never sliced, sorted or prefiltered.
    manualPagination: true,
  })
  function update(id: number, field: keyof Product, value: string | boolean) { setRows(current => current.map(row => row.id === id ? { ...row, [field]: value } : row)) }
  function finish(event: KeyboardEvent<HTMLInputElement>, row: Product, field: EditableField) {
    if (event.key === 'Escape') { event.preventDefault(); setEditing(null) }
    if (event.key === 'Enter' && editing && !errorFor({ ...row, [field]: editing.value }, field)) { event.preventDefault(); update(row.id, field, editing.value.trim()); setEditing(null) }
  }
  function start(row: Product, field: EditableField) { setEditing({ id: row.id, field, value: row[field] }) }
  function cell(row: Product, field: EditableField) {
    const active = editing?.id === row.id && editing.field === field
    const error = errorFor(active && editing ? { ...row, [field]: editing.value } : row, field)
    const errorId = `product-${row.id}-${field}-error`
    if (active && (field === 'category' || field === 'status')) return <Select value={row[field]} onValueChange={value => { update(row.id, field, value); setEditing(null) }} open onOpenChange={open => { if (!open) setEditing(null) }}><SelectTrigger aria-label={`Edit ${field} for ${row.name}`} className="h-8 w-full text-xs"><SelectValue /></SelectTrigger><SelectContent>{(field === 'category' ? categories : statuses).map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
    if (active) {
      const inputProps = {
        autoFocus: true, 'aria-label': `Edit ${field} for ${row.name || row.sku}`, 'aria-invalid': !!error,
        'aria-describedby': error ? errorId : undefined,
        onFocus: (event: React.FocusEvent<HTMLInputElement>) => event.currentTarget.select(),
        onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => finish(event, row, field),
        onBlur: () => { if (!error && editing?.id === row.id && editing.field === field) { update(row.id, field, editing.value.trim()); setEditing(null) } },
      }
      return <div className="py-1">{field === 'price' || field === 'stock' ? <NumberField className="ml-auto w-28" value={editing?.value.trim() ? Number(editing.value) : null} step="any" onValueChange={value => setEditing(current => current ? { ...current, value: value === null ? '' : String(value) } : null)}><NumberFieldGroup><NumberFieldInput {...inputProps} /></NumberFieldGroup></NumberField> : <Input {...inputProps} className="h-8 text-sm" value={editing?.value || ''} onChange={event => setEditing(current => current ? { ...current, value: event.target.value } : null)} />}{error && <p id={errorId} role="alert" className="mt-1 max-w-44 text-[11px] whitespace-normal text-destructive">{error}</p>}</div>
    }
    return <button type="button" aria-label={`Edit ${field} for ${row.name || row.sku}`} aria-invalid={!!error} onClick={() => start(row, field)} className={cn('w-full rounded-sm py-0 text-left outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring', (field === 'price' || field === 'stock') && 'text-right tabular-nums', error && 'text-destructive')}>
      {field === 'name' ? <><span className="block font-medium">{row.name || 'Untitled product'}</span><span className="block text-xs text-muted-foreground">{row.sku}</span></> : field === 'status' ? <Badge variant="outline" className={cn('rounded-md px-1.5 py-0 font-normal', row.status === 'Active' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : row.status === 'Draft' ? 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400')}>{row.status}</Badge> : field === 'price' ? Number.isFinite(Number(row.price)) ? Number(row.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : row.price : field === 'stock' ? <span className="inline-flex items-center gap-1.5">{Number(row.stock) > 0 && Number(row.stock) <= 10 && <TriangleAlert aria-label="Low stock" className="size-3.5 text-amber-500" />}{row.stock}</span> : row.category}
    </button>
  }
  function add() {
    const id = Math.max(0, ...rows.map(row => row.id), ...saved.map(row => row.id)) + 1
    const row: Product = { id, name: 'New product', sku: `NEW-${1000 + id}`, category: 'Apparel', price: '0', stock: '0', status: 'Draft', visible: false }
    setRows(current => [row, ...current]); setSearch(''); setStatus([]); start(row, 'name')
  }
  function duplicate(row: Product) {
    const id = Math.max(0, ...rows.map(record => record.id), ...saved.map(record => record.id)) + 1
    setRows(current => {
      const copy = { ...row, id, name: `${row.name} Copy`, sku: `${row.sku}-C`, status: 'Draft' }
      const index = current.findIndex(product => product.id === row.id)
      return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]
    })
  }
  return <InventoryCells.Provider value={{ renderCell: cell, update, duplicate, remove: setDeleting }}><Frame aria-label="Inline editable product inventory data grid" className="special-grid special-inventory mx-auto my-20 w-full max-w-[1088px] min-w-0 rounded-2xl bg-muted/15 p-1 text-sm text-foreground">
    <FrameHeader className="inventory-head flex-row flex-wrap items-center justify-between gap-3 px-4 py-3"><div><FrameTitle><h2 className="font-semibold">Product Inventory</h2></FrameTitle><FrameDescription className="mt-1 text-sm">Edit pricing and stock inline.</FrameDescription></div><Button variant="outline" size="sm" onClick={add}><Plus />Add product</Button></FrameHeader>
    <FramePanel className="overflow-hidden rounded-xl bg-background p-0"><div className="inventory-toolbar flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3"><div className="relative w-full min-w-0 sm:w-80 sm:flex-none"><Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" /><Input aria-label="Search products" placeholder="Search products..." className="h-8 pl-8" value={search} onChange={event => setSearch(event.target.value)} /></div><Facet label="Status" options={statuses} value={status} onChange={setStatus} /></div>
      <DataGrid table={table} recordCount={table.getFilteredRowModel().rows.length} emptyMessage="No products match your search." tableLayout={{ width: 'auto', rowBorder: true }} tableClassNames={{ base: 'min-w-[952px] text-sm [&_th]:h-10 [&_th]:px-4 [&_th]:font-normal [&_td]:px-4 [&_td]:py-1', bodyRow: 'h-[49px]' }}><DataGridContainer className="rounded-none border-0"><DataGridScrollArea orientation="horizontal"><DataGridTable /></DataGridScrollArea></DataGridContainer></DataGrid>
    </FramePanel><FrameFooter className="inventory-footer flex-row flex-wrap items-center justify-between gap-3 px-4 py-3"><p role="status" className={cn('flex items-center gap-2 text-xs', invalid ? 'text-destructive' : 'text-muted-foreground')}>{invalid ? <TriangleAlert className="size-3.5" /> : <CircleCheck className={cn('size-3.5', !dirty && 'text-emerald-500')} />}{invalid ? 'Fix invalid cells before saving' : dirty ? `${changed} unsaved ${changed === 1 ? 'change' : 'changes'}` : 'All changes saved'}</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={!dirty} onClick={() => { setRows(saved.map(row => ({ ...row }))); setEditing(null); toast.info('Unsaved changes discarded') }}>Discard</Button><Button size="sm" disabled={!dirty || invalid} onClick={() => { setSaved(rows.map(row => ({ ...row }))); setEditing(null); toast.success('Inventory changes saved in this preview') }}>Save changes</Button></div></FrameFooter>
    <AlertDialog open={!!deleting} onOpenChange={open => { if (!open) setDeleting(null) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {deleting?.name || 'this product'}?</AlertDialogTitle><AlertDialogDescription>The product will be removed from this draft. Use Discard to restore it before saving.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { setRows(current => current.filter(row => row.id !== deleting?.id)); setDeleting(null) }}>Delete product</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </Frame></InventoryCells.Provider>
}
