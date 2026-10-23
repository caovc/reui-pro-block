import { Clock3, TicketPercent } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { campaigns, type CouponCampaign } from "./data";
import { couponCampaignArtwork } from "./artwork";
import {
  CouponCodePanel,
  CouponExpiry,
  CouponShopPreview,
  CouponTermsDialog,
  CouponTermsList,
} from "./shared";

function CampaignContent({ campaign }: { campaign: CouponCampaign }) {
  const compact = campaign.variant === 4;
  return (
    <div className={cn("flex min-w-0 flex-col gap-6", compact ? "p-6 sm:p-8" : "p-6 sm:p-10")}>
      <CardHeader className="gap-6 px-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              campaign.variant === 1 ? "destructive" : campaign.variant === 3 ? "info" : "secondary"
            }
            className="font-normal"
          >
            {compact && <TicketPercent className="size-3" />}
            {campaign.eyebrow}
          </Badge>
          {!compact && campaign.expiry && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" />
              {campaign.expiry}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <CardTitle
            className={cn(
              "font-semibold tracking-tight",
              compact ? "text-2xl sm:text-3xl" : "max-w-[360px] text-[30px] sm:text-4xl",
              compact ? "leading-tight" : "leading-[1.2] sm:leading-[1.1]",
            )}
          >
            <h1>
              {compact ? (
                campaign.heading
              ) : (
                <>
                  {campaign.heading.split(" off ")[0]}
                  <br />
                  off {campaign.heading.split(" off ")[1]}
                </>
              )}
            </h1>
          </CardTitle>
          <CardDescription className={cn("leading-6", !compact && "sm:text-base")}>
            {campaign.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-0">
        <CouponCodePanel code={campaign.code} />
        {compact && campaign.expiry && (
          <div className="py-2">
            <CouponExpiry text={campaign.expiry} minimum={campaign.minimum} />
          </div>
        )}
        <CouponTermsList terms={campaign.terms} />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-1 border-0 bg-transparent p-0">
        <CouponShopPreview campaign={campaign} />
        <CouponTermsDialog campaign={campaign} />
      </CardFooter>
    </div>
  );
}

export function CouponCampaignHero({ member = false }: { member?: boolean }) {
  const campaign = campaigns[member ? 3 : 1];
  const image = (
    <div className="relative h-56 md:h-auto">
      <img
        src={couponCampaignArtwork(member)}
        alt={
          member
            ? "Original gift-paper shopping-bag still life"
            : "Original summer coat and shopping-bag illustration"
        }
        className="absolute inset-0 size-full object-cover"
      />
    </div>
  );
  return (
    <main
      className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10"
      data-coupon-variant={campaign.variant}
    >
      {member ? (
        <Frame spacing="xs">
          <FramePanel className="grid gap-0 p-0 md:grid-cols-[1.1fr_1fr]">
            <CampaignContent campaign={campaign} />
            {image}
          </FramePanel>
        </Frame>
      ) : (
        <Card className="grid gap-0 p-0 md:grid-cols-[1.1fr_1fr]">
          <CampaignContent campaign={campaign} />
          {image}
        </Card>
      )}
    </main>
  );
}

export function CouponTermsCard() {
  return (
    <main className="mx-auto max-w-[512px] px-4 py-6 sm:px-8 sm:py-8" data-coupon-variant="4">
      <Card className="gap-0 p-0">
        <CampaignContent campaign={campaigns[4]} />
      </Card>
    </main>
  );
}
