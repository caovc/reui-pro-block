import chairPhoto from "./assets/chair.jpg";
import lampPhoto from "./assets/lamp.jpg";
import roomPhoto from "./assets/room.jpg";
import bagPhoto from "./assets/bag.jpg";
import headphonesPhoto from "./assets/headphones.jpg";
import shoesPhoto from "./assets/shoes.jpg";
import jacketPhoto from "./assets/jacket.jpg";
import shirtPhoto from "./assets/shirt.jpg";
import plantPhoto from "./assets/plant.jpg";
import workspacePhoto from "./assets/workspace.jpg";
import architecturePhoto from "./assets/architecture.jpg";
import coastPhoto from "./assets/coast.jpg";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Heart,
  ShoppingBag,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const photos = {
  chair: chairPhoto,
  lamp: lampPhoto,
  room: roomPhoto,
  bag: bagPhoto,
  headphones: headphonesPhoto,
  shoes: shoesPhoto,
  jacket: jacketPhoto,
  shirt: shirtPhoto,
  plant: plantPhoto,
  workspace: workspacePhoto,
  architecture: architecturePhoto,
  coast: coastPhoto,
};
export const products = [
  {
    name: "Everyday Cotton Tee",
    category: "Clothing",
    price: 38,
    old: 48,
    image: photos.shirt,
    color: "Sand",
    rating: 4.8,
  },
  {
    name: "Studio Wireless",
    category: "Electronics",
    price: 149,
    old: 199,
    image: photos.headphones,
    color: "Graphite",
    rating: 4.9,
  },
  {
    name: "The Weekender",
    category: "Accessories",
    price: 89,
    old: 120,
    image: photos.bag,
    color: "Forest",
    rating: 4.7,
  },
  {
    name: "Runner 01",
    category: "Footwear",
    price: 125,
    old: 160,
    image: photos.shoes,
    color: "Coral",
    rating: 4.8,
  },
  {
    name: "Arc Lounge Chair",
    category: "Home",
    price: 249,
    old: 320,
    image: photos.chair,
    color: "Natural",
    rating: 4.9,
  },
  {
    name: "Essential Jacket",
    category: "Clothing",
    price: 179,
    old: 220,
    image: photos.jacket,
    color: "Black",
    rating: 4.6,
  },
  {
    name: "Ambient Table Light",
    category: "Home",
    price: 95,
    old: 125,
    image: photos.lamp,
    color: "Ivory",
    rating: 4.8,
  },
  {
    name: "Green Living",
    category: "Home",
    price: 32,
    old: 45,
    image: photos.plant,
    color: "Green",
    rating: 4.7,
  },
];
export function Money({ value }: { value: number }) {
  return (
    <>
      {new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(value)}
    </>
  );
}
export function Stars({ rating = 4.9 }: { rating?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <Star className="size-3 fill-amber-400 text-amber-400" />
      {rating}
      <span className="text-muted-foreground">(128)</span>
    </span>
  );
}
export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function CartButton({ compact = false }: { compact?: boolean }) {
  const [added, setAdded] = useState(false);
  return (
    <Button
      size={compact ? "sm" : "default"}
      variant={added ? "secondary" : "default"}
      onClick={() => setAdded(!added)}
    >
      {added ? <Check data-icon="inline-start" /> : <ShoppingBag data-icon="inline-start" />}
      {added ? "Added to bag" : "Add to bag"}
    </Button>
  );
}
export function WishButton() {
  const [liked, setLiked] = useState(false);
  return (
    <Button
      size="icon-sm"
      variant="outline"
      aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={liked}
      onClick={() => setLiked(!liked)}
    >
      <Heart className={cn(liked && "fill-current")} />
    </Button>
  );
}
export function Swatches({ count = 4 }: { count?: number }) {
  const [selected, setSelected] = useState(0);
  return (
    <div className="flex gap-1.5">
      {["#ded6c8", "#2d3333", "#87917f", "#ba9b85", "#e7e5e4"].slice(0, count).map((color, i) => (
        <button
          key={color}
          aria-label={`Select ${["sand", "graphite", "sage", "clay", "ivory"][i]} color`}
          aria-pressed={selected === i}
          onClick={() => setSelected(i)}
          className={cn(
            "size-5 rounded-full border-2 border-background ring-1 ring-border",
            selected === i && "ring-foreground",
          )}
          style={{ background: color }}
        />
      ))}
    </div>
  );
}
export function PageArrows({ onPrevious, onNext }: { onPrevious: () => void; onNext: () => void }) {
  return (
    <div className="flex gap-2">
      <Button size="icon-sm" variant="outline" aria-label="Previous items" onClick={onPrevious}>
        <ChevronLeft />
      </Button>
      <Button size="icon-sm" variant="outline" aria-label="Next items" onClick={onNext}>
        <ChevronRight />
      </Button>
    </div>
  );
}
export function Brand({ label = "FORMA" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-[.13em]">
      <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-xs text-background">
        f
      </span>
      {label}
    </span>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Button variant="link" onClick={onClick}>
      {children}
      <ArrowRight data-icon="inline-end" />
    </Button>
  );
}
export function SaleBadge() {
  return <Badge variant="secondary">−20%</Badge>;
}
