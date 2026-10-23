import type { BlockProps } from "@/data/types";
import {
  OrderConfirmationReceipt,
  TillSlipReceipt,
  TrackingTimelineReceipt,
} from "./receipt-documents";

/** First independently verified receipt milestone: catalog entries1–3. */
export function ReceiptDocuments({ block }: BlockProps) {
  switch (block.index) {
    case 0:
      return <OrderConfirmationReceipt />;
    case 1:
      return <TrackingTimelineReceipt />;
    case 2:
      return <TillSlipReceipt />;
    default:
      throw new Error(`ReceiptDocuments does not own ${block.id}`);
  }
}
