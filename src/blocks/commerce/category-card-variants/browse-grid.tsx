import { CollectionSaveProvider } from "../shop-hero-variants/collection-dialog";
import { CategoryBreadcrumb } from "./breadcrumb";
import { CategoryCollectionCard } from "./collection-card";
import { categoryCollections } from "./data";

export function CategoryBrowseGrid() {
  return (
    <CollectionSaveProvider>
      <section
        className="mx-auto w-full max-w-[1440px] bg-background p-4 text-foreground sm:p-8 lg:p-10"
        data-category-card-variant="1"
      >
        <header className="mx-auto mb-8 max-w-xl space-y-4 text-center">
          <CategoryBreadcrumb current="Categories" />
          <h2 className="text-3xl font-semibold tracking-tight leading-[1.08] sm:text-4xl">
            Shop by category
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Good things, thoughtfully grouped. Find your everyday essentials and a little
            inspiration along the way.
          </p>
        </header>
        <div
          className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-4"
          data-category-grid
        >
          {categoryCollections.map((collection) => (
            <CategoryCollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>
    </CollectionSaveProvider>
  );
}
