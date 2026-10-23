import type { BlockProps } from "@/data/types";
import { CouponCampaignHero, CouponTermsCard } from "./heroes";
import { CouponGrid } from "./grid";
import { CouponAnnouncement } from "./bars";

export function CouponVariants({ block }: BlockProps) {
  switch (block.index) {
    case 0:
      return <CouponCampaignHero />;
    case 1:
      return <CouponGrid />;
    case 2:
      return <CouponCampaignHero member />;
    case 3:
      return <CouponTermsCard />;
    case 4:
      return <CouponAnnouncement />;
    case 5:
      return <CouponAnnouncement dark />;
    default:
      throw new Error(`Unsupported coupon ${block.id}`);
  }
}
