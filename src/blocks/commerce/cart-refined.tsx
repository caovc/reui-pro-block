import type { BlockProps } from "@/data/types";
import {
  SaveForLaterCart,
  DeliverySummaryCart,
  DataTableCart,
  PickupOptionCart,
  PaymentMethodCart,
} from "./cart-pages";
import { CartDropdown, AddToCartDrawer } from "./cart-overlays";
export function CartRefined({ block }: BlockProps) {
  switch (block.index) {
    case 1:
      return <DeliverySummaryCart />;
    case 2:
      return <DataTableCart />;
    case 3:
      return <PickupOptionCart />;
    case 4:
      return <PaymentMethodCart />;
    case 5:
      return <CartDropdown />;
    case 6:
      return <AddToCartDrawer />;
    default:
      return <SaveForLaterCart />;
  }
}
export default CartRefined;
