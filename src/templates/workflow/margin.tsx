import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ComponentType,
} from "react";
import { Bell, Landmark, Search } from "lucide-react";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { useGlobalTheme } from "@/components/site/global-theme-store";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  MarginBudgets,
  MarginCashFlow,
  MarginDashboard,
  MarginProfitLoss,
  MarginScenarios,
} from "./margin-planning";
import { MarginControls, MarginReceivables, MarginTransactions } from "./margin-ledger";
import {
  createMarginBook,
  initialProjectBudget,
  invoiceLane,
  marginPages,
  type MarginPage,
} from "./margin-model";
import "./margin.css";

const views: Record<MarginPage, ComponentType> = {
  "": MarginDashboard,
  "plan/pnl": MarginProfitLoss,
  "plan/budgets": MarginBudgets,
  "plan/scenarios": MarginScenarios,
  "cash/cash-flow": MarginCashFlow,
  "cash/receivables": MarginReceivables,
  "ledger/transactions": MarginTransactions,
  "ledger/controls": MarginControls,
};

const pages = marginPages.map(([path, name]) => ({
  path: `/${path}`,
  name,
  component: views[path],
}));

const signIn = { path: "/sign-in", name: "Sign in", component: MarginSignIn } as const;

const openingBook = createMarginBook();
const initialBudget = initialProjectBudget();
const collectionQueue = openingBook.invoices.filter(
  (invoice) => invoiceLane(invoice) === "needs-you",
);
const notices = [
  {
    id: "collections",
    title: `${collectionQueue.length} invoices need attention`,
    path: "/cash/receivables",
    destination: "Review receivables",
  },
  {
    id: "budget",
    title: initialBudget.decision,
    path: "/plan/budgets",
    destination: "Review project budget",
  },
];

function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

function useMarginPage() {
  // Customization can replace the preset while keeping the current route.
  useGlobalTheme();
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "",
  );
  const [path, query] = hash.slice(1).split(/\?(.*)/s);
  const mount = path.match(/^\/(?:templates|template-preview)\/margin(?=\/|$)/)?.[0] ?? "";
  const pagePath = path.slice(mount.length) || "/";
  const active =
    pagePath === signIn.path ? signIn : (pages.find(({ path }) => path === pagePath) ?? pages[0]);
  const href = (next: string) =>
    `#${mount}${mount && next === "/" ? "" : next}${query ? `?${query}` : ""}`;
  return { active, href };
}

function MarginSignIn() {
  const [message, setMessage] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "")
      .trim()
      .toLowerCase();
    setMessage(
      email === "demo@brick.test"
        ? "A connected workspace would send a one-time link."
        : "Use demo@brick.test to preview this form.",
    );
  }
  return (
    <Frame className="max-w-lg">
      <FrameHeader>
        <FrameTitle>Email access</FrameTitle>
      </FrameHeader>
      <FramePanel>
        <form onSubmit={submit} className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Use demo@brick.test to preview local sign-in.
          </p>
          <Field>
            <FieldLabel htmlFor="margin-email">Email address</FieldLabel>
            <Input id="margin-email" name="email" type="email" autoComplete="email" required />
          </Field>
          <Button type="submit">Preview sign-in link</Button>
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
        </form>
      </FramePanel>
    </Frame>
  );
}

export default function Margin() {
  const { active, href } = useMarginPage();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);
  const unreadCount = notices.length - read.length;
  const opener = useRef<HTMLElement | null>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!opener.current && document.activeElement instanceof HTMLElement)
          opener.current = document.activeElement;
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);
  const View = active.component;
  return (
    <div className="margin-workspace">
      <header className="margin-header">
        <div className="flex items-center gap-3">
          <div className="margin-mark">
            <Landmark aria-hidden="true" size={21} />
          </div>
          <div>
            <p className="font-semibold">Ledger Studio</p>
            <p className="text-xs text-muted-foreground">November 2026 · Local books</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            ref={searchButton}
            size="sm"
            variant="outline"
            onClick={(event) => {
              opener.current = event.currentTarget;
              setSearchOpen(true);
            }}
          >
            <Search /> Find a page
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label={`Notifications (${unreadCount})`}
            aria-controls="margin-notifications"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <Bell />
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <a href={href(signIn.path)}>Demo sign in</a>
          </Button>
        </div>
      </header>
      <div className="margin-layout">
        <nav aria-label="Finance pages" className="margin-nav">
          {pages.map(({ path, name }) => (
            <a
              key={path}
              href={href(path)}
              aria-current={active.path === path ? "page" : undefined}
            >
              {name}
            </a>
          ))}
        </nav>
        <div id="margin-notifications" hidden={!notificationsOpen} className="mb-5">
          <Frame>
            <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2">
              <FrameTitle>Notifications</FrameTitle>
              <Button
                variant="outline"
                size="sm"
                disabled={!unreadCount}
                onClick={() => setRead(notices.map(({ id }) => id))}
              >
                Mark all read
              </Button>
            </FrameHeader>
            <FramePanel>
              <ul className="divide-y">
                {notices.map((notice) => (
                  <li
                    key={notice.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <span
                      className={read.includes(notice.id) ? "text-muted-foreground" : "font-medium"}
                    >
                      {notice.title}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={href(notice.path)}
                        onClick={() => {
                          setRead((current) =>
                            current.includes(notice.id) ? current : [...current, notice.id],
                          );
                          setNotificationsOpen(false);
                        }}
                      >
                        {notice.destination}
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            </FramePanel>
          </Frame>
        </div>
        <section aria-labelledby="margin-title" className="margin-content">
          <h1 id="margin-title">{active.name}</h1>
          <View key={active.path} />
        </section>
      </div>
      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Find a finance page"
        description="Search the finance workspace"
        onCloseAutoFocus={(event) => {
          const target =
            opener.current?.isConnected && opener.current !== document.body
              ? opener.current
              : searchButton.current;
          opener.current = null;
          if (target) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <Command>
          <CommandInput aria-label="Search finance pages" placeholder="Search finance pages" />
          <CommandList>
            <CommandEmpty>No matching pages.</CommandEmpty>
            {pages.map(({ path, name }) => (
              <CommandItem
                key={path}
                value={name}
                onSelect={() => {
                  window.location.hash = href(path);
                  setSearchOpen(false);
                }}
              >
                {name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
