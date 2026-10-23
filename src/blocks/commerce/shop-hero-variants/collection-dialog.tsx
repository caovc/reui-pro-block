import { useState, type ReactNode } from "react";
import { ArrowLeft, Bookmark, BookmarkCheck, Search } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  collectionCategories,
  collectionPrice,
  productsForCategories,
  type CollectionCategory,
  type CollectionProduct,
} from "./collection-data";
import { CollectionSavedContext, useCollectionSaved } from "./collection-saved";

export function CollectionSaveProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);
  return (
    <CollectionSavedContext.Provider value={{ saved, setSaved }}>
      {children}
    </CollectionSavedContext.Provider>
  );
}

/** Local catalog routing; actual c-tabs-9, c-scroll-area-1, c-item-2 and c-toggle-10 compositions. */
export function CollectionBrowser({
  title,
  categories,
  children,
}: {
  title: string;
  categories: readonly CollectionCategory[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CollectionProduct | null>(null);
  const { saved, setSaved } = useCollectionSaved();
  const products = productsForCategories(categories);
  const tabs = [
    { id: "all", name: "All pieces" },
    ...collectionCategories.filter((category) => categories.includes(category.id)),
  ];
  const shown = products.filter(
    (product) =>
      (active === "all" || product.category === active) &&
      `${product.name} ${product.detail}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setSelected(null);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{selected ? selected.name : title}</DialogTitle>
          <DialogDescription>
            {selected
              ? selected.detail
              : `${products.length} original demo pieces. Browse a category, search and save your favorites.`}
          </DialogDescription>
        </DialogHeader>
        {selected ? (
          <ScrollArea className="h-[min(65dvh,35rem)] w-full">
            <div className="space-y-4 p-1">
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                <ArrowLeft className="size-4" />
                Back to collection
              </Button>
              <div className="grid gap-5 sm:grid-cols-2">
                <img
                  src={selected.image}
                  alt={selected.name}
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <div className="flex flex-col items-start gap-4 py-3">
                  <Badge variant="success-light">Small-batch essentials</Badge>
                  <h3 className="text-xl font-semibold leading-snug">{selected.name}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {selected.detail}. Independently illustrated for the Bricklane sample
                    collection.
                  </p>
                  <p className="text-2xl font-semibold">{collectionPrice(selected.price)}</p>
                  <Toggle
                    variant="outline"
                    aria-label={`Save ${selected.name}`}
                    pressed={saved.includes(selected.id)}
                    onPressedChange={(pressed) =>
                      setSaved((current) =>
                        pressed
                          ? [...current, selected.id]
                          : current.filter((id) => id !== selected.id),
                      )
                    }
                  >
                    {saved.includes(selected.id) ? (
                      <BookmarkCheck className="fill-current" />
                    ) : (
                      <Bookmark />
                    )}
                    {saved.includes(selected.id) ? "Saved" : "Save piece"}
                  </Toggle>
                  {saved.includes(selected.id) && (
                    <Alert variant="success">
                      <BookmarkCheck />
                      <AlertDescription>
                        Saved to your collection for this preview.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <Tabs value={active} onValueChange={setActive} className="min-w-0 gap-4">
            {categories.length > 1 && (
              <TabsList
                className="h-auto w-full flex-wrap justify-start gap-1"
                aria-label="Collection category"
              >
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="min-h-8 flex-none px-2 text-xs"
                  >
                    {tab.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search collection pieces"
                placeholder="Search pieces or materials…"
                className="ps-9"
              />
            </div>
            <p className="text-xs text-muted-foreground" role="status" data-collection-results>
              {shown.length} of {products.length} pieces
            </p>
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0 min-w-0">
                <ScrollArea className="h-[min(50dvh,29rem)] w-full rounded-lg border">
                  <div className="p-3">
                    {shown.length ? (
                      <ItemGroup className="gap-2">
                        {shown.map((product) => (
                          <Item
                            key={product.id}
                            variant="outline"
                            className="flex-nowrap gap-3 p-2.5"
                            data-collection-product={product.id}
                          >
                            <ItemMedia variant="image" className="size-14 self-start!">
                              <img src={product.image} alt={product.name} />
                            </ItemMedia>
                            <ItemContent className="min-w-0 gap-1">
                              <ItemTitle className="text-xs sm:text-sm">{product.name}</ItemTitle>
                              <ItemDescription className="text-xs">
                                {product.detail}
                              </ItemDescription>
                              <p className="text-xs font-medium">
                                {collectionPrice(product.price)}
                              </p>
                            </ItemContent>
                            <ItemActions>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelected(product)}
                                aria-label={`View ${product.name}`}
                              >
                                View
                              </Button>
                            </ItemActions>
                          </Item>
                        ))}
                      </ItemGroup>
                    ) : (
                      <Empty>
                        <EmptyHeader>
                          <EmptyTitle>No matching pieces</EmptyTitle>
                          <EmptyDescription>Try another name or material.</EmptyDescription>
                        </EmptyHeader>
                        <Button variant="outline" onClick={() => setQuery("")}>
                          Clear search
                        </Button>
                      </Empty>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
