// Actual official free REUI c-breadcrumb-4, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-breadcrumb-4.json
// Same slash-separated hierarchy; caller data/actions replace inert hash links.
import { Fragment, type ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

export function WorkspaceTrail({
  items,
  onNavigate,
}: {
  items: { label: string; content?: ReactNode }[];
  onNavigate?: (label: string) => void;
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
            <BreadcrumbItem>
              {item.content ??
                (index === items.length - 1 ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Button variant="ghost" size="sm" onClick={() => onNavigate?.(item.label)}>
                      {item.label}
                    </Button>
                  </BreadcrumbLink>
                ))}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
