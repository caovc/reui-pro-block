import type { BlockProps } from "@/data/types";
import { CategoryBrowser, FilterSidebar } from "./catalog";
import { WishlistShopping } from "./wishlist-shopping";
import { WishlistCollections } from "./wishlist-collection-pages";
import { ReceiptDocuments } from "./receipt-refined";
import { ReceiptPostPurchase } from "./receipt-post-purchase";
import Checkout from "./checkout-refined";
import ShoppingCart from "./cart-refined";
import { Comparison, ShopHero } from "./promotions";
import { CouponVariants } from "./coupon-variants";
import { Blog, FAQ, Contact, MarketingCompare } from "./marketing";
import { Hero, CTA, HowItWorks } from "./heroes";
import { Pricing } from "./pricing";
import { ProductCards } from "./product-cards";
import { ReviewLists } from "./review-list-pages";
import { ReviewCarousels } from "./review-carousel-pages";
import { ProductDetails } from "./product-details";
import { ProductGrids } from "./product-grids";

/** Original implementations using open source shadcn primitives and public preview briefs. */
export default function CommerceBlock({ block }: BlockProps) {
  switch (block.category) {
    case "category-card":
      return <CategoryBrowser key={block.id} block={block} />;
    case "product-card":
      return <ProductCards key={block.id} block={block} />;
    case "product-grid":
      return <ProductGrids key={block.id} block={block} />;
    case "product-detail":
      return <ProductDetails key={block.id} block={block} />;
    case "filter-sidebar":
      return <FilterSidebar key={block.id} block={block} />;
    case "checkout":
      return <Checkout key={block.id} block={block} />;
    case "shopping-cart":
      return <ShoppingCart key={block.id} block={block} />;
    case "wishlist":
      return block.index < 3 ? (
        <WishlistShopping key={block.id} block={block} />
      ) : (
        <WishlistCollections key={block.id} block={block} />
      );
    case "receipt":
      return block.index < 3 ? (
        <ReceiptDocuments block={block} />
      ) : (
        <ReceiptPostPurchase block={block} />
      );
    case "coupon":
      return <CouponVariants key={block.id} block={block} />;
    case "comparison":
      return <Comparison key={block.id} block={block} />;
    case "review":
      return [0, 4, 5].includes(block.index) ? (
        <ReviewCarousels block={block} />
      ) : (
        <ReviewLists block={block} />
      );
    case "shop-hero":
      return <ShopHero key={block.id} block={block} />;
    case "blog":
      return <Blog key={block.id} block={block} />;
    case "faq":
      return <FAQ key={block.id} block={block} />;
    case "contact":
      return <Contact key={block.id} block={block} />;
    case "compare":
      return <MarketingCompare key={block.id} block={block} />;
    case "hero":
      return <Hero key={block.id} block={block} />;
    case "cta":
      return <CTA key={block.id} block={block} />;
    case "how-it-works":
      return <HowItWorks key={block.id} block={block} />;
    case "pricing":
      return <Pricing key={block.id} block={block} />;
    default:
      throw new Error(`Unsupported commerce block: ${block.category}/${block.id}`);
  }
}
