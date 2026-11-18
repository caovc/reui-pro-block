import { useCallback, useMemo, useRef, useState } from "react";
import { Ban, Ellipsis, PackageCheck, Search } from "lucide-react";
import {
  DomainGridSurface,
  useDomainGrid,
  type DomainColumn,
} from "@/blocks/data/grid-advanced-model-grid";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SurgeProduct } from "./surge-operations-model";
import {
  applyPurchaseOrderOperation,
  purchaseOrderDate,
  purchaseOrderDateLabel,
  purchaseOrderTotalCents,
  purchaseOrderUnits,
  type PurchaseOrderOperation,
  type SurgePurchaseOrder,
  type SurgePurchaseOrdersModel,
} from "./surge-purchase-orders-model";
import { toast } from "./shared";
import "./surge-purchase-orders.css";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const date = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const dateText = (order: SurgePurchaseOrder) =>
  date.format(new Date(`${purchaseOrderDate(order)}T12:00:00Z`));
const skuCount = (order: SurgePurchaseOrder) => new Set(order.lines.map((line) => line.sku)).size;

function OrderActions({
  order,
  onRequest,
  onMutationClose,
}: {
  order: SurgePurchaseOrder;
  onRequest: (operation: PurchaseOrderOperation, opener: HTMLButtonElement | null) => void;
  onMutationClose: (event: Event) => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const openingDialog = useRef(false);
  const returningAfterCancel = useRef(false);
  if (order.status !== "Draft") return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={trigger}
          variant="ghost"
          size="icon-sm"
          aria-label={`Open actions for ${order.id}`}
        >
          <Ellipsis aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="reui-reference"
        onCloseAutoFocus={(event) => {
          const handoff = openingDialog.current;
          openingDialog.current = false;
          if (handoff) event.preventDefault();
          else if (returningAfterCancel.current) {
            returningAfterCancel.current = false;
            onRequest("Cancel", trigger.current);
            onMutationClose(event);
          }
        }}
      >
        {(["Receive", "Cancel"] as const).map((operation) => (
          <DropdownMenuItem
            key={operation}
            onSelect={() => {
              openingDialog.current = operation === "Receive";
              returningAfterCancel.current = operation === "Cancel";
              // Keep the row mounted until the native menu closes. A Draft
              // filter can otherwise remove its focus scope before it restores.
              if (operation === "Receive") onRequest(operation, trigger.current);
            }}
          >
            {operation === "Receive" ? (
              <PackageCheck aria-hidden="true" />
            ) : (
              <Ban aria-hidden="true" />
            )}
            {operation}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SurgePurchaseOrders({
  model,
  products,
  onProductsChange,
}: {
  model: SurgePurchaseOrdersModel;
  products: SurgeProduct[];
  onProductsChange: (products: SurgeProduct[]) => void;
}) {
  const { orders, setOrders } = model;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 });
  const [sorting, setSorting] = useState([{ id: "date", desc: true }]);
  const [pending, setPending] = useState<string | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const pendingOrder = orders.find((order) => order.id === pending);
  const restoreFocus = useCallback((event: Event) => {
    const target = opener.current?.isConnected ? opener.current : searchInput.current;
    opener.current = null;
    if (!target) return;
    target.focus();
    if (target.ownerDocument.activeElement === target) event.preventDefault();
  }, []);
  const completeOperation = useCallback(
    (id: string, operation: PurchaseOrderOperation) => {
      const previousOrders = orders;
      const previousProducts = products;
      const result = applyPurchaseOrderOperation(previousOrders, previousProducts, id, operation);
      if (!result.changed) {
        toast.error("This order can no longer be changed.");
        return false;
      }
      setOrders(result.orders);
      onProductsChange(result.products);
      toast.success(
        operation === "Receive"
          ? "Purchase order received locally"
          : "Purchase order cancelled locally",
        {
          action: {
            label: "Undo",
            onClick: () => {
              setOrders(previousOrders);
              onProductsChange(previousProducts);
            },
          },
        },
      );
      return true;
    },
    [orders, setOrders, products, onProductsChange],
  );
  const requestOperation = useCallback(
    (id: string, operation: PurchaseOrderOperation, button: HTMLButtonElement | null) => {
      opener.current = button;
      if (operation === "Receive") setPending(id);
      else completeOperation(id, operation);
    },
    [completeOperation],
  );
  const columns = useMemo<DomainColumn<SurgePurchaseOrder>[]>(
    () => [
      {
        id: "order",
        header: "Order",
        size: 220,
        accessorFn: (order) => order.id,
        cell: ({ row }) => (
          <div className="surge-purchase-order-identity">
            <code>{row.original.id}</code>
            <small>{row.original.supplier}</small>
          </div>
        ),
      },
      {
        id: "items",
        header: "Items",
        size: 170,
        accessorFn: purchaseOrderUnits,
        cell: ({ row }) => (
          <>
            {skuCount(row.original)} {skuCount(row.original) === 1 ? "SKU" : "SKUs"} ·{" "}
            {purchaseOrderUnits(row.original)} units
          </>
        ),
      },
      {
        id: "total",
        header: "Total",
        size: 120,
        accessorFn: purchaseOrderTotalCents,
        cell: ({ row }) => (
          <span className="surge-purchase-total">
            {money.format(purchaseOrderTotalCents(row.original) / 100)}
          </span>
        ),
      },
      {
        id: "location",
        header: "Receive into",
        size: 160,
        accessorFn: (order) => order.location,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.location}</span>,
      },
      {
        id: "status",
        header: "Status",
        size: 120,
        accessorFn: (order) => order.status,
        cell: ({ row }) => (
          <Badge
            size="sm"
            variant={
              row.original.status === "Draft"
                ? "warning-light"
                : row.original.status === "Received"
                  ? "success-light"
                  : "secondary"
            }
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "date",
        header: "Date",
        size: 130,
        accessorFn: purchaseOrderDate,
        cell: ({ row }) => (
          <div className="surge-purchase-order-date">
            <span>{dateText(row.original)}</span>
            <small>{purchaseOrderDateLabel(row.original)}</small>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => null,
        size: 50,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <OrderActions
            order={row.original}
            onRequest={(operation, button) => requestOperation(row.original.id, operation, button)}
            onMutationClose={(event) => {
              opener.current = null;
              restoreFocus(event);
            }}
          />
        ),
      },
    ],
    [requestOperation, restoreFocus],
  );
  const table = useDomainGrid({
    data: orders,
    columns,
    search,
    globalFilterFn: (order, query) =>
      `${order.id} ${order.supplier}`.toLowerCase().includes(query.trim().toLowerCase()),
    filters: status === "All statuses" ? [] : [{ id: "status", value: status }],
    sorting,
    onSortingChange: setSorting,
    pagination,
    onPaginationChange: setPagination,
    getRowId: (order) => order.id,
  });
  function resetPage() {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }
  function confirm() {
    if (pending && completeOperation(pending, "Receive")) setPending(null);
  }
  return (
    <section className="surge-purchase-orders" aria-labelledby="surge-purchase-orders-title">
      <header className="surge-purchase-orders-heading">
        <h1 id="surge-purchase-orders-title">Purchase orders</h1>
        <Badge variant="secondary" size="sm">
          {orders.filter((order) => order.status === "Draft").length} open
        </Badge>
      </header>
      <Frame dense className="surge-purchase-orders-frame">
        <FramePanel fit className="surge-purchase-orders-panel">
          <div className="surge-purchase-orders-toolbar">
            <InputGroup className="surge-purchase-orders-search">
              <InputGroupAddon>
                <Search aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                ref={searchInput}
                aria-label="Search purchase orders"
                placeholder="Search PO or supplier..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPage();
                }}
              />
            </InputGroup>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                resetPage();
              }}
            >
              <SelectTrigger className="surge-purchase-status" aria-label="Purchase order status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="reui-reference">
                {["All statuses", "Draft", "Received", "Cancelled"].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DomainGridSurface
            table={table}
            paginationControls={{ sizes: [8, 10, 25, 50] }}
            scrollArea="horizontal"
            className="surge-purchase-orders-grid"
          />
        </FramePanel>
      </Frame>
      <AlertDialog
        open={Boolean(pending && pendingOrder)}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <AlertDialogContent
          size="sm"
          className="reui-reference surge-purchase-confirmation"
          onCloseAutoFocus={restoreFocus}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Receive {pendingOrder?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              This adds {pendingOrder ? purchaseOrderUnits(pendingOrder) : 0} units to{" "}
              {pendingOrder?.location} and records a restock on each SKU.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep as draft</AlertDialogCancel>
            <AlertDialogAction onClick={confirm} disabled={pendingOrder?.status !== "Draft"}>
              Receive stock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
