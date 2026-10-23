import { useState } from "react";
import { ArrowRight, Check, SlidersHorizontal, X, ShoppingBag } from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  products,
  photos,
  Money,
  Stars,
  WishButton,
  Swatches,
  SectionHeading,
  PageArrows,
} from "./shared";

function ProductTile({
  product,
  index,
  style,
  quick,
  onCart,
}: {
  product: (typeof products)[number];
  index: number;
  style?: string;
  quick?: boolean;
  onCart?: () => void;
}) {
  const [color, setColor] = useState(0),
    [size, setSize] = useState(""),
    [added, setAdded] = useState(false);
  const editorial = style === "editorial",
    look = style === "look",
    masonry = style === "masonry";
  return (
    <article
      className={cn(
        "group relative min-w-0",
        style === "card" && "rounded-xl border bg-card p-3",
        style === "stacked" && "rounded-xl border bg-muted/40 p-1.5",
        editorial && "flex flex-wrap items-center gap-5 border-b py-5",
      )}
    >
      {editorial && (
        <span className="text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
      )}
      <div
        className={cn(
          "relative overflow-hidden rounded-lg bg-muted",
          editorial ? "size-24 shrink-0" : "aspect-[4/5]",
          masonry && index % 3 === 1 && "aspect-[4/6]",
          style === "divided" && "rounded-tl-[4rem]",
          look && "aspect-[3/4]",
        )}
      >
        <img
          src={color === 1 ? products[(index + 4) % products.length].image : product.image}
          alt={product.name}
          loading="lazy"
          className={cn(
            "size-full object-cover transition-transform duration-500 group-hover:scale-105",
            style === "muted" && "grayscale group-hover:grayscale-0",
          )}
        />
        {!editorial && (
          <div className="absolute right-3 top-3">
            <WishButton />
          </div>
        )}
        {!editorial && index % 3 === 0 && (
          <Badge className="absolute left-3 top-3" variant="secondary">
            {index === 0 ? "New arrival" : "−20%"}
          </Badge>
        )}
        {(quick || look) && (
          <div className="absolute inset-x-2 bottom-2 flex flex-col gap-2 rounded-lg border bg-background/95 p-3 opacity-0 shadow-sm backdrop-blur-sm transition-all group-hover:opacity-100 group-focus-within:opacity-100">
            <span className="text-xs font-medium">Quick add · Select size</span>
            <ToggleGroup
              type="single"
              value={size}
              onValueChange={setSize}
              className="justify-start"
            >
              {["XS", "S", "M", "L", "XL"].map((s) => (
                <ToggleGroupItem key={s} value={s} size="sm" disabled={s === "XL"}>
                  {s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button
              size="sm"
              disabled={!size}
              onClick={() => {
                setAdded(!added);
                onCart?.();
              }}
            >
              {added ? "Added to bag" : "Add to bag"}
            </Button>
          </div>
        )}
      </div>
      <div
        className={cn(
          "flex flex-col gap-2 py-3",
          editorial ? "flex-1" : "",
          style === "stacked" && "mt-1.5 rounded-lg border bg-background p-4",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium">{product.name}</h3>
          {editorial && <WishButton />}
        </div>
        {editorial ? (
          <p className="text-sm text-muted-foreground">
            Thoughtfully made. Built to be part of your everyday.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {product.category} · {product.color}
          </p>
        )}
        {["rated", "divided"].includes(style || "") && <Stars rating={product.rating} />}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">
            <Money value={product.price} />
          </span>
          <del className="text-xs text-muted-foreground">
            <Money value={product.old} />
          </del>
          {style === "divided" && (
            <span className="text-xs text-muted-foreground">Free delivery</span>
          )}
        </div>
        {["card", "stacked", "color"].includes(style || "") && (
          <div className="flex gap-1.5">
            {["#d8d0c4", "#303434", "#8b967c"].map((c, i) => (
              <button
                key={c}
                aria-label={`Show color ${i + 1} for ${product.name}`}
                aria-pressed={color === i}
                onClick={() => setColor(i)}
                className={cn(
                  "size-4 rounded-full border-2 border-background ring-1 ring-border",
                  color === i && "ring-foreground",
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        )}
        {["rated", "cart", "card"].includes(style || "") && (
          <Button
            size="sm"
            variant={added ? "secondary" : "outline"}
            onClick={() => {
              setAdded(!added);
              onCart?.();
            }}
          >
            {added ? <Check data-icon="inline-start" /> : <ShoppingBag data-icon="inline-start" />}
            {added ? "Added" : "Add to cart"}
          </Button>
        )}
      </div>
    </article>
  );
}

export function ProductCatalog({ block }: BlockProps) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [sort, setSort] = useState("featured"),
    [page, setPage] = useState(0),
    [cart, setCart] = useState(0);
  const i = block.index,
    c = block.category;
  const style =
    c === "product-grid"
      ? ["card", "stacked", "cart", "editorial", "quick", "look"][i]
      : [
          "plain",
          "color",
          "quick",
          "plain",
          "featured",
          "masonry",
          "cart",
          "rated",
          "divided",
          "look",
        ][i];
  const carousel = [3, 6].includes(i) && c === "product-card";
  const rows = products
    .filter(
      (p) =>
        (filter === "all" || p.category === filter) &&
        p.name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : sort === "rating"
            ? b.rating - a.rating
            : 0,
    );
  const visible = carousel
    ? rows.slice(page * 4, page * 4 + 4)
    : rows.slice(0, c === "product-grid" ? 6 : style === "divided" ? 8 : 4);
  if (c === "product-card" && [2, 4].includes(i)) return <SingleProduct block={block} />;
  return (
    <div className="mx-auto w-full max-w-6xl p-5 sm:p-9">
      {i === 0 && (
        <p className="mb-5 text-center text-xs text-muted-foreground">
          Home / Shop / New collection
        </p>
      )}
      <SectionHeading
        title={
          c === "product-grid"
            ? "Designed for every day"
            : carousel
              ? "You might also like"
              : i === 5
                ? "Objects of interest"
                : i === 9
                  ? "The everyday edit"
                  : "New arrivals"
        }
        description={
          i === 5
            ? "A considered collection of things worth keeping."
            : "Considered essentials. Effortless by design."
        }
        action={
          <div className="flex items-center gap-3">
            {cart > 0 && <Badge variant="secondary">{cart} in bag</Badge>}
            {carousel && (
              <PageArrows
                onPrevious={() => setPage(Math.max(0, page - 1))}
                onNext={() => setPage((page + 1) % 2)}
              />
            )}
          </div>
        }
      />
      {[1, 5, 7].includes(i) && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Input
            className="max-w-56"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {["all", "Clothing", "Electronics", "Home", "Footwear", "Accessories"].map((x) => (
                  <SelectItem key={x} value={x}>
                    {x === "all" ? "All categories" : x}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="ml-auto w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="low">Price: low to high</SelectItem>
                <SelectItem value="high">Price: high to low</SelectItem>
                <SelectItem value="rating">Highest rated</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}
      <div
        className={cn(
          style === "editorial"
            ? "flex flex-col"
            : style === "masonry"
              ? "columns-2 gap-6 md:columns-3"
              : "grid grid-cols-2 gap-5 md:gap-7",
          !["editorial", "masonry"].includes(style) &&
            (c === "product-grid" && [0, 1, 5].includes(i) ? "" : "lg:grid-cols-4"),
          style === "divided" && "divide-x",
        )}
      >
        {visible.map((p, j) => (
          <div
            key={p.name}
            className={cn(
              style === "masonry" && "mb-6 break-inside-avoid",
              style === "divided" && "px-4",
            )}
          >
            <ProductTile
              product={p}
              index={j}
              style={style}
              quick={["quick", "look"].includes(style)}
              onCart={() => setCart(cart + 1)}
            />
          </div>
        ))}
      </div>
      {visible.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">No products match your search.</p>
      )}
    </div>
  );
}

export function SingleProduct({ block }: BlockProps) {
  const [photo, setPhoto] = useState(0),
    [size, setSize] = useState("M"),
    [added, setAdded] = useState(false),
    [quantity, setQuantity] = useState(1),
    [format, setFormat] = useState("Digital");
  const i = block.index,
    ebook = block.category === "product-detail" && i === 3,
    chair = block.category === "product-card" && i === 4,
    p = chair
      ? products[4]
      : ebook
        ? { ...products[0], name: "The Design of Everyday Work", price: 29 }
        : products[i % products.length];
  const price = ebook ? (format === "Digital" ? 29 : format === "Hardcover" ? 59 : 79) : p.price;
  return (
    <div
      className={cn(
        "mx-auto max-w-6xl p-5 sm:p-10",
        i === 5 && block.category === "product-detail" && "max-w-3xl",
      )}
    >
      <p className="mb-6 text-xs text-muted-foreground">Home / Collection / {p.name}</p>
      <div
        className={cn(
          "grid gap-8 md:grid-cols-2",
          i === 5 && block.category === "product-detail" && "md:grid-cols-1",
        )}
      >
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {ebook ? (
              <div className="flex size-full items-center justify-center bg-muted p-10">
                <div className="flex aspect-[3/4] w-3/4 flex-col justify-between bg-foreground p-7 text-background shadow-xl">
                  <span className="text-xs tracking-[.2em]">THE FIELD GUIDE SERIES / 01</span>
                  <h2 className="text-4xl font-semibold tracking-tight">
                    The Design
                    <br />
                    of Everyday
                    <br />
                    Work.
                  </h2>
                  <span className="text-xs">A practical guide to better systems</span>
                </div>
              </div>
            ) : (
              <img
                src={photo === 0 ? p.image : photos.room}
                alt={p.name}
                className="size-full object-cover"
              />
            )}
            <div className="absolute bottom-4 right-4">
              <PageArrows
                onPrevious={() => setPhoto((photo + 1) % 2)}
                onNext={() => setPhoto((photo + 1) % 2)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            {[p.image, photos.room].map((src, j) => (
              <button
                key={src}
                className={cn(
                  "size-16 overflow-hidden rounded-md border p-0.5",
                  photo === j && "border-foreground",
                )}
                aria-label={`View product image ${j + 1}`}
                onClick={() => setPhoto(j)}
              >
                <img src={src} className="size-full rounded-sm object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5 py-2">
          <div>
            <Badge variant="secondary">
              {ebook ? "Digital edition" : "The essentials collection"}
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">{p.name}</h2>
            <div className="mt-3">
              <Stars />
            </div>
          </div>
          <div className="flex items-center gap-3 text-xl font-medium">
            <Money value={price} />
            <del className="text-sm text-muted-foreground">
              <Money value={p.old} />
            </del>
            <Badge variant="secondary">Save 20%</Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {ebook
              ? "A thoughtful, practical guide to the tools and habits that make great work possible. Includes templates, exercises, and lifetime updates."
              : "Made to move with you. Thoughtful details, exceptional materials, and a timeless silhouette that feels just right from the very first day."}
          </p>
          {chair ? (
            <ul className="flex flex-col gap-2 text-sm">
              {[
                "Solid wood, responsibly sourced",
                "Designed for everyday comfort",
                "A piece to keep for years",
              ].map((t) => (
                <li className="flex gap-2" key={t}>
                  <Check className="size-4" />
                  {t}
                </li>
              ))}
            </ul>
          ) : null}
          <Separator />
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium">
              {ebook ? "Edition" : chair ? "Finish" : "Color"}:{" "}
              <span className="font-normal text-muted-foreground">{ebook ? format : p.color}</span>
            </span>
            {ebook ? (
              <ToggleGroup
                type="single"
                value={format}
                onValueChange={(v) => v && setFormat(v)}
                variant="outline"
              >
                {["Digital", "Hardcover", "Bundle"].map((f) => (
                  <ToggleGroupItem value={f} key={f}>
                    {f}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : (
              <Swatches count={chair ? 5 : 4} />
            )}
          </div>
          {!chair && !ebook && (
            <div>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-medium">Size</span>
                <span className="text-muted-foreground">Fits true to size</span>
              </div>
              <ToggleGroup
                type="single"
                value={size}
                onValueChange={(v) => v && setSize(v)}
                variant="outline"
                className="justify-start"
              >
                {["XS", "S", "M", "L", "XL"].map((s) => (
                  <ToggleGroupItem value={s} key={s} disabled={s === "XL"}>
                    {s}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex items-center rounded-md border">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Decrease quantity"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </Button>
              <span className="w-7 text-center text-sm">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Increase quantity"
                onClick={() => setQuantity(Math.min(5, quantity + 1))}
              >
                +
              </Button>
            </div>
            <Button className="flex-1" onClick={() => setAdded(!added)}>
              {added ? (
                <Check data-icon="inline-start" />
              ) : (
                <ShoppingBag data-icon="inline-start" />
              )}
              {added ? "Added to bag" : `Add to bag · $${price * quantity}`}
            </Button>
            <WishButton />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Free shipping over $100 · 30-day returns
          </p>
          <Accordion type="single" collapsible defaultValue="details">
            {["details", "shipping", "care"].map((v) => (
              <AccordionItem value={v} key={v}>
                <AccordionTrigger>
                  {v === "details"
                    ? "Product details"
                    : v === "shipping"
                      ? "Shipping & returns"
                      : "Materials & care"}
                </AccordionTrigger>
                <AccordionContent>
                  {v === "details"
                    ? "Every detail is considered, from the durable construction to the carefully selected materials. Made for the moments that matter."
                    : v === "shipping"
                      ? "Your order ships in 2–3 business days. Free returns within 30 days of delivery."
                      : "Clean gently with a soft cloth. Store in a cool, dry place."}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      {block.category === "product-detail" && (
        <div className="mt-12 border-t pt-8">
          <SectionHeading
            title={
              ebook
                ? "Inside the book"
                : i === 2
                  ? "Technical specifications"
                  : "Made with intention"
            }
            description="A closer look at the details that make the difference."
          />
          {i === 2 ? (
            <div className="divide-y">
              {[
                "Materials: Premium natural fibers",
                "Dimensions: 42 × 28 × 12 cm",
                "Weight: 640 g",
                "Warranty: 2 years",
              ].map((t) => (
                <div key={t} className="grid grid-cols-2 py-3 text-sm">
                  <span className="text-muted-foreground">{t.split(":")[0]}</span>
                  <span>{t.split(":")[1]}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-3">
              {["01 / Thoughtful foundations", "02 / The quiet details", "03 / Built to last"].map(
                (t) => (
                  <div key={t}>
                    <h3 className="text-sm font-medium">{t}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Less noise, more purpose. A considered approach that puts what matters at the
                      center.
                    </p>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CategoryBrowser({ block }: BlockProps) {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState(""),
    i = block.index;
  const collections = [
    {
      name: "Everyday essentials",
      image: photos.shirt,
      count: 48,
      note: "The pieces you reach for, again and again.",
    },
    {
      name: "Objects for living",
      image: photos.chair,
      count: 32,
      note: "Bring a little more intention to your space.",
    },
    {
      name: "On the move",
      image: photos.bag,
      count: 24,
      note: "Built for wherever the day takes you.",
    },
    {
      name: "Sound & vision",
      image: photos.headphones,
      count: 18,
      note: "A new perspective on your everyday.",
    },
    { name: "The outdoor edit", image: photos.shoes, count: 36, note: "Take the longer way home." },
    {
      name: "Quiet corners",
      image: photos.lamp,
      count: 16,
      note: "Make space for moments of calm.",
    },
  ];
  const items = collections.filter((x) => x.name.toLowerCase().includes(search.toLowerCase()));
  const shown = i === 2 ? items.slice(page * 3, page * 3 + 3) : items.slice(0, i === 5 ? 4 : 6);
  return (
    <div className="mx-auto w-full max-w-6xl p-6 sm:p-10">
      <SectionHeading
        title={
          i === 4
            ? "The collection guides"
            : i === 5
              ? "A season of possibilities"
              : "Shop by category"
        }
        description={
          selected ? `Now browsing: ${selected}` : "Discover something that feels like you."
        }
        action={
          i === 2 ? (
            <PageArrows
              onPrevious={() => setPage(Math.max(0, page - 1))}
              onNext={() => setPage((page + 1) % 2)}
            />
          ) : undefined
        }
      />
      {i === 1 && (
        <div className="mb-6 flex gap-3">
          <Input
            placeholder="Search collections…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search collections"
          />
          <Badge variant="outline">{items.length} collections</Badge>
        </div>
      )}
      <div
        className={cn(
          i === 4 ? "flex flex-col gap-5" : "grid grid-cols-1 gap-5 sm:grid-cols-2",
          i === 0 && "lg:grid-cols-4",
          i === 2 && "lg:grid-cols-3",
          i === 3 && "md:grid-cols-[1.5fr_1fr]",
        )}
      >
        {shown.map((x, j) => (
          <article
            key={x.name}
            className={cn(
              "group relative overflow-hidden rounded-xl",
              i === 4 && "flex items-center gap-5 border p-4",
              i === 3 && j === 0 && "md:row-span-3",
            )}
          >
            <div
              className={cn(
                "overflow-hidden rounded-xl bg-muted",
                i === 4
                  ? "size-28 shrink-0"
                  : i === 5
                    ? "aspect-[16/10]"
                    : i === 3 && j > 0
                      ? "absolute inset-0"
                      : "aspect-[4/5]",
              )}
            >
              <img
                src={x.image}
                alt={x.name}
                className={cn(
                  "size-full object-cover transition-transform duration-500 group-hover:scale-105",
                  i === 3 && j > 0 && "opacity-20",
                )}
              />
            </div>
            <div
              className={cn(
                "flex flex-col gap-2 py-4",
                i === 5 && "absolute inset-x-0 bottom-0 bg-background/90 p-5 backdrop-blur",
                i === 3 && j > 0 && "relative p-6",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">{x.name}</h3>
                <Badge variant="outline">{x.count} items</Badge>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{x.note}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelected(x.name)}
                className="mt-2 self-start"
              >
                {selected === x.name ? "Browsing collection" : "Browse collection"}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function FilterSidebar({ block }: BlockProps) {
  const [cats, setCats] = useState<string[]>([]),
    [price, setPrice] = useState([250]),
    [inStock, setInStock] = useState(false),
    [applied, setApplied] = useState(false);
  const i = block.index;
  const toggle = (v: string) =>
    setCats(cats.includes(v) ? cats.filter((c) => c !== v) : [...cats, v]);
  const panel = (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Filters {cats.length > 0 && <Badge variant="secondary">{cats.length}</Badge>}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCats([]);
            setPrice([250]);
            setInStock(false);
            setApplied(false);
          }}
        >
          Reset
        </Button>
      </div>
      {cats.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {cats.map((x) => (
            <Button key={x} variant="secondary" size="sm" onClick={() => toggle(x)}>
              {x}
              <X data-icon="inline-end" />
            </Button>
          ))}
        </div>
      )}
      <Accordion
        type="multiple"
        defaultValue={
          i >= 5 ? ["category", "price"] : ["category", "brand", "price", "size", "stock"]
        }
      >
        <AccordionItem value="category">
          <AccordionTrigger>Category</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3">
              {["Clothing", "Accessories", "Footwear", "Home", "Electronics"].map((t) => (
                <label className="flex items-center gap-2 text-sm" key={t}>
                  <Checkbox checked={cats.includes(t)} onCheckedChange={() => toggle(t)} />
                  {t}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {products.filter((p) => p.category === t).length}
                  </span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="brand">
          <AccordionTrigger>Brand</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3">
              {["Forma", "Studio 01", "Everyday Co."].map((t) => (
                <label className="flex items-center gap-2 text-sm" key={t}>
                  <Checkbox checked={cats.includes(t)} onCheckedChange={() => toggle(t)} />
                  {t}
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="price">
          <AccordionTrigger>Price range</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4 px-1">
              <Slider
                value={price}
                onValueChange={setPrice}
                min={25}
                max={350}
                step={5}
                aria-label="Maximum price"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$0</span>
                <span>Up to ${price[0]}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="size">
          <AccordionTrigger>Color & size</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              <Swatches />
              <ToggleGroup type="multiple" variant="outline" size="sm">
                {["XS", "S", "M", "L", "XL"].map((s) => (
                  <ToggleGroupItem value={s} key={s}>
                    {s}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </AccordionContent>
        </AccordionItem>
        {i >= 2 && (
          <AccordionItem value="stock">
            <AccordionTrigger>Availability</AccordionTrigger>
            <AccordionContent>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={inStock} onCheckedChange={(v) => setInStock(v === true)} />
                In stock only
              </label>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
      <Button onClick={() => setApplied(true)}>
        {applied
          ? "Filters applied"
          : `Show ${products.filter((p) => p.price <= price[0] && (!cats.some((c) => products.some((x) => x.category === c)) || cats.includes(p.category))).length} products`}
      </Button>
    </div>
  );
  const filtered = products.filter(
    (p, j) =>
      p.price <= price[0] &&
      (!cats.some((c) => products.some((x) => x.category === c)) || cats.includes(p.category)) &&
      (!cats.some((c) => ["Forma", "Studio 01", "Everyday Co."].includes(c)) ||
        cats.includes(["Forma", "Studio 01", "Everyday Co."][j % 3])) &&
      (!inStock || j % 3 !== 2),
  );
  return (
    <div className="mx-auto max-w-6xl p-6 sm:p-9">
      <SectionHeading
        title="The collection"
        description={`${filtered.length} considered essentials, just for you.`}
        action={
          i === 4 ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <SlidersHorizontal data-icon="inline-start" />
                  Filters {cats.length || ""}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter products</SheetTitle>
                </SheetHeader>
                <div className="overflow-auto p-5">{panel}</div>
              </SheetContent>
            </Sheet>
          ) : undefined
        }
      />
      <div className={cn("grid gap-7", i !== 4 && "md:grid-cols-[240px_1fr]")}>
        {i !== 4 && (
          <aside
            className={cn(
              "self-start rounded-xl border p-5",
              [1, 3, 6].includes(i) && "bg-muted/30",
            )}
          >
            {panel}
          </aside>
        )}
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          {filtered.map((p, j) => (
            <ProductTile key={p.name} product={p} index={j} style="plain" />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-16 text-center text-sm text-muted-foreground">
              No products match these filters. Try a higher price range.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
