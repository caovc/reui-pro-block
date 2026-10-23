import { useWishlistSession } from "./wishlist-session-context";
/** Actual official free REUI c-data-grid-7 selection pattern (MIT, Keenthemes).
 * https://reui.io/r/radix-nova/c-data-grid-7.json
 * Native DataGrid/RowSelect/RowSelectAll and controlled v9 rowSelection own all selection.
 * Item media rows replace the example's table cells to match this responsive public list.
 */
import { useState } from "react";
import { useTable, type ColumnDef, type RowSelectionState } from "@tanstack/react-table";
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import {
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Check, ShoppingBag, X } from "lucide-react";
import { savedEssentials } from "./wishlist-data";
import type { WishlistProduct } from "./wishlist-data";
import {
  BrowseWishlistItems,
  RestockAlert,
  ShareWishlist,
  WishlistBagButton,
  WishlistBreadcrumb,
  WishlistEmpty,
  WishlistImage,
  WishlistMoney,
  WishlistNotice,
  WishlistPrice,
  WishlistSignalBadge,
  WishlistStats,
} from "./wishlist-common";

const columns: ColumnDef<DataGridFeatures, WishlistProduct>[] = [{ accessorKey: "id" }];
export function BulkActionWishlist() {
  const [items, setItems] = useState(savedEssentials);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [browseOpen, setBrowseOpen] = useState(false);
  const { bag, add } = useWishlistSession();
  const selected = items.filter((item) => rowSelection[item.id]);
  const target = selected.length ? selected : items;
  const available = target.filter((item) => item.stock > 0 && !bag[item.id]);
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: items,
    getRowId: (row) => row.id,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    initialState: { pagination: { pageIndex: 0, pageSize: 1000 } },
  });
  const save = (product: WishlistProduct) =>
    setItems((current) =>
      current.some((item) => item.id === product.id) ? current : [...current, product],
    );
  const remove = (ids: string[]) => {
    setItems((current) => current.filter((item) => !ids.includes(item.id)));
    setRowSelection({});
  };
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10" data-wishlist-variant="1">
      <WishlistBreadcrumb onShop={() => setBrowseOpen(true)} />
      <header className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-[28px]">
              Saved For Later
            </h1>
            <span className="text-sm text-muted-foreground" data-wishlist-count>
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WishlistBagButton />
            <BrowseWishlistItems
              savedIds={items.map((item) => item.id)}
              onSave={save}
              open={browseOpen}
              onOpenChange={setBrowseOpen}
            />
          </div>
        </div>
        <WishlistStats products={items} />
      </header>
      <WishlistNotice />
      <DataGrid
        table={table}
        recordCount={items.length}
        i18n={{
          labels: { selectAll: "Select all wishlist items", selectRow: "Select wishlist item" },
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-y py-3">
          <div className="flex items-center gap-3">
            <DataGridTableRowSelectAll />
            <span className="text-sm" data-wishlist-selection>
              {selected.length
                ? `${selected.length} ${selected.length === 1 ? "item" : "items"} selected`
                : `${items.length} ${items.length === 1 ? "item" : "items"}`}
            </span>
            {selected.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setRowSelection({})}>
                Clear
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selected.length ? (
              <Button
                variant="outline"
                size="sm"
                aria-label="Remove selected wishlist items"
                onClick={() => remove(selected.map((item) => item.id))}
              >
                Remove
              </Button>
            ) : (
              <ShareWishlist products={items} />
            )}
            <Button
              size="sm"
              disabled={!available.length}
              onClick={() => {
                add(available);
                setRowSelection({});
              }}
            >
              <ShoppingBag />
              Add {available.length} To Cart
            </Button>
          </div>
        </div>
        <div>
          {table.getCoreRowModel().rows.map((row) => {
            const item = row.original,
              added = !!bag[item.id];
            return (
              <div
                key={item.id}
                role="group"
                aria-label={`Wishlist item ${item.name}`}
                data-wishlist-item={item.id}
                className="grid grid-cols-[16px_minmax(0,1fr)] items-center gap-x-3 gap-y-5 border-b py-5 last:border-0 sm:flex sm:gap-3 sm:py-5"
              >
                <DataGridTableRowSelect row={row} />
                <Item className="min-w-0 flex-1 gap-3 border-0 p-0 sm:gap-5" size="sm">
                  <ItemMedia className="self-center!">
                    <WishlistImage product={item} className="size-16 rounded-lg sm:size-20" />
                  </ItemMedia>
                  <ItemContent className="min-w-0 gap-1">
                    <p className="text-xs text-muted-foreground">{item.brand}</p>
                    <ItemTitle className="text-sm font-semibold sm:text-base">
                      {item.name}
                    </ItemTitle>
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{item.finish}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <i
                          className={`size-1.5 rounded-full ${item.stock === 0 ? "bg-muted-foreground/50" : item.stock <= 3 ? "bg-amber-400" : "bg-emerald-500"}`}
                        />
                        {item.stock === 0
                          ? "Out of stock"
                          : item.stock <= 3
                            ? `Only ${item.stock} left`
                            : "In stock"}
                      </span>
                      <span>·</span>
                      <span>{item.note}</span>
                    </div>
                    {item.signal && item.signal !== "unavailable" && (
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <WishlistSignalBadge product={item} />
                        {item.signal === "drop" && (
                          <span className="text-xs text-emerald-600">
                            Save{" "}
                            <WishlistMoney
                              amount={(item.previousPrice ?? item.price) - item.price}
                            />
                          </span>
                        )}
                      </div>
                    )}
                  </ItemContent>
                </Item>
                <div className="col-span-2 flex items-center justify-between gap-3 sm:ml-auto sm:w-auto sm:flex-col sm:items-end">
                  <div className="text-lg">
                    <WishlistPrice product={item} oldFirst />
                  </div>
                  <div className="flex items-center gap-1">
                    {item.stock > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={added}
                        aria-label={`Add ${item.name} to cart`}
                        onClick={() => add([item])}
                      >
                        {added ? <Check /> : <ShoppingBag />}
                        {added ? "Added" : "Add to Cart"}
                      </Button>
                    ) : (
                      <RestockAlert product={item} />
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${item.name} from wishlist`}
                      onClick={() => remove([item.id])}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DataGrid>
      {!items.length && <WishlistEmpty onBrowse={() => setBrowseOpen(true)} />}
    </main>
  );
}
