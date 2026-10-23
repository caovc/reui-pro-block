import { useEffect, useState } from "react";
import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import {
  ArrowUp,
  BookOpen,
  Building2,
  ChevronDown,
  CircleHelp,
  FilePlus2,
  FileText,
  MoreVertical,
  PanelLeft,
  Scale,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  SquarePen,
  Upload,
  Users,
  X,
  CircleX,
  CircleDot,
} from "lucide-react";
import { Tree, TreeItem, TreeItemLabel } from "@/components/reui/tree";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Message, MessageContent } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Face,
  Input,
  ReuiMark,
  toast,
} from "./chrome";
import { ResponsiveAssistantPanel } from "./responsive-assistant";
import { InvoicePlaceholders } from "./detail-placeholders";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
const orders = [
  "10021",
  "10001",
  "10024",
  "10032",
  "10011",
  "10033",
  "10022",
  "10051",
  "10053",
  "10070",
  "10020",
  "10023",
  "10090",
];
type OrderNode = {
  name: string;
  children?: string[];
  status?: string;
  count?: number;
  check?: boolean;
};
const nodes: Record<string, OrderNode> = {
  root: { name: "Orders", children: orders },
};
for (const [i, id] of orders.entries()) {
  nodes[id] = {
    name: `PO-2026-${id}`,
    children: [`${id}-3wim`],
    status: [0, 5, 8].includes(i)
      ? "Review"
      : [1, 11].includes(i)
        ? "Ready"
        : i === 10
          ? "Overdue"
          : undefined,
  };
  nodes[`${id}-3wim`] = {
    name: "3WIM",
    children: [`${id}-document`, `${id}-match`, `${id}-approve`, `${id}-more`],
  };
  for (const [key, name, count] of [
    ["document", "Document validation", 1],
    ["match", "3-way line match", 2],
    ["approve", "Approve payment", undefined],
    ["more", "More", undefined],
  ] as const)
    nodes[`${id}-${key}`] = { name, count, check: key !== "more" };
}
function CheckActions({ name }: { name: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Actions for ${name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="reui-reference">
        <DropdownMenuLabel>Check</DropdownMenuLabel>
        <DropdownMenuGroup>
          {["Open Check", "Assign Reviewer", "Mark Resolved"].map((label) => (
            <DropdownMenuItem key={label} onSelect={() => toast(label)}>
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function OrderQueue() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All Orders");
  const [selected, setSelected] = useState("10021-document");
  const visibleOrders = orders.filter(
    (id) =>
      nodes[id].name.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "All Orders" || nodes[id].status === filter),
  );
  const tree = useTree<OrderNode>({
    initialState: {
      expandedItems: ["10021", "10021-3wim"],
      focusedItem: "10021-document",
    },
    rootItemId: "root",
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => Boolean(item.getItemData().children),
    onPrimaryAction: (item) => setSelected(item.getId()),
    dataLoader: {
      getItem: (id) => nodes[id],
      getChildren: (id) => (id === "root" ? visibleOrders : (nodes[id].children ?? [])),
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });
  useEffect(() => {
    tree.rebuildTree();
  }, [query, filter, tree]);
  return (
    <div className="invoice-queue-panel">
      <div className="invoice-queue-search">
        <div>
          <Search />
          <Input
            placeholder="Search..."
            aria-label="Search orders"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label="Filter orders">
              <SlidersHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="reui-reference">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuGroup>
              {["All Orders", "Review", "Ready", "Overdue"].map((status) => (
                <DropdownMenuItem
                  key={status}
                  onSelect={() => {
                    setFilter(status);
                  }}
                >
                  {status}
                  {status === filter && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="invoice-order-count">
        {query || filter !== "All Orders" ? visibleOrders.length : 31} orders
      </p>
      <div className="invoice-order-scroll">
        <Tree tree={tree} indent={20} aria-label="Order queue">
          {tree
            .getItems()
            .filter((item) => visibleOrders.includes(item.getId().split("-")[0]))
            .map((item) => {
              const row = item.getItemData();
              return (
                <TreeItem key={item.getId()} item={item} asChild>
                  <div
                    onFocus={(e) => {
                      if (e.target === e.currentTarget) item.setFocused();
                    }}
                    className={`invoice-order-node ${row.check ? "check" : ""}`}
                    data-active={selected === item.getId()}
                  >
                    <TreeItemLabel className="invoice-order-label">
                      {row.check &&
                        (row.count ? (
                          <CircleX className="invoice-failed" />
                        ) : (
                          <CircleDot className="invoice-pending" />
                        ))}
                      {row.name === "More" && <ChevronDown className="-rotate-90" />}
                      <span>{row.name}</span>
                      {row.count && (
                        <Badge variant="destructive-light" size="xs">
                          {row.count}
                        </Badge>
                      )}
                      {row.status && (
                        <Badge
                          variant={
                            row.status === "Ready"
                              ? "success-light"
                              : row.status === "Overdue"
                                ? "destructive-light"
                                : "warning-light"
                          }
                          size="sm"
                        >
                          {row.status}
                        </Badge>
                      )}
                    </TreeItemLabel>
                    {selected === item.getId() && row.check && <CheckActions name={row.name} />}
                  </div>
                </TreeItem>
              );
            })}
        </Tree>
        {!visibleOrders.length && (
          <p className="p-4 text-xs text-muted-foreground">No orders match your search.</p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="invoice-new"
        onClick={() => toast("New 3WIM", { description: "Create a new matching workflow." })}
      >
        <FilePlus2 />
        New 3WIM
      </Button>
    </div>
  );
}
function Advisor({ onClose }: { onClose: () => void }) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  return (
    <ResponsiveAssistantPanel title="3WIM Advisor" onClose={onClose} className="invoice-advisor">
      <header>
        <IconTile size="xs" variant="elevated">
          <Sparkles />
        </IconTile>
        <strong>3WIM Advisor</strong>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="New advisor conversation"
          onClick={() => setMessages([])}
        >
          <SquarePen />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Advisor settings"
          onClick={() => toast("Advisor settings")}
        >
          <SlidersHorizontal />
        </Button>
        <Button variant="ghost" size="icon-xs" aria-label="Close assistant" onClick={onClose}>
          <X />
        </Button>
      </header>
      <div className="invoice-advisor-messages">
        <p className="text-center text-xs text-muted-foreground">Today</p>
        <Message align="end">
          <MessageContent>
            <Bubble>
              <BubbleContent>Why is PO-2026-10021 on hold?</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <p className="invoice-policy-sources">
          <BookOpen />
          Read 6 policies <span>·</span> Used 4<ChevronDown />
        </p>
        <Message>
          <MessageContent>
            <Bubble variant="outline" className="max-w-full">
              <BubbleContent>
                <p>
                  Two checks failed on PO-2026-10021, so Approve payment cannot start. Document
                  validation raised 1 issue and the 3-way line match raised 2.
                </p>
                <ol>
                  <li>
                    Clear Document validation first. The tax ID on the invoice differs from the
                    supplier record, and nothing after it runs until that is fixed.
                  </li>
                  <li>
                    Then open 3-way line match. Line 2 is invoiced for 500 units against 480
                    received, and line 4 is priced 3.1% over the PO.
                  </li>
                  <li>
                    Ask for a credit note on the 20 short units rather than overriding. The price
                    gap needs the buyer's sign off.
                  </li>
                </ol>
                <p className="text-muted-foreground">
                  Price tolerance is 2% per line, so the 3.1% variance cannot be approved from the
                  queue.
                </p>
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        {["How do I request a credit note?", "Who can override a failed match?"].map((s) => (
          <button className="invoice-advisor-suggestion" key={s} onClick={() => setDraft(s)}>
            ↳ {s}
          </button>
        ))}
        {messages.map((text, i) => (
          <Message align="end" key={i}>
            <MessageContent>
              <Bubble>
                <BubbleContent>{text}</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) {
            setMessages((v) => [...v, draft.trim()]);
            setDraft("");
          }
        }}
      >
        <label htmlFor="invoice-advisor-composer">Ask the AP policies</label>
        <textarea
          id="invoice-advisor-composer"
          placeholder="Ask about an order"
          maxLength={1000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div>
          <span>{draft.length} / 1000</span>
          <Button
            size="icon-sm"
            type="submit"
            aria-label="Send to advisor"
            disabled={!draft.trim()}
          >
            <ArrowUp />
          </Button>
        </div>
      </form>
    </ResponsiveAssistantPanel>
  );
}
export default function InvoiceQueue() {
  const [tab, setTab] = useState("Matching Queue");
  const [ai, setAi] = useState(false);
  const [app, setApp] = useState("3WIM");
  return (
    <div className="shell-reference reui-reference invoice-shell" data-shell-variant="34">
      <nav className="invoice-app-rail" aria-label="Applications">
        <ReuiMark small />
        <div>
          {(
            [
              ["3WIM", Scale],
              ["Companies", Building2],
              ["Documents", FileText],
              ["Suppliers", Users],
              ["Settings", SlidersHorizontal],
            ] as const
          ).map(([name, Icon]) => (
            <IconTile asChild size="xs" key={name} className="invoice-rail-icon">
              <button
                aria-label={name}
                title={name}
                aria-pressed={app === name}
                onClick={() => setApp(name)}
              >
                <Icon />
              </button>
            </IconTile>
          ))}
        </div>
        <footer>
          <Button variant="ghost" size="icon-xs" aria-label="Help" onClick={() => toast("Help")}>
            <CircleHelp />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Settings"
            onClick={() => toast("Settings")}
          >
            <Settings />
          </Button>
          <Face small />
        </footer>
      </nav>
      <main className="invoice-shell-main">
        <header className="invoice-shell-header">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                className="invoice-mobile-nav"
                variant="ghost"
                size="icon-sm"
                aria-label="Open order queue"
              >
                <PanelLeft />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="invoice-mobile-queue reui-reference">
              <SheetHeader className="sr-only">
                <SheetTitle>Order queue</SheetTitle>
                <SheetDescription>Search purchase orders and matching checks.</SheetDescription>
              </SheetHeader>
              <OrderQueue />
            </SheetContent>
          </Sheet>
          <h1>3WIM Queue</h1>
          <div className="invoice-queue-tabs" role="tablist" aria-label="Invoice queues">
            {["Matching Queue", "Completed Matches"].map((name) => (
              <button
                key={name}
                role="tab"
                aria-selected={tab === name}
                onClick={() => setTab(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="invoice-header-actions">
            <Button variant="outline" size="sm" onClick={() => setAi(!ai)} aria-pressed={ai}>
              <Sparkles />
              Ask AI
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast("Upload started", {
                  description: "New documents join the matching queue.",
                })
              }
            >
              <Upload />
              Upload New
            </Button>
          </div>
        </header>
        <div className="invoice-shell-body">
          <aside className="invoice-desktop-queue">
            <OrderQueue />
          </aside>
          <InvoicePlaceholders />
        </div>
      </main>
      {ai && <Advisor onClose={() => setAi(false)} />}
    </div>
  );
}
