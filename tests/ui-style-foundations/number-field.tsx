import { Minus } from "lucide-react";
import { createRoot } from "react-dom/client";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { applyTheme, readTheme } from "@/components/site/preview-theme";
import "@/index.css";

const sizes = [
  { value: "sm", name: "Small" },
  { value: "default", name: "Standard" },
  { value: "lg", name: "Large" },
] as const;

applyTheme(readTheme(new URLSearchParams(location.search)), false);

createRoot(document.getElementById("root")!).render(
  <main className="mx-auto grid max-w-sm gap-5 p-6">
    {sizes.map(({ value, name }) => (
      <section key={value} aria-label={name} className="grid gap-2">
        <h2>{name}</h2>
        <NumberField defaultValue={10} min={0} max={100} size={value}>
          <NumberFieldGroup>
            <NumberFieldDecrement aria-label={`Decrease ${name}`} />
            <NumberFieldInput aria-label={`${name} amount`} />
            <NumberFieldIncrement aria-label={`Increase ${name}`} />
          </NumberFieldGroup>
        </NumberField>
      </section>
    ))}
    <section aria-label="Caller overrides" dir="rtl" className="grid gap-2">
      <h2>Caller overrides</h2>
      <NumberField defaultValue={10}>
        <NumberFieldGroup className="h-10 rounded-[13px]">
          <NumberFieldDecrement className="rounded-s-[13px] px-2.5" aria-label="Decrease custom">
            <Minus className="size-5" />
          </NumberFieldDecrement>
          <NumberFieldInput className="px-3.5 py-2" aria-label="Custom amount" />
          <NumberFieldIncrement
            size="sm"
            className="rounded-e-[13px]"
            aria-label="Increase custom"
          />
        </NumberFieldGroup>
      </NumberField>
    </section>
  </main>,
);
