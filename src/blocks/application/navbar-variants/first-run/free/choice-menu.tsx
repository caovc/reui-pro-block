// Actual official free REUI c-dropdown-menu-7, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-dropdown-menu-7.json
// Upstream source SHA256: 3b01e43ffa25ca9fea8da20c7e7936e28a855da6d5d8f3aada6f193c53255ec7
// Adaptations documented in docs/navbar1-3-implementation.md.
"use client";

import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export function ChoiceMenu({
  label,
  value: position,
  onChange: setPosition,
  options,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label={label} className="w-fit">
            <Icon data-icon="inline-start" />
            {label}
            <ChevronDown data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
              {options.map((option) => (
                <DropdownMenuRadioItem key={option} value={option}>
                  {option}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
