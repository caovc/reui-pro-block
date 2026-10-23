import jacket from "./assets/jacket.jpg";
import shirt from "./assets/shirt.jpg";

export const receiptOrder = {
  id: "HLD-2026-18042",
  receipt: "RCT-2026-018042",
  date: "May 18, 2026",
  email: "jordan@example.com",
  customer: "Jordan Reeves",
  address: ["180 Bedford Avenue", "Apt 4F", "Brooklyn, NY 11211", "United States"],
  card: "Visa · 4242",
  expiry: "04 / 28",
  charged: "May 18, 2026 at 9:42 AM",
  tracking: "1Z999AA10123456784",
  carrier: "UPS Ground",
  arrival: "May 22, 2026 to May 25, 2026",
  subtotal: 669,
  shipping: 12,
  discount: 100.35,
  tax: 51.27,
  total: 631.92,
};

export const receiptItems = [
  {
    id: "jacket",
    name: "Field Shell Jacket",
    detail: "Olive · M",
    qty: 1,
    price: 185,
    image: jacket,
  },
  { id: "vest", name: "Compass Down Vest", detail: "Slate · M", qty: 1, price: 228, image: jacket },
  { id: "shirt", name: "Linen Field Shirt", detail: "Sand · M", qty: 2, price: 128, image: shirt },
];

export const receiptJourney = [
  {
    title: "Order placed",
    date: "May 18, 2026 · 9:42 AM",
    iso: "2026-05-18T09:42:00",
    description: "Your order was received.",
  },
  {
    title: "Payment authorized",
    date: "May 18, 2026 · 9:42 AM",
    iso: "2026-05-18T09:42:00",
    description: "Visa ending 4242 was authorized.",
  },
  {
    title: "Shipped",
    date: "May 19, 2026 · 3:18 PM",
    iso: "2026-05-19T15:18:00",
    description: "Your parcel has left the warehouse.",
  },
  {
    title: "In transit",
    date: "Expected May 20–22",
    iso: "2026-05-20",
    description: "The next carrier scan will appear here.",
  },
  {
    title: "Delivered",
    date: "Estimated May 22–25",
    iso: "2026-05-25",
    description: "Delivery is expected in Brooklyn, NY.",
  },
];

export const receiptMoney = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export function receiptText() {
  const order = receiptOrder;
  return [
    "ORDER RECEIPT · REUI INDEPENDENT DEMO",
    `Receipt: ${order.receipt}`,
    `Order: ${order.id}`,
    `Date: ${order.date}`,
    `Customer: ${order.customer} <${order.email}>`,
    "",
    ...receiptItems.map(
      (item) =>
        `${item.name} | ${item.detail} | ${item.qty} x ${receiptMoney(item.price)} | ${receiptMoney(item.price * item.qty)}`,
    ),
    "",
    `Subtotal: ${receiptMoney(order.subtotal)}`,
    `Shipping: ${receiptMoney(order.shipping)}`,
    `Discount (WELCOME15): -${receiptMoney(order.discount)}`,
    `Tax: ${receiptMoney(order.tax)}`,
    `TOTAL PAID: ${receiptMoney(order.total)}`,
    "",
    `Payment: ${order.card}`,
    `Charged: ${order.charged}`,
    "",
    `Ship to: ${order.customer}`,
    ...order.address,
    "",
    `Tracking: ${order.tracking}`,
    `${order.carrier} | Arrives ${order.arrival}`,
    "",
    "This independent preview is a local demonstration. No payment or shipment was created.",
  ].join("\n");
}

export function downloadReceiptFile(content: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Minimal self-contained PDF export: ordinary receipt data, no remote request or PDF dependency.
 * Free UI libraries supply presentation components, not document serialization. */
export function downloadReceiptPdf() {
  const lines = receiptText()
    .normalize("NFKD")
    .replace(/[^\x20-\x7E\n]/g, "-")
    .split("\n");
  const escape = (text: string) =>
    text.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
  const stream = `BT /F1 10 Tf 45 795 Td 14 TL ${lines.map((line, i) => `${i ? "T* " : ""}(${escape(line)}) Tj`).join("\n")} ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  downloadReceiptFile(pdf, `${receiptOrder.receipt}.pdf`, "application/pdf");
}
