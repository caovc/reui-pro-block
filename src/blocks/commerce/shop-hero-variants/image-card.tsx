import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Actual official free REUI c-card-8 composition (MIT, Keenthemes).
 * https://reui.io/r/radix-nova/c-card-8.json
 * Its image, hover zoom, bottom fade and positioned content are retained.
 * Only domain media, dimensions and children are adapted for this demo.
 */
export function ShopImageCard({
  image,
  alt,
  children,
  className,
}: {
  image: string;
  alt: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "group/card relative h-96 w-full overflow-hidden border-0 p-0 text-white",
        className,
      )}
    >
      <img
        src={image}
        alt={alt}
        width={620}
        height={760}
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover/card:scale-110 motion-reduce:transition-none"
      />
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-black/75 to-transparent transition-opacity duration-500 group-hover/card:from-black/80" />
      <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">{children}</div>
    </Card>
  );
}
