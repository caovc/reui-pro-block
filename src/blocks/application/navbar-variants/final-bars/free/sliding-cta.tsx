// Actual official free ReUI c-button-53, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-button-53.json
// Upstream SHA256: 305f139a093b3486e83563085f840c74a70113a2b8607f8d822360396b1a9a67
// Preserves the complete named hover-group/label/arrow transition composition.
// Adds keyboard focus-visible parity and reduced-motion support; no hand-drawn icons.
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SlidingStartButton({ onStart }: { onStart: () => void }) {
  return (
    <Button onClick={onStart} className="group/sliding relative overflow-hidden rounded-full px-6">
      <span className="inline-flex items-center transition-transform duration-300 group-hover/sliding:-translate-x-2 group-focus-visible/sliding:-translate-x-2 motion-reduce:transition-none">
        Get Started
      </span>
      <ArrowRight
        aria-hidden="true"
        className="absolute right-2.5 translate-x-8 opacity-0 transition-all duration-300 group-hover/sliding:translate-x-0 group-hover/sliding:opacity-100 group-focus-visible/sliding:translate-x-0 group-focus-visible/sliding:opacity-100 motion-reduce:transition-none"
      />
    </Button>
  );
}
