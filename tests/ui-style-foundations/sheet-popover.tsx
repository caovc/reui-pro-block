import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { uiFoundation } from "@/lib/ui-foundation";
import "@/index.css";

export function SheetPopoverFixture() {
  return (
    <main className="flex gap-4 p-12" data-library={uiFoundation.primitive}>
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet title</SheetTitle>
            <SheetDescription>Sheet description</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button>Save changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Popover>
        <PopoverTrigger asChild>
          <Button>Open popover</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Example popover">
          <PopoverHeader>
            <PopoverTitle>Popover title</PopoverTitle>
            <PopoverDescription>Popover description</PopoverDescription>
          </PopoverHeader>
          <Button>Update</Button>
        </PopoverContent>
      </Popover>
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open custom sheet</Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="gap-2 rounded-xl shadow-none">
          <SheetHeader className="px-5 pt-3">
            <SheetTitle className="text-xl font-bold tracking-normal normal-case">
              Custom sheet title
            </SheetTitle>
          </SheetHeader>
          <SheetFooter className="p-0" />
        </SheetContent>
      </Sheet>
      <Popover>
        <PopoverTrigger asChild>
          <Button>Open custom popover</Button>
        </PopoverTrigger>
        <PopoverContent
          aria-label="Custom popover"
          className="w-44 gap-y-1 rounded-sm px-0 pt-0 text-lg shadow-none ring-foreground/25"
        >
          <PopoverHeader>
            <PopoverTitle className="text-xl font-bold normal-case">
              Custom popover title
            </PopoverTitle>
            <PopoverDescription className="mt-0 text-base">
              Custom popover description
            </PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<SheetPopoverFixture />);
