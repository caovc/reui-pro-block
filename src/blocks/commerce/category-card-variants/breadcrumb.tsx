import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CollectionBrowser } from "../shop-hero-variants/collection-dialog";

/** Actual official free c-breadcrumb-1 composition, with working local catalog navigation. */
export function CategoryBreadcrumb({ current }: { current: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="justify-center text-xs">
        <BreadcrumbItem>
          <CollectionBrowser
            title="Bricklane Goods"
            categories={["clothing", "footwear", "accessories", "home"]}
          >
            <BreadcrumbLink asChild>
              <button type="button">Shop</button>
            </BreadcrumbLink>
          </CollectionBrowser>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
