import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  Copy,
  Link,
  Package,
  Settings2,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Item, ItemContent, ItemTitle, ItemDescription } from "@/components/ui/item";
import { Stage, GridFrame, ContentLink } from "./common";
const shortcuts = [
  {
    title: "Recent Orders Overview",
    description: "Track and review all recent purchases, updates, and status changes in one place.",
    action: "View Orders",
    icon: ShoppingBag,
    tone: "bg-success text-white",
  },
  {
    title: "Active Opportunities Pipeline",
    description: "Monitor ongoing deals, check potential revenue, and update opportunity stages.",
    action: "Open Pipeline",
    icon: TrendingUp,
    tone: "bg-info text-white",
  },
  {
    title: "Performance & Sales Reports",
    description:
      "Analyze weekly and monthly reports to gain deeper insights into performance trends.",
    action: "View Reports",
    icon: ChartNoAxesColumnIncreasing,
    tone: "bg-primary text-primary-foreground",
  },
  {
    title: "Integration Settings & Sync",
    description: "Manage connections with third-party tools and ensure data stays in sync.",
    action: "Manage Integrations",
    icon: Settings2,
    tone: "bg-warning text-warning-foreground",
  },
];
export function ShortcutLauncher() {
  return (
    <Stage id={17} width={832}>
      <GridFrame columns={2}>
        {shortcuts.map(({ title, description, action, icon: Icon, tone }) => (
          <FramePanel key={title} className="extended-dots flex flex-col gap-7">
            <IconTile variant="elevated" className={tone}>
              <Icon />
            </IconTile>
            <Item className="p-0">
              <ItemContent className="gap-3">
                <ItemTitle>{title}</ItemTitle>
                <ItemDescription className="text-xs leading-5">{description}</ItemDescription>
                <ContentLink title={title} description={description} className="text-xs">
                  {action}
                  <ChevronRight />
                </ContentLink>
              </ItemContent>
            </Item>
          </FramePanel>
        ))}
      </GridFrame>
    </Stage>
  );
}

const sources = [
  {
    label: "Binance",
    description:
      "Track trading volumes, liquidity shifts, and price movements for informed decisions",
    url: "https://www.binance.com/en/markets/overview",
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    label: "Revenue",
    description: "Get instant insights into earnings and cash flow performance.",
    url: "https://nexo.io/earn/crypto-detailed-portfolio",
    icon: TrendingUp,
  },
  {
    label: "Shipments",
    description: "Stay on top of deliveries and track shipment statuses efficiently.",
    url: "https://www.educare.io/platform/analytics/exports",
    icon: Package,
  },
];
export function SourceLinks() {
  return (
    <Stage id={18}>
      <div className="extended-independent-grid">
        {sources.map(({ label, description, url, icon: Icon }) => (
          <Frame key={label}>
            <FrameHeader>
              <FrameTitle className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                {label}
              </FrameTitle>
            </FrameHeader>
            <FramePanel className="flex flex-col gap-5">
              <p className="text-xs leading-5">{description}</p>
              <ContentLink
                title={label}
                description={`Sample source: ${url}`}
                className="w-full gap-1 text-xs"
              >
                <Link className="size-3 shrink-0" />
                <span className="truncate">{url}</span>
              </ContentLink>
            </FramePanel>
          </Frame>
        ))}
      </div>
    </Stage>
  );
}

const guides = [
  {
    title: "Ordering & Billing Guide",
    description: "Step-by-step instructions for checkout, invoices, taxes, and returns.",
    articles: ["Place an order guide", "Request a refund guide"],
    icon: ShoppingBag,
    tone: "bg-success text-white",
  },
  {
    title: "Configuration & Integrations",
    description: "Setup for accounts, permissions, webhooks, and third-party connections.",
    articles: ["Connect Slack and Trello", "Create API keys securely"],
    icon: Settings2,
    tone: "bg-warning text-warning-foreground",
  },
  {
    title: "Media Library Introduction",
    description: "Basics for uploading images, organizing folders, and optimizing delivery.",
    articles: ["Upload and organize assets", "Image optimization best practices"],
    icon: BookOpen,
    tone: "bg-info text-white",
  },
];
const articleCopy: Record<string, string[]> = {
  "Place an order guide": [
    "Choose the products and quantities for your order.",
    "Confirm the delivery details and review the order summary.",
    "Connect the final checkout button to your payment provider.",
  ],
  "Request a refund guide": [
    "Open the relevant order in your workspace.",
    "Review the applicable return policy and choose a reason.",
    "Submit the request through your own support workflow.",
  ],
  "Connect Slack and Trello": [
    "Create a scoped integration in the destination workspace.",
    "Configure your app credentials on the server.",
    "Select the channels and boards you want to synchronize.",
  ],
  "Create API keys securely": [
    "Create a key with only the permissions the integration needs.",
    "Store the secret on your server rather than in client code.",
    "Rotate and revoke keys through your access-management workflow.",
  ],
  "Upload and organize assets": [
    "Create a folder for the project or campaign.",
    "Upload supported assets and add descriptive names.",
    "Review access and share the intended files.",
  ],
  "Image optimization best practices": [
    "Choose an image format suited to the content.",
    "Generate responsive dimensions and compress the output.",
    "Provide useful alternative text for meaningful images.",
  ],
};
export function HelpGuides() {
  const [article, setArticle] = useState<string | null>(null);
  return (
    <Stage id={20} width={832}>
      <GridFrame>
        {guides.map(({ title, description, articles, icon: Icon, tone }) => (
          <FramePanel key={title} className="flex flex-col gap-0 p-0">
            <div className="flex flex-col gap-4 p-5">
              <IconTile variant="elevated" className={tone}>
                <Icon />
              </IconTile>
              <FrameTitle>
                <ContentLink title={title} description={description}>
                  {title}
                </ContentLink>
              </FrameTitle>
              <FrameDescription>{description}</FrameDescription>
            </div>
            <div className="mt-auto" role="list" aria-label={`${title} articles`}>
              {articles.map((name) => (
                <Item
                  key={name}
                  asChild
                  className="rounded-none border-0 border-t border-border p-0"
                >
                  <Button
                    variant="ghost"
                    className="h-auto w-full justify-between rounded-none px-5 py-3 text-xs font-normal"
                    onClick={() => setArticle(name)}
                  >
                    <span className="text-left">{name}</span>
                    <ArrowRight />
                  </Button>
                </Item>
              ))}
            </div>
          </FramePanel>
        ))}
      </GridFrame>
      <Dialog
        open={!!article}
        onOpenChange={(open) => {
          if (!open) setArticle(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{article}</DialogTitle>
            <DialogDescription>Example help article · local preview</DialogDescription>
          </DialogHeader>
          <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm">
            {(articleCopy[article ?? ""] ?? []).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <Button variant="outline" onClick={() => setArticle(null)}>
            Back to guides
          </Button>
        </DialogContent>
      </Dialog>
    </Stage>
  );
}

const projects = [
  {
    title: "Mobile Banking App Upgrade",
    client: "FivonaTech",
    due: "1d 18h",
    icon: ShoppingBag,
  },
  {
    title: "Crypto Portfolio Dashboard",
    client: "BlockEdge",
    due: "2d 20h",
    icon: Settings2,
  },
  {
    title: "AI-Powered Analytics Module",
    client: "DataNexus",
    due: "3d 6h",
    icon: TrendingUp,
  },
];
export function ProjectDeadlines() {
  const [sharing, setSharing] = useState<(typeof projects)[number] | null>(null);
  const [copied, setCopied] = useState(false);
  const url = sharing
    ? `${location.origin}${location.pathname}#/preview/application/card/card-21?project=${encodeURIComponent(sharing.title)}`
    : "";
  return (
    <Stage id={21} width={832}>
      <GridFrame>
        {projects.map(({ title, client, due, icon: Icon }) => (
          <FramePanel key={title} className="flex flex-col gap-7">
            <div className="flex items-center justify-between gap-3">
              <IconTile variant="elevated" className="bg-zinc-950 text-white">
                <Icon />
              </IconTile>
              <Button
                variant="outline"
                size="icon-xs"
                aria-label={`Share ${title}`}
                onClick={() => {
                  setSharing(projects.find((p) => p.title === title)!);
                  setCopied(false);
                }}
              >
                <ArrowRight />
              </Button>
            </div>
            <Item className="p-0">
              <ItemContent>
                <ItemTitle>
                  <ContentLink
                    title={title}
                    description={`Sample project for ${client}. Due in ${due}.`}
                  >
                    {title}
                  </ContentLink>
                </ItemTitle>
                <p className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span>{client}</span>
                  <span className="size-1 rounded-full bg-muted-foreground/40" />
                  <span className="text-muted-foreground">Due:</span>
                  <span>{due}</span>
                </p>
              </ItemContent>
            </Item>
          </FramePanel>
        ))}
      </GridFrame>
      <Dialog
        open={!!sharing}
        onOpenChange={(open) => {
          if (!open) setSharing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share project</DialogTitle>
            <DialogDescription>{sharing?.title} · sample preview link</DialogDescription>
          </DialogHeader>
          <Input aria-label="Project share link" readOnly value={url} />
          <Button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            <Copy />
            {copied ? "Copied" : "Copy project link"}
          </Button>
        </DialogContent>
      </Dialog>
    </Stage>
  );
}

export function LinkedMetrics() {
  return (
    <Stage id={26}>
      <div className="extended-independent-grid">
        {[
          {
            label: "Total Orders",
            title: "Analytics",
            description: "Track every order and monitor growth trends with real-time updates.",
            icon: ShoppingBag,
          },
          {
            label: "Revenue",
            title: "Financial Summary",
            description: "Get instant insights into earnings and cash flow performance.",
            icon: TrendingUp,
          },
          {
            label: "Shipments",
            title: "Logistics",
            description: "Stay on top of deliveries and track shipment statuses efficiently.",
            icon: Package,
          },
        ].map(({ label, title, description, icon: Icon }) => (
          <Frame key={label}>
            <FrameHeader>
              <FrameTitle className="flex items-center gap-2 font-medium">
                <Icon className="size-4 text-muted-foreground" />
                {label}
              </FrameTitle>
            </FrameHeader>
            <FramePanel className="flex flex-col gap-2">
              <FrameTitle>
                <ContentLink title={title} description={description}>
                  {title}
                </ContentLink>
              </FrameTitle>
              <FrameDescription className="text-xs leading-5">{description}</FrameDescription>
            </FramePanel>
          </Frame>
        ))}
      </div>
    </Stage>
  );
}
