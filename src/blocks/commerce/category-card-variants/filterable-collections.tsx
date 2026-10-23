import { useState, type MouseEvent } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CollectionSaveProvider } from "../shop-hero-variants/collection-dialog";
import { CategoryBreadcrumb } from "./breadcrumb";
import { CategoryCollectionCard } from "./collection-card";
import { categoryCollections, initialFilters } from "./data";
import { CollectionFilterPopover, CollectionSelect } from "./filters";

export function FilterableCollections() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState("recommended");
  const [page, setPage] = useState(0);
  const filtered = categoryCollections
    .filter((collection) => {
      const search =
        `${collection.name} ${collection.description} ${collection.fits.join(" ")}`.toLowerCase();
      return (
        search.includes(query.trim().toLowerCase()) &&
        (filters.department === "all" ||
          collection.categories.some((category) => category === filters.department)) &&
        (filters.availability === "all" ||
          collection.available === (filters.availability === "available")) &&
        (!filters.featured || Boolean(collection.badge)) &&
        (!filters.fits.length ||
          filters.fits.some((fit) => collection.fits.some((value) => value === fit)))
      );
    })
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "most"
          ? b.count - a.count
          : sort === "fewest"
            ? a.count - b.count
            : a.order - b.order,
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 4));
  const current = Math.min(page, pages - 1);
  const shown = filtered.slice(current * 4, current * 4 + 4);
  function reset() {
    setFilters(initialFilters);
    setQuery("");
    setSort("recommended");
    setPage(0);
  }
  function navigate(event: MouseEvent<HTMLAnchorElement>, target: number) {
    event.preventDefault();
    if (target >= 0 && target < pages) setPage(target);
  }
  return (
    <CollectionSaveProvider>
      <section
        className="mx-auto w-full max-w-[1440px] bg-background p-4 text-foreground sm:p-8 lg:p-10"
        data-category-card-variant="2"
        data-results={filtered.length}
      >
        <header className="mx-auto mb-8 max-w-xl space-y-4 text-center">
          <CategoryBreadcrumb current="Collections" />
          <h2 className="text-3xl font-semibold tracking-tight leading-[1.08] sm:text-4xl">
            Curated collections
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Find the pieces that fit your day. Explore small edits with a clear point of view.
          </p>
        </header>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Field className="min-w-[14rem] flex-1">
            <InputGroup>
              <InputGroupAddon>
                <Search className="size-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search collections"
                placeholder="Search collections…"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(0);
                }}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText className="text-xs text-muted-foreground">
                  {filtered.length} results
                </InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <CollectionFilterPopover
            value={filters}
            onChange={(value) => {
              setFilters(value);
              setPage(0);
            }}
          />
          <div className="w-40 grow sm:grow-0">
            <CollectionSelect
              label="Sort collections"
              value={sort}
              onChange={(value) => {
                setSort(value);
                setPage(0);
              }}
              options={[
                { value: "recommended", label: "Recommended" },
                { value: "name", label: "Name: A–Z" },
                { value: "most", label: "Most pieces" },
                { value: "fewest", label: "Fewest pieces" },
              ]}
            />
          </div>
          {(query ||
            filters.department !== "all" ||
            filters.availability !== "all" ||
            filters.featured ||
            filters.fits.length > 0) && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <X className="size-3.5" />
              Clear all
            </Button>
          )}
        </div>
        {shown.length ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map((collection) => (
              <CategoryCollectionCard
                key={collection.id}
                collection={collection}
                variant="filter"
              />
            ))}
          </div>
        ) : (
          <Empty className="min-h-80 bg-muted">
            <EmptyHeader>
              <EmptyTitle role="heading" aria-level={3}>
                No collections found
              </EmptyTitle>
              <EmptyDescription>
                Try a different search or clear your filters to explore all eight collections.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={reset}>Reset collection search</Button>
            </EmptyContent>
          </Empty>
        )}
        <footer className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
          <p className="text-xs text-muted-foreground" aria-live="polite" data-collection-range>
            {filtered.length ? current * 4 + 1 : 0}–{Math.min((current + 1) * 4, filtered.length)}{" "}
            of {filtered.length} collections
          </p>
          <Pagination aria-label="Collection pagination" className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={current === 0}
                  tabIndex={current === 0 ? -1 : 0}
                  className="aria-disabled:pointer-events-none aria-disabled:opacity-40"
                  onClick={(event) => navigate(event, current - 1)}
                />
              </PaginationItem>
              {Array.from({ length: pages }, (_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    href="#"
                    aria-label={`Collection page ${index + 1}`}
                    isActive={index === current}
                    onClick={(event) => navigate(event, index)}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={current === pages - 1}
                  tabIndex={current === pages - 1 ? -1 : 0}
                  className="aria-disabled:pointer-events-none aria-disabled:opacity-40"
                  onClick={(event) => navigate(event, current + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </footer>
      </section>
    </CollectionSaveProvider>
  );
}
