// Actual official free ReUI c-dropdown-menu-7 radio selection, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-dropdown-menu-7.json
// Upstream SHA256: 3b01e43ffa25ca9fea8da20c7e7936e28a855da6d5d8f3aada6f193c53255ec7
// Uses documented design-source labels and original Lucide substitutes, not provider logos.
import { ChevronDown, Code2, FilePenLine, Terminal } from "lucide-react";
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
import { syncSources, type SyncSource } from "../data";

const sourceIcons = { shadcn: Code2, Cursor: Terminal, Paper: FilePenLine };

export function SyncPicker({
  value,
  onChange,
}: {
  value: SyncSource;
  onChange: (value: SyncSource) => void;
}) {
  const Icon = sourceIcons[value];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" aria-label="Sync source">
          <Icon data-icon="inline-start" />
          <span className="developer-sync-prefix">Sync from</span> {value}
          <ChevronDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sync source</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next) => onChange(next as SyncSource)}
          >
            {syncSources.map((source) => {
              const SourceIcon = sourceIcons[source];
              return (
                <DropdownMenuRadioItem key={source} value={source}>
                  <SourceIcon aria-hidden="true" />
                  {source}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
