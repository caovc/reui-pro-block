import type { BlockProps } from "@/data/types";
import { LiveCartHero } from "./live-cart";
import { BentoShopHero } from "./bento";
import { CountdownDealHero } from "./countdown";

export function ShopHeroVariants({ block }: BlockProps) {
  switch (block.index) {
    case 0:
      return <LiveCartHero />;
    case 1:
      return <BentoShopHero />;
    case 2:
      return <CountdownDealHero />;
    default:
      throw new Error(`Shop Hero ${block.id} is outside this refined batch`);
  }
}
