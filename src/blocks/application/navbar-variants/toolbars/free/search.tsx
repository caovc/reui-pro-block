// Actual official free REUI c-command-5. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-command-5.json
// Upstream source SHA256: a6fbf8279a0d9de2fe0aa576eb00a637dd288e4029f64c93ba5ab03b18d60e43
// Controlled data/icon/handler adaptations recorded in docs/navbar4-6-implementation.md.
"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/reui/badge";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { File, Search } from "lucide-react";

const files = [
  { name: "page.tsx", path: "src/app/page.tsx", type: "tsx" },
  { name: "layout.tsx", path: "src/app/layout.tsx", type: "tsx" },
  { name: "globals.css", path: "src/styles/globals.css", type: "css" },
  { name: "utils.ts", path: "src/lib/utils.ts", type: "ts" },
  { name: "api.ts", path: "src/lib/api.ts", type: "ts" },
  { name: "button.tsx", path: "src/components/ui/button.tsx", type: "tsx" },
  { name: "package.json", path: "package.json", type: "json" },
  { name: "README.md", path: "README.md", type: "md" },
];

export function ToolbarSearch({ onSelect }: { onSelect: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (trigger.current?.closest("[inert]") || !trigger.current?.getClientRects().length) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Button
        ref={trigger}
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="toolbar-search-trigger"
        aria-label="Search workspace"
      >
        <Search aria-hidden="true" />
        <span className="toolbar-search-label">Search anything...</span>
        <Kbd className="ml-auto">⌘K</Kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search workspace"
        description="Search demo files locally."
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.current?.focus({ preventScroll: true });
        }}
      >
        <Command className="**:data-[selected=true]:bg-muted **:data-selected:bg-transparent">
          <CommandInput placeholder="Search files by name..." />
          <CommandList>
            <CommandEmpty>No files found.</CommandEmpty>
            <CommandGroup heading="Files">
              {files.map((file) => (
                <CommandItem
                  key={file.path}
                  value={`${file.name} ${file.path}`}
                  className="gap-2.5"
                  onSelect={() => {
                    onSelect(file.path);
                    setOpen(false);
                  }}
                >
                  <File aria-hidden="true" />
                  <div className="flex flex-1 items-center gap-2">
                    <span className="font-medium">{file.name}</span>
                    <span className="text-muted-foreground truncate text-xs">{file.path}</span>
                  </div>
                  <div className="ml-auto" data-slot="command-shortcut">
                    <Badge variant="outline" size="sm">
                      {file.type}
                    </Badge>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
