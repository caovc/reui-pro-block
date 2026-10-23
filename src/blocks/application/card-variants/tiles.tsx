import {
  Activity,
  AlignJustify,
  BookOpen,
  ChartNoAxesCombined,
  CircleDollarSign,
  FileText,
  Flame,
  Shield,
  ShoppingCart,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Frame,
  FramePanel,
  FrameFooter,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { CardStage, FramedGrid, Brand, LocalLink } from "./common";

export function BrandLogoGrid() {
  return (
    <CardStage variant={1}>
      <div className="refined-brand-grid">
        {["Resend", "Stripe", "Supabase", "OpenAI", "Anthropic"].map((name) => (
          <Frame key={name} variant="inverse">
            <FramePanel className="flex h-[104px] items-center justify-center" fit>
              <IconTile variant="elevated" size="xl">
                <Brand name={name} />
              </IconTile>
            </FramePanel>
            <FrameFooter className="items-center">
              <LocalLink title={name}>{name}</LocalLink>
            </FrameFooter>
          </Frame>
        ))}
      </div>
    </CardStage>
  );
}

const features = [
  {
    title: "Performance",
    description: "Optimize speed and efficiency",
    icon: Activity,
  },
  {
    title: "Design System",
    description: "Build with consistent UI blocks",
    icon: AlignJustify,
  },
  {
    title: "User Security",
    description: "Simplify user and roles setup",
    icon: Shield,
  },
  {
    title: "Documentation",
    description: "Guides and best practices",
    icon: BookOpen,
  },
];
export function FeatureHighlights() {
  return (
    <CardStage variant={2}>
      <FramedGrid>
        {features.map(({ title, description, icon: Icon }) => (
          <FramePanel key={title} className="refined-pattern flex flex-col gap-5">
            <IconTile variant="elevated">
              <Icon />
            </IconTile>
            <div className="flex flex-col gap-1">
              <FrameTitle>
                <LocalLink title={title} description={description}>
                  {title}
                </LocalLink>
              </FrameTitle>
              <FrameDescription className="text-xs">{description}</FrameDescription>
            </div>
          </FramePanel>
        ))}
      </FramedGrid>
    </CardStage>
  );
}

const integrations = [
  {
    brand: "Resend",
    title: "Resend Email Flow",
    tier: "Premium",
    description:
      "Transactional email delivery tuned for speed, observability, and reliable event handling.",
    left: ShoppingCart,
    right: FileText,
  },
  {
    brand: "PayPal",
    title: "PayPal Checkout Flow",
    tier: "Regular",
    description: "Optimized payment processing for speed, reliability, and global reach.",
    left: Zap,
    right: Shield,
  },
  {
    brand: "Supabase",
    title: "Supabase Auth Integration",
    tier: "Enterprise",
    description:
      "Authentication and data access wired together for secure product onboarding and account recovery.",
    left: ShoppingCart,
    right: FileText,
  },
];
export function IntegrationConnector() {
  return (
    <CardStage variant={5}>
      <div className="refined-connect-grid">
        {integrations.map(({ brand, title, tier, description, left: Left, right: Right }, i) => (
          <Frame key={brand} variant="inverse">
            <FramePanel className="refined-connector refined-pattern" fit>
              <IconTile variant="elevated">
                <Left />
              </IconTile>
              <IconTile variant="elevated" size="xl">
                <Brand name={brand} />
              </IconTile>
              <IconTile variant="elevated">
                <Right />
              </IconTile>
            </FramePanel>
            <FrameFooter className="gap-2 px-3 pb-3 pt-2">
              <div className="flex items-start justify-between gap-2">
                <FrameTitle>
                  <LocalLink
                    title={title}
                    description={`${description} This integration is a local preview.`}
                  >
                    {title}
                  </LocalLink>
                </FrameTitle>
                <Badge
                  variant={i === 0 ? "info-light" : i === 1 ? "warning-light" : "success-light"}
                  size="sm"
                >
                  {tier}
                </Badge>
              </div>
              <FrameDescription className="line-clamp-2 text-xs leading-5">
                {description}
              </FrameDescription>
            </FrameFooter>
          </Frame>
        ))}
      </div>
    </CardStage>
  );
}

const steps = [
  {
    title: "Plan Setup",
    description: "Define goals and gather the essentials before starting.",
  },
  {
    title: "Configuration",
    description: "Adjust key settings to match your project needs.",
  },
  {
    title: "Integration",
    description: "Connect services and verify everything is running smoothly.",
  },
  {
    title: "Launch & Monitor",
    description: "Go live and keep track of performance metrics.",
  },
];
export function NumberedSetup() {
  return (
    <CardStage variant={6}>
      <FramedGrid>
        {steps.map(({ title, description }, i) => (
          <FramePanel key={title} className="flex min-h-[200px] flex-col justify-between gap-16">
            <h3 className="text-sm font-normal text-muted-foreground/60">0.{i + 1}</h3>
            <div className="flex flex-col gap-2">
              <FrameTitle>{title}</FrameTitle>
              <FrameDescription className="text-xs leading-5">{description}</FrameDescription>
            </div>
          </FramePanel>
        ))}
      </FramedGrid>
    </CardStage>
  );
}

const notices = [
  { title: "Reminder!", body: "Renewal coming up in 3 days on February 28th" },
  { title: "Tip!", body: "Try dark mode for better night viewing" },
  { title: "Update!", body: "New features added to your dashboard" },
  { title: "Alert!", body: "Renewal is coming up in 3 days on May 28th" },
];
export function NoticeCards() {
  return (
    <CardStage variant={11}>
      <FramedGrid>
        {notices.map(({ title, body }) => (
          <FramePanel key={title} className="refined-pattern flex flex-col gap-4">
            <h3 className="text-xs font-medium">{title}</h3>
            <p className="text-sm leading-6">{body}</p>
          </FramePanel>
        ))}
      </FramedGrid>
    </CardStage>
  );
}

const quickLinks = [
  { title: "Valuation", icon: Activity },
  { title: "Ledger", icon: BookOpen },
  { title: "Funding", icon: Shield },
  { title: "Cash Flow", icon: CircleDollarSign },
  { title: "Metrics", icon: ChartNoAxesCombined },
  { title: "Earnings", icon: TrendingUp },
];
export function QuickLinkTiles() {
  return (
    <CardStage variant={12}>
      <FramedGrid columns={3} className="refined-quick-grid">
        {quickLinks.map(({ title, icon: Icon }) => (
          <FramePanel key={title} className="refined-quick-tile">
            <Icon />
            <FrameTitle>
              <LocalLink title={title}>{title}</LocalLink>
            </FrameTitle>
          </FramePanel>
        ))}
      </FramedGrid>
    </CardStage>
  );
}

const partners = [
  {
    title: "Sponsors",
    description: "Checkout built for speed and consistent transaction high performance.",
    brands: ["MongoDB", "Hotmart", "Discord", "Solana"],
  },
  {
    title: "Affiliates",
    description: "Authorized partners promoting our services in multiple regions.",
    brands: ["Redis", "Supabase", "Stripe", "AppStore"],
  },
];
export function PartnerShowcase() {
  return (
    <CardStage variant={13}>
      <FramedGrid columns={2}>
        {partners.map(({ title, description, brands }) => (
          <FramePanel key={title} className="flex flex-col gap-4">
            <FrameTitle>
              <LocalLink title={title} description={description}>
                {title}
              </LocalLink>
            </FrameTitle>
            <FrameDescription>{description}</FrameDescription>
            <div className="flex gap-3 pt-1">
              {brands.map((name) => (
                <IconTile variant="elevated" key={name}>
                  {name === "Hotmart" ? <Flame className="text-warning" /> : <Brand name={name} />}
                </IconTile>
              ))}
            </div>
          </FramePanel>
        ))}
      </FramedGrid>
    </CardStage>
  );
}
