import { CreditCard, Download } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { commerceInvoices, type CommerceInvoice } from "./commerce-settings-data";
import type { CommerceSettingsModel } from "./commerce-settings-model";

const money = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

/** A small original, valid one-page PDF fixture; not a payment receipt or PDF rendering engine. */
function downloadDemoInvoice(invoice: CommerceInvoice) {
  const lines = [
    "Bricklane local demo billing",
    "LOCAL DEMO - NOT A PAYMENT RECEIPT",
    `${invoice.id} - ${invoice.date}`,
    `Sample amount: ${money(invoice.amount)}`,
    "No payment was processed and no subscription was charged.",
  ];
  const escapeText = (value: string) => value.replace(/[\\()]/g, "\\$&");
  const content = `BT /F1 13 Tf 48 740 Td ${lines.map((line, index) => `${index ? "0 -26 Td " : ""}(${escapeText(line)}) Tj`).join("\n")} ET\n`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${invoice.id.toLowerCase()}-sample.pdf`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function Usage({ label, detail, value }: { label: string; detail: string; value: number }) {
  return (
    <div className="csd-usage-row">
      <div>
        <span>{label}</span>
        <span>{detail}</span>
      </div>
      <Progress value={Math.max(0, Math.min(100, value))} aria-label={`${label} usage`} />
    </div>
  );
}

export function CommerceBillingSettings({
  model,
  orderUsage = { count: 24, label: "Orders this month" },
}: {
  model: CommerceSettingsModel;
  orderUsage?: { count: number; label: string };
}) {
  const orderCount = Number.isFinite(orderUsage.count)
    ? Math.max(0, Math.floor(orderUsage.count))
    : 0;
  return (
    <>
      <header className="csd-page-heading">
        <h1>Billing</h1>
      </header>
      <div className="csd-billing-stack">
        <Frame dense className="csd-frame">
          <FrameHeader className="csd-plan-heading">
            <div>
              <FrameTitle>Growth plan</FrameTitle>
              <FrameDescription>$59 / month · renews Nov 1, 2026</FrameDescription>
            </div>
            <Badge variant="success-light">Active</Badge>
          </FrameHeader>
          <FramePanel fit className="csd-usage-panel">
            <Usage
              label={orderUsage.label}
              detail={`${orderCount} / 2000`}
              value={orderCount / 20}
            />
            <Usage
              label="Staff seats"
              detail={`${model.members.length} / 10`}
              value={model.members.length * 10}
            />
            <Usage label="Media storage" detail="2.4 GB / 10 GB" value={24} />
          </FramePanel>
          <FrameFooter>
            <Button
              variant="outline"
              onClick={() =>
                model.announce("Cancel plan is a local demo. No subscription was cancelled.")
              }
            >
              Cancel plan
            </Button>
            <Button
              onClick={() =>
                model.announce(
                  "Change plan: the plan picker is a demo in this template. No subscription was changed.",
                )
              }
            >
              Change plan
            </Button>
          </FrameFooter>
        </Frame>
        <Frame dense className="csd-frame">
          <FrameHeader>
            <FrameTitle>Payment method</FrameTitle>
            <FrameDescription>Charged each billing cycle</FrameDescription>
          </FrameHeader>
          <FramePanel fit className="csd-fit-panel">
            <Item>
              <ItemMedia variant="icon" className="csd-record-icon">
                <CreditCard aria-hidden="true" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Visa ending 4242</ItemTitle>
                <ItemDescription>Expires 10 / 2028</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    model.announce(
                      "Payment method update is a demo. No card data was collected or changed.",
                    )
                  }
                >
                  Update
                </Button>
              </ItemActions>
            </Item>
          </FramePanel>
        </Frame>
        <Frame dense className="csd-frame">
          <FrameHeader>
            <FrameTitle>Invoices</FrameTitle>
            <FrameDescription>Receipts for your records</FrameDescription>
          </FrameHeader>
          <FramePanel fit className="csd-fit-panel">
            <Table className="csd-invoice-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commerceInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{money(invoice.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="success-light">{invoice.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Download demo PDF for ${invoice.date}`}
                        onClick={() => downloadDemoInvoice(invoice)}
                      >
                        <Download aria-hidden="true" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </FramePanel>
        </Frame>
      </div>
    </>
  );
}
