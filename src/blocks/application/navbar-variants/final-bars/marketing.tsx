import { useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { PlaceholderPanel, ToolbarScene } from "../toolbars/support";
import { DemoContentCard } from "./free/content-card";
import { MarketingMegaMenu, type MarketingPage } from "./free/mega-menu";
import { SlidingStartButton } from "./free/sliding-cta";
import "./final-bars.css";

export default function MarketingMegaNavbar() {
  const [selected, setSelected] = useState<MarketingPage | null>(null);
  const header = useRef<HTMLElement>(null);
  return (
    <ToolbarScene id={12}>
      <header className="final-marketing-header" ref={header}>
        <div className="final-marketing-brand">
          <BrandMark className="size-8 shrink-0" />
          Bricklane
        </div>
        <MarketingMegaMenu onNavigate={setSelected} />
        <div className="final-marketing-action">
          <SlidingStartButton
            onStart={() =>
              setSelected({
                title: "Get started with Bricklane",
                description:
                  "Explore this independent component preview. No account or subscription is created.",
              })
            }
          />
        </div>
      </header>
      {selected ? (
        <div className="mt-6" aria-live="polite">
          <DemoContentCard
            label="Selected marketing page"
            title={selected.title}
            description={selected.description}
            actionLabel="Back to navigation"
            onAction={() => {
              setSelected(null);
              requestAnimationFrame(() => header.current?.querySelector("button")?.focus());
            }}
          >
            <p className="text-sm text-muted-foreground">
              This is an original local destination demonstration. It keeps the component preview on
              this page and does not open a financial product, send a message or create an account.
            </p>
          </DemoContentCard>
        </div>
      ) : (
        <PlaceholderPanel />
      )}
    </ToolbarScene>
  );
}
