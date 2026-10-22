import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Box,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  FileText,
  Folder,
  Globe,
  Heart,
  Layers,
  Link,
  MapPin,
  Package,
  Shield,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Metric, More, Team, toast } from "./shared";
import type { BlockProps } from "@/data/types";
export default function CardsBlock({ block }: BlockProps) {
  const [connected, setConnected] = useState(false);
  const [saved, setSaved] = useState(false);
  const [step, setStep] = useState(1);
  const n = block.name;
  const numeric = Number(block.id.split("-").pop());
  const metric =
    /KPI|Metric|Stats|Counters|Balance|Price|Snapshot|Stat Strip/.test(n);
  const profile = /Profile|Applicant|Customer|Contributor|Investor/.test(n);
  const integration = /Integration|Connector/.test(n);
  const setup = /Setup|Numbered/.test(n);
  const delivery = /Delivery/.test(n);
  const links = /Link|Shortcut|Guide|Hub|Topic|Launcher/.test(n);
  const promo = /Promo|Upsell/.test(n);
  const status = /Status|Compliance/.test(n);
  const logo = /Brand Logo|Partner/.test(n);
  const schedule = /Agenda|Deadline/.test(n);
  return (
    <div className="mx-auto flex min-h-[420px] max-w-5xl flex-col justify-center gap-6 p-6 md:p-10">
      {metric ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{n}</h2>
            <Badge variant="outline">This month</Badge>
          </div>
          <div
            className={`grid gap-4 ${/Strip/.test(n) ? "lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"}`}
          >
            {(/Inventory|Logistics/.test(n)
              ? ["Total inventory", "Orders fulfilled", "Awaiting delivery"]
              : /Fitness/.test(n)
                ? ["Steps today", "Active minutes", "Calories burned"]
                : /Balance|Price/.test(n)
                  ? ["Total balance", "Available funds", "Monthly return"]
                  : ["Total revenue", "New customers", "Conversion rate"]
            ).map((t, i) => (
              <Metric
                key={t}
                title={t}
                value={
                  /Fitness/.test(n)
                    ? ["8,420", "48 min", "1,680 kcal"][i]
                    : ["$48,295", "2,420", "4.28%"][i]
                }
                index={numeric + i}
              />
            ))}
          </div>
          {/Area|Trend|Shared/.test(n) && (
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">Performance over time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-28 items-end gap-3">
                  {Array.from({ length: 16 }, (_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-primary/70"
                      style={{
                        height: `${30 + ((i * 17 + numeric * 7) % 70)}%`,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
                  <span>Oct 1</span>
                  <span>Oct 8</span>
                  <span>Oct 15</span>
                  <span>Oct 22</span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : profile ? (
        <Card className="mx-auto w-full max-w-md overflow-hidden py-0 shadow-none">
          <div className="h-24 border-b bg-muted/70" />
          <CardHeader className="relative -mt-12 gap-4">
            <div className="flex items-end justify-between">
              <Avatar className="size-20 border-4 border-background">
                <AvatarFallback className="text-xl">JM</AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSaved(!saved);
                  toast(saved ? "Removed from saved" : "Added to saved");
                }}
              >
                <Heart className={saved ? "fill-current" : ""} />
                {saved ? "Saved" : "Save"}
              </Button>
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                Jordan Miller
                <CheckCircle2 className="size-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription className="mt-1">
                {n.includes("Investor")
                  ? "Managing Partner at Horizon Capital"
                  : n.includes("Applicant")
                    ? "Senior Product Designer"
                    : "Product designer & builder"}
              </CardDescription>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                San Francisco, California
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Building thoughtful products and investing in people who care
              about the details.
            </p>
            <div className="grid grid-cols-3 gap-3 border-y py-4 text-center">
              {[
                ["24", "Projects"],
                ["1.2k", "Connections"],
                ["8 yrs", "Experience"],
              ].map(([v, t]) => (
                <div key={t}>
                  <p className="text-lg font-semibold">{v}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{t}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {["Product design", "Strategy", "Leadership"].map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter className="gap-2 pb-6">
            <Button
              className="flex-1"
              onClick={() => {
                setConnected(!connected);
                toast.success(
                  connected ? "Connection removed" : "Connection request sent",
                );
              }}
            >
              {connected ? "Requested" : "Connect"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => toast("Message composer opened")}
            >
              Message
            </Button>
          </CardFooter>
        </Card>
      ) : integration ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {["Linear", "Slack"].map((name, i) => (
            <Card key={name} className="shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Avatar className="size-12 rounded-xl">
                    <AvatarFallback className="rounded-xl text-lg font-bold">
                      {name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <More />
                </div>
                <CardTitle className="mt-4 text-lg">{name}</CardTitle>
                <CardDescription>
                  {i
                    ? "Bring your team conversations into your workspace."
                    : "Keep your issues and projects perfectly in sync."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Integration status
                  </span>
                  <Badge variant="outline">
                    {connected ? "Connected" : "Not connected"}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={connected ? "outline" : "default"}
                  onClick={() => {
                    setConnected(!connected);
                    toast.success(
                      connected
                        ? "Integration disconnected"
                        : "Integration connected",
                    );
                  }}
                >
                  {connected ? "Disconnect" : "Connect integration"}
                  <ArrowUpRight />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : setup ? (
        <Card className="mx-auto w-full max-w-xl shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Get your workspace ready</CardTitle>
            <CardDescription>
              A few simple steps to unlock your team’s potential.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {[
              "Create your workspace",
              "Invite your team",
              "Connect your tools",
              "Launch your first project",
            ].map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i + 1)}
                className="flex items-center gap-4 text-left"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full border text-sm ${i < step ? "bg-foreground text-background" : "bg-muted"}`}
                >
                  {i < step ? <Check className="size-4" /> : i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{s}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {i < step ? "Completed" : "Takes less than a minute"}
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))}
            <Progress value={(step / 4) * 100} />
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => {
                setStep(Math.min(4, step + 1));
                if (step === 4) toast.success("Setup complete");
              }}
            >
              {step === 4 ? "Complete setup" : "Continue setup"}
              <ArrowRight />
            </Button>
          </CardFooter>
        </Card>
      ) : delivery ? (
        <Card className="mx-auto w-full max-w-md shadow-none">
          <CardHeader className="flex flex-row justify-between">
            <div>
              <CardTitle className="text-base">
                Your order is on the way
              </CardTitle>
              <CardDescription className="mt-1">
                Order #ACM-10428
              </CardDescription>
            </div>
            <Truck className="size-6" />
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">
                Estimated delivery
              </p>
              <p className="mt-1 text-xl font-semibold">Friday, October 23</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Between 9:00 AM – 6:00 PM
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-5">
              {[
                "Order confirmed",
                "Packed & dispatched",
                "Out for delivery",
                "Delivered",
              ].map((t, i) => (
                <div className="flex items-center gap-3" key={t}>
                  <span
                    className={`flex size-6 items-center justify-center rounded-full border ${i < 3 ? "bg-foreground text-background" : ""}`}
                  >
                    {i < 3 ? (
                      <Check className="size-3" />
                    ) : (
                      <Package className="size-3" />
                    )}
                  </span>
                  <span className="flex-1 text-xs">{t}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {i < 3 ? "Oct " + (20 + i) : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                toast("Tracking updated", {
                  description: "Your order is out for delivery.",
                })
              }
            >
              Track shipment
              <ArrowUpRight />
            </Button>
          </CardFooter>
        </Card>
      ) : status ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {["API services", "Database", "Web application"].map((s, i) => (
            <Card key={s} className="shadow-none">
              <CardHeader className="flex flex-row justify-between">
                <Shield className="size-5" />
                <Badge variant="outline">Operational</Badge>
              </CardHeader>
              <CardContent>
                <h3 className="text-sm font-semibold">{s}</h3>
                <p className="mt-2 text-2xl font-semibold">
                  {[99.99, 99.98, 100][i]}
                  <span className="text-sm text-muted-foreground">%</span>
                </p>
                <div className="mt-4 flex gap-1">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div
                      className="h-6 flex-1 rounded-sm bg-primary/70"
                      style={{ opacity: i === 14 ? 0.3 : 1 }}
                      key={i}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Uptime in the last 90 days
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : logo ? (
        <Card className="shadow-none">
          <CardHeader className="items-center text-center">
            <CardTitle className="text-lg">
              Trusted by teams that build great things
            </CardTitle>
            <CardDescription>
              Join thousands of forward-thinking companies.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-0 sm:grid-cols-3">
            {[
              "Layers",
              "Sisyphus",
              "Circooles",
              "Catalog",
              "Quotient",
              "Hourglass",
            ].map((s, i) => {
              const Icon = [Layers, Box, Globe, BookOpen, Zap, Clock][i];
              return (
                <button
                  className="flex items-center justify-center gap-2 border border-border/50 p-7 text-base font-semibold tracking-tight"
                  key={s}
                  onClick={() =>
                    toast(s, { description: "Partner profile selected" })
                  }
                >
                  <Icon className="size-5" />
                  {s}
                </button>
              );
            })}
          </CardContent>
        </Card>
      ) : schedule ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {["Product strategy workshop", "Design review & feedback"].map(
            (s, i) => (
              <Card key={s} className="shadow-none">
                <CardHeader>
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant="outline">{i ? "Tomorrow" : "Today"}</Badge>
                    <More />
                  </div>
                  <CardTitle className="text-base">{s}</CardTitle>
                  <CardDescription>
                    Align on what’s next and move forward together.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    10:00 – 11:00 AM · 60 min
                  </div>
                  <Team />
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      toast.success("You joined the meeting", {
                        description: s,
                      })
                    }
                  >
                    Join meeting
                    <ArrowUpRight />
                  </Button>
                </CardFooter>
              </Card>
            ),
          )}
        </div>
      ) : promo ? (
        <Card className="mx-auto w-full max-w-xl overflow-hidden shadow-none">
          <div className="flex h-36 items-center justify-center border-b bg-muted/60">
            <div className="flex size-16 items-center justify-center rounded-2xl border bg-background shadow-sm">
              <Zap className="size-8" />
            </div>
          </div>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              Your best work, without limits.
            </CardTitle>
            <CardDescription className="mx-auto max-w-sm leading-6">
              Unlock advanced features, more integrations, and the flexibility
              your growing team deserves.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              "Unlimited projects and collaborators",
              "Advanced analytics and reporting",
              "Priority support, whenever you need it",
            ].map((t) => (
              <div
                key={t}
                className="flex items-center justify-center gap-2 text-xs"
              >
                <Check className="size-3" />
                {t}
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button
              className="w-full"
              onClick={() =>
                toast("Pro plan selected", {
                  description: "This is a demo upgrade flow.",
                })
              }
            >
              Explore Pro
              <ArrowRight />
            </Button>
            <p className="text-[10px] text-muted-foreground">
              14-day free trial. No credit card required.
            </p>
          </CardFooter>
        </Card>
      ) : links ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Getting started",
            "Your workspace",
            "Team collaboration",
            "Integrations",
            "API reference",
            "Help & support",
          ].map((s, i) => {
            const Icon = [BookOpen, Folder, Users, Link, Code2, FileText][i];
            return (
              <Card key={s} className="gap-3 shadow-none">
                <CardHeader className="gap-4">
                  <span className="flex size-9 items-center justify-center rounded-lg border">
                    <Icon className="size-4" />
                  </span>
                  <CardTitle className="text-sm">{s}</CardTitle>
                  <CardDescription className="text-xs leading-5">
                    Everything you need to know to get the most out of Acme.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={() =>
                      toast(s, {
                        description: "Guide opened in the demo workspace.",
                      })
                    }
                  >
                    Read guide
                    <ArrowUpRight />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Built for your workflow",
            "Less busywork, more impact",
            "Connected from day one",
          ].map((s, i) => {
            const Icon = [Zap, Layers, Users][i];
            return (
              <Card key={s} className="shadow-none">
                <CardHeader>
                  <div className="mb-5 flex h-28 items-center justify-center rounded-lg bg-muted/50">
                    <Icon className="size-10 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base">{s}</CardTitle>
                  <CardDescription className="leading-6">
                    Thoughtfully designed tools that help your team focus on
                    what matters most.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      toast(s, { description: "Feature details selected" })
                    }
                  >
                    Learn more
                    <ArrowRight />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
