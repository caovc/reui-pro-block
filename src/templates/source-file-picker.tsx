// Actual REUI free c-combobox-21 single-picker composition. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-combobox-21.json
// https://reui.io/r/base-nova/c-combobox-21.json
// Reuses the already-installed official Combobox and existing modal portal pattern.
// Both official registry recipes share the genuine Base UI Combobox primitive.
import { useState, type ComponentProps, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";

type TemplateSourceFilePickerProps = {
  filenames: string[];
  filename: string;
  onValueChange: (filename: string) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  portalContainer: ComponentProps<typeof ComboboxContent>["portalContainer"];
};

export default function TemplateSourceFilePicker({
  filenames,
  filename,
  onValueChange,
  triggerRef,
  portalContainer,
}: TemplateSourceFilePickerProps) {
  // Query is independent of the selected filename: opening renders every file
  // in its original Object.keys order. Only an actual user query filters it.
  const [query, setQuery] = useState("");

  return (
    <Combobox
      items={filenames}
      value={filename}
      inputValue={query}
      onInputValueChange={setQuery}
      onOpenChange={(open, details) => {
        if (!open) {
          setQuery("");
          if (
            (details.reason === "escape-key" || details.reason === "item-press") &&
            triggerRef.current?.isConnected
          ) {
            // Return focus before the input disappears, so the parent modal
            // does not queue its own surface restoration after finalFocus.
            triggerRef.current.focus({ preventScroll: true });
          }
        }
      }}
      onValueChange={(value) => {
        if (value !== null) onValueChange(value);
      }}
      autoHighlight
      modal={false}
      limit={-1}
    >
      <ComboboxTrigger
        ref={triggerRef}
        aria-label="Template source file"
        className="min-w-0 flex-1 basis-56"
        render={
          <Button type="button" variant="outline" className="w-full justify-between font-normal" />
        }
      >
        <ComboboxValue>
          {(selectedFilename: string | null) => (
            <span className="truncate">{selectedFilename}</span>
          )}
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent
        portalContainer={portalContainer}
        finalFocus={triggerRef}
        className="max-w-(--anchor-width) min-w-(--anchor-width)"
      >
        <ComboboxInput
          showTrigger={false}
          placeholder="Find a source file…"
          aria-label="Search source files"
          className="mb-1"
        />
        <ComboboxEmpty>No files found.</ComboboxEmpty>
        <ComboboxList>
          {(name: string) => (
            <ComboboxItem key={name} value={name}>
              {name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
