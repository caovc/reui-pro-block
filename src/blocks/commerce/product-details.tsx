import { useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Download,
  FileText,
  Headphones,
  ShieldCheck,
} from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Money } from "./shared";
import {
  surfacePhotos as img,
  Breadcrumbs,
  ProductFrame,
  ProductGallery,
  ProductPrice,
  ProductWish,
  ColorPicker,
  Quantity,
  CartAction,
  TrustRow,
  RatingStars,
  SpecRows,
  ReviewsSection,
  ReviewSummary,
  ReviewCarousel,
  RelatedProducts,
  AllReviewsButton,
} from "./product-detail-grid-shared";
import type { ColorOption } from "./product-detail-grid-shared";

const sneakerColors: ColorOption[] = [
  { name: "Cherry", value: "#ff293b" },
  { name: "Midnight", value: "#101827" },
  { name: "Cloud", value: "#fafafa" },
  { name: "Sand", value: "#ffe589" },
  { name: "Moss", value: "#007e58" },
];
const audioColors: ColorOption[] = [
  { name: "Graphite", value: "#454545" },
  { name: "Sand", value: "#e6e3df" },
  { name: "Midnight", value: "#101827" },
];
const coffeeColors: ColorOption[] = [
  { name: "Cream", value: "#efefeb" },
  { name: "Charcoal", value: "#282828" },
  { name: "Sage", value: "#007957" },
  { name: "Cobalt", value: "#163dd6" },
];
const bagColors: ColorOption[] = [
  { name: "Tobacco", value: "#914014", image: img.bagTan },
  { name: "Olive", value: "#005340", image: img.bag },
  { name: "Charcoal", value: "#343434", image: img.bagSlate },
  { name: "Sand", value: "#d9d4ce", image: img.bagTan },
];
const audioSpecs = [
  {
    title: "In The Box",
    rows: [
      ["Headphones", "Atlas Pro, hand-tuned at the factory"],
      ["Carrying case", "Felted wool with magnetic closure"],
      ["Cables", "USB-C charge cable, 3.5 mm audio cable"],
      ["Adapter", "Airline 3.5 mm dual-plug adapter"],
    ],
  },
  {
    title: "Audio",
    rows: [
      ["Drivers", "40 mm beryllium-coated dynamic"],
      ["Frequency response", "10 Hz – 40 kHz"],
      ["Impedance", "32 Ω, 110 dB SPL/mW"],
      ["Codecs", "LDAC · aptX Adaptive · AAC · SBC"],
    ],
  },
  {
    title: "Build & Fit",
    rows: [
      ["Frame", "Brushed aluminum"],
      ["Ear pads", "Replaceable memory foam, vegan leather"],
      ["Weight", "278 g · 9.8 oz"],
      ["Foldable", "Flat-folding, gimballed yokes"],
    ],
  },
  {
    title: "Connectivity",
    rows: [
      ["Wireless", "Bluetooth 5.3, multipoint to 2 devices"],
      ["Wired", "USB-C + 3.5 mm analog"],
      ["Battery", "40 h (ANC off), 30 h (ANC on)"],
      ["Charge time", "Full: 90 min · Quick: 3 h in 5 min"],
    ],
  },
];
const resonanceSpecs = [
  {
    title: "Audio",
    rows: [
      ["Drivers", "40 mm dynamic, neodymium"],
      ["Frequency", "10 Hz to 40 kHz"],
      ["Mics", "8-mic beamforming array"],
    ],
  },
  {
    title: "Power",
    rows: [
      ["Battery", "40 h ANC on · 60 h off"],
      ["Fast charge", "USB-C · 10 min = 5 h"],
      ["Standby", "180 days"],
    ],
  },
  {
    title: "Connectivity",
    rows: [
      ["Wireless", "Bluetooth 5.3"],
      ["Codecs", "LDAC / aptX HD / AAC"],
      ["Multi-point", "2 devices"],
    ],
  },
  {
    title: "Build",
    rows: [
      ["Weight", "250 g"],
      ["Frame", "Aluminum yoke · vegan leather"],
      ["Warranty", "2 years, limited"],
    ],
  },
];
const coffeeSpecs = [
  {
    title: "Specifications",
    rows: [
      ["Capacity", "350 ml · 500 ml · 700 ml"],
      ["Dripper", "Hand-thrown stoneware · 60-degree cone"],
      ["Carafe", "Double-wall borosilicate glass"],
      ["Includes", "Dripper · carafe · 50 paper filters"],
      ["Brew time", "3 to 4 minutes per cup"],
      ["Care", "Carafe dishwasher-safe, hand-wash dripper"],
    ],
  },
];
const bagSpecs = [
  {
    title: "Material",
    rows: [
      ["Hide", "Full-grain saddle, 1.4 mm"],
      ["Lining", "Waxed cotton canvas"],
      ["Hardware", "Solid brass · YKK Excella"],
    ],
  },
  {
    title: "Capacity",
    rows: [
      ["Sizes", "14 L · 18 L · 24 L"],
      ["Laptop sleeve", "Up to 16-inch laptop"],
      ["Side pockets", "Two water-bottle slip pockets"],
    ],
  },
  {
    title: "Build",
    rows: [
      ["Dimensions", "44 × 30 × 14 cm"],
      ["Weight", "1.4 kg empty"],
      ["Stitching", "Hand-stitched saddle seam"],
    ],
  },
  {
    title: "Care",
    rows: [
      ["Cleaning", "Damp cloth, then leather conditioner"],
      ["Storage", "Use cotton dust bag included"],
      ["Warranty", "Lifetime repair"],
    ],
  },
];
function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6">
      {items.map((item) => (
        <li className="flex gap-2" key={item}>
          <Check className="mt-1 size-3.5 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}
function Heading({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight">{children}</h2>
    </div>
  );
}
function SizeGuide({ kind = "shoe" }: { kind?: "shoe" | "coffee" | "bag" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        onClick={() => setOpen(true)}
      >
        Size guide
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {kind === "shoe"
                ? "Find your fit"
                : kind === "coffee"
                  ? "Choose your brew size"
                  : "Find your everyday capacity"}
            </DialogTitle>
            <DialogDescription>
              {kind === "shoe"
                ? "Measure from heel to longest toe. Leave a little room for movement."
                : kind === "coffee"
                  ? "Choose a capacity for your daily ritual."
                  : "Choose a size for how you carry."}
            </DialogDescription>
          </DialogHeader>
          <SpecRows
            groups={[
              {
                title:
                  kind === "shoe"
                    ? "EU · Foot length"
                    : kind === "coffee"
                      ? "Capacity · Servings"
                      : "Capacity · Intended use",
                rows:
                  kind === "shoe"
                    ? [
                        ["39", "24.5 cm"],
                        ["40", "25 cm"],
                        ["41", "26 cm"],
                        ["42", "26.5 cm"],
                        ["43", "27.5 cm"],
                        ["44", "28 cm"],
                        ["45", "29 cm"],
                      ]
                    : kind === "coffee"
                      ? [
                          ["350 ml", "1 cup"],
                          ["500 ml", "2 cups"],
                          ["700 ml", "3 cups"],
                        ]
                      : [
                          ["14 L", "Day pack"],
                          ["18 L", "Commute"],
                          ["24 L", "Travel"],
                        ],
              },
            ]}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
function ShoeDetail() {
  const [color, setColor] = useState("Cherry"),
    [size, setSize] = useState("39");
  return (
    <ProductFrame>
      <Breadcrumbs items={["Sneakers", "Running", "Cloud Shift Runner"]} />
      <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
        <ProductGallery
          name="Cloud Shift Runner"
          images={[img.shoes, img.shoes, img.shoes, img.shoes, img.shoes]}
          vertical
          style={{
            filter:
              color === "Cherry"
                ? "none"
                : `hue-rotate(${sneakerColors.findIndex((c) => c.name === color) * 55}deg)`,
          }}
        />
        <div className="space-y-5">
          <p className="text-muted-foreground">
            Sneakers <span className="mx-1 text-muted-foreground/50">·</span> Running
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Cloud Shift Runner</h1>
          <RatingStars rating={4.5} count="834 reviews" />
          <p className="leading-6 text-muted-foreground">
            Daily road runner with breathable mesh, steady cushioning and a rubber outsole made for
            your everyday miles.
          </p>
          <ProductPrice price={96.23} old={128} label="25% OFF" large />
          <div className="border-t pt-5">
            <ColorPicker colors={sneakerColors} value={color} onChange={setColor} />
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p>Select Size</p>
              <SizeGuide />
            </div>
            <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Select size">
              {["39", "40", "41", "42", "43", "44", "45"].map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  className={cn(
                    "relative px-0",
                    size === s && "border-foreground bg-muted",
                    s === "44" && "line-through",
                  )}
                  disabled={s === "44"}
                  aria-pressed={size === s}
                  aria-label={`Size ${s}${s === "44" ? ", sold out" : ""}`}
                  onClick={() => setSize(s)}
                >
                  {s}
                  {size === s && (
                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-foreground text-background">
                      <Check className="size-2.5" />
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <CartAction
              name="Cloud Shift Runner"
              detail={`${color} · EU ${size}`}
              price={96.23}
              className="w-full"
            >
              Add to Bag
            </CartAction>
            <ProductWish name="Cloud Shift Runner" words className="w-full" />
          </div>
          <TrustRow />
        </div>
      </div>
      <Tabs defaultValue="description" className="mt-12 sm:mt-16">
        <TabsList variant="line" className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
          {["Description", "Specs", "Shipping & Returns", "Reviews"].map((t) => (
            <TabsTrigger key={t} value={t.toLowerCase()} className="py-3 text-xs sm:text-sm">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="description" className="pt-6">
          <div className="max-w-4xl space-y-4 leading-7">
            <p>
              A lightweight mesh upper lets heat escape while a single-density EVA midsole keeps
              each step consistent. Built for roads, treadmills and the steady rhythm of a daily
              run.
            </p>
            <p>
              A padded collar and flexible forefoot keep the fit comfortable from the first mile to
              the last.
            </p>
            <Bullets
              items={[
                "Engineered mesh upper with recycled yarn",
                "Single-density EVA midsole, 8 mm drop",
                "Rubber outsole with forefoot flex groove",
                "248 g (US 9), true-to-size fit",
              ]}
            />
          </div>
        </TabsContent>
        <TabsContent value="specs" className="pt-6">
          <SpecRows
            groups={[
              {
                title: "Build",
                rows: [
                  ["Upper", "Engineered mesh, recycled polyester yarn"],
                  ["Midsole", "Single-density EVA"],
                  ["Outsole", "Rubber with forefoot flex groove"],
                ],
              },
              {
                title: "Fit",
                rows: [
                  ["Weight", "248 g (US 9)"],
                  ["Heel drop", "8 mm"],
                  ["Fit", "True to size"],
                ],
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="shipping & returns" className="space-y-4 pt-6">
          <h2 className="text-lg font-semibold">Shipping & Returns</h2>
          <p>
            Free standard shipping. Orders leave within 2 business days and can be returned within
            30 days in their original condition.
          </p>
          <TrustRow />
        </TabsContent>
        <TabsContent value="reviews" className="pt-6">
          <ReviewsSection count="834" rating={4.5} />
        </TabsContent>
      </Tabs>
      <div className="mt-12 border-t pt-12">
        <RelatedProducts kind="shoes" paged />
      </div>
    </ProductFrame>
  );
}

interface Chapter {
  tag: string;
  title: string;
  text: string;
  image: string;
  specs: string[][];
}
const audioChapters: Chapter[] = [
  {
    tag: "Sound",
    title: "A driver tuned by listening, not by chart.",
    text: "A considered driver and a carefully balanced chamber bring vocals closer and leave room around each instrument. Refined through long listening sessions, from a quiet piano to a full live recording.",
    image: img.headphones,
    specs: [
      ["Drivers", "40 mm dynamic, neodymium"],
      ["Frequency", "10 Hz to 40 kHz"],
      ["Codecs", "LDAC / aptX HD / AAC"],
    ],
  },
  {
    tag: "Comfort",
    title: "Built to disappear over long sessions.",
    text: "A lighter frame, soft memory foam and an even fit keep the day comfortable. Replaceable pads give this everyday pair a longer working life, without complicated tools.",
    image: img.headphones,
    specs: [
      ["Weight", "250 g"],
      ["Earpads", "Memory-foam, swappable"],
      ["Pressure", "Tuned for 8h sessions"],
    ],
  },
  {
    tag: "Travel",
    title: "Forty hours, four flights, one charge.",
    text: "Adaptive noise cancellation follows the room around you. A quick USB-C top-up is enough for the next leg, and the compact case keeps the headphones ready to go.",
    image: img.workspace,
    specs: [
      ["Battery", "40 h ANC on · 60 h off"],
      ["Charging", "10 min = 5 h"],
      ["ANC", "Adaptive · 2 s refresh"],
    ],
  },
];
function ChapterRule({ n, label }: { n: string; label: string }) {
  return (
    <div className="mb-5 flex items-center gap-3 text-[10px] uppercase tracking-[.2em] text-muted-foreground">
      <span>{n}</span>
      <span className="h-px flex-1 bg-border" />
      <span>{label}</span>
    </div>
  );
}
function EditorialChapters({ chapters }: { chapters: Chapter[] }) {
  return (
    <div className="space-y-14 sm:space-y-20">
      {chapters.map((c, i) => (
        <section key={c.title} className="grid items-center gap-7 sm:grid-cols-2 sm:gap-14">
          <div
            className={cn(
              "group relative overflow-hidden rounded-lg bg-muted",
              i % 2 === 0 ? "sm:order-2" : "sm:order-1",
            )}
          >
            <img
              src={c.image}
              alt={c.title}
              loading="lazy"
              className="aspect-[5/4] w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <p className="text-[10px] uppercase tracking-widest">
                Chapter {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 font-medium">{c.title}</p>
            </div>
          </div>
          <div className={i % 2 === 0 ? "sm:order-1" : "sm:order-2"}>
            <ChapterRule n={String(i + 1).padStart(2, "0")} label={c.tag} />
            <h2 className="max-w-sm text-2xl font-semibold leading-tight tracking-tight">
              {c.title}
            </h2>
            <p className="mt-5 leading-7 text-muted-foreground">{c.text}</p>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4">
              {c.specs.map(([a, b]) => (
                <div key={a}>
                  <p className="text-[10px] uppercase text-muted-foreground">{a}</p>
                  <p className="mt-1 text-xs font-medium">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
function SpecCards({ groups }: { groups: typeof audioSpecs }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {groups.map((g) => (
        <div className="rounded-lg border p-4" key={g.title}>
          <p className="mb-4 text-[10px] uppercase tracking-widest text-muted-foreground">
            {g.title}
          </p>
          {g.rows.slice(0, 3).map(([a, b]) => (
            <div key={a} className="mt-3 text-xs">
              <p className="text-muted-foreground">{a}</p>
              <p className="mt-1 font-medium">{b}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
function StoryDetail() {
  const [color, setColor] = useState("Onyx");
  return (
    <ProductFrame>
      <Breadcrumbs items={["Audio", "Headphones", "Resonance Wave Pro"]} />
      <div className="grid items-start gap-8 sm:grid-cols-2 sm:gap-14">
        <ProductGallery
          name="Resonance Wave Pro"
          images={[img.headphones, img.headphones, img.headphones, img.headphones, img.workspace]}
          vertical
          style={{
            filter:
              color === "Sand" ? "sepia(.35)" : color === "Sage" ? "hue-rotate(60deg)" : "none",
          }}
        />
        <div className="space-y-5">
          <p className="text-[10px] tracking-widest text-muted-foreground">HEADPHONES · WIRELESS</p>
          <h1 className="text-3xl font-semibold tracking-tight">Resonance Wave Pro</h1>
          <RatingStars count="1,243 reviews" />
          <ProductPrice price={279} old={349} label="20% OFF" large />
          <ColorPicker
            colors={[
              { name: "Onyx", value: "#151b2b" },
              { name: "Sand", value: "#ffe38a" },
              { name: "Sage", value: "#007959" },
            ]}
            value={color}
            onChange={setColor}
            name="COLOR"
          />
          <Bullets
            items={[
              "40-hour battery with adaptive ANC on",
              "Adaptive noise cancellation with transparency",
              "Hi-res wireless: LDAC / aptX HD / AAC",
              "USB-C fast charge: 10 min returns 5 hours",
            ]}
          />
          <div className="flex gap-2">
            <CartAction name="Resonance Wave Pro" detail={color} price={279} className="flex-1" />
            <ProductWish name="Resonance Wave Pro" />
          </div>
          <TrustRow simple />
        </div>
      </div>
      <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-20">
        <EditorialChapters chapters={audioChapters} />
        <section>
          <ChapterRule n="04" label="Specifications" />
          <Heading eyebrow="">Every Number, In One Place.</Heading>
          <p className="mb-7 max-w-xl leading-6 text-muted-foreground">
            The hardware, battery, connectivity and build, brought together in a single readable
            place.
          </p>
          <SpecCards groups={resonanceSpecs} />
        </section>
        <section>
          <ChapterRule n="05" label="Reviews" />
          <Heading eyebrow="">What Buyers Say.</Heading>
          <p className="mb-9 text-muted-foreground">
            Field notes from people who have made the Pro part of their day.
          </p>
          <div className="grid gap-10 sm:grid-cols-2 sm:gap-14">
            <ReviewSummary count="1,243" />
            <ReviewCarousel />
          </div>
          <div className="mt-7">
            <AllReviewsButton count="1,243" />
          </div>
        </section>
      </div>
    </ProductFrame>
  );
}
function SpecDetail() {
  const [color, setColor] = useState("Graphite"),
    [plug, setPlug] = useState("USB-C"),
    [quantity, setQuantity] = useState(1);
  return (
    <ProductFrame>
      <Breadcrumbs items={["Audio", "Headphones", "Atlas Pro Wireless"]} />
      <div className="grid items-start gap-8 sm:grid-cols-[1.15fr_1fr] sm:gap-12">
        <ProductGallery
          name="Atlas Pro Wireless"
          images={[
            img.headphones,
            img.headphones,
            img.headphones,
            img.headphones,
            img.headphones,
            img.headphones,
          ]}
          style={{
            filter:
              color === "Sand" ? "sepia(.3)" : color === "Midnight" ? "brightness(.75)" : "none",
          }}
        />
        <div className="space-y-5 sm:sticky sm:top-8">
          <p className="text-xs text-muted-foreground">Audio · Headphones</p>
          <h1 className="text-3xl font-semibold tracking-tight">Atlas Pro Wireless</h1>
          <Badge variant="outline" className="font-mono text-[10px]">
            SKU: AERIAL-APW-22
          </Badge>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground">By Aerial</span>
            <RatingStars count="412 reviews" />
          </div>
          <p className="leading-6 text-muted-foreground">
            Over-ear wireless headphones with long battery life, hybrid noise cancellation and a
            hand-finished aluminum frame.
          </p>
          <ProductPrice price={349} old={399} label="13% OFF" large />
          <ColorPicker colors={audioColors} value={color} onChange={setColor} />
          <div className="space-y-3">
            <p>
              Plug Type: <span className="text-muted-foreground">{plug}</span>
            </p>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Plug type">
              {["USB-C", "Lightning", "3.5 mm"].map((p) => (
                <Button
                  key={p}
                  aria-pressed={plug === p}
                  variant="outline"
                  className={cn(plug === p && "border-foreground bg-muted")}
                  onClick={() => setPlug(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Quantity value={quantity} onChange={setQuantity} />
            <CartAction
              name="Atlas Pro Wireless"
              detail={`${color} · ${plug}`}
              quantity={quantity}
              price={349}
              className="flex-1"
            />
          </div>
          <ProductWish name="Atlas Pro Wireless" words className="w-full" />
          <TrustRow />
        </div>
      </div>
      <div className="mt-16 space-y-12">
        <section>
          <Heading eyebrow="Overview">A Flagship Over-Ear, Refined Twice</Heading>
          <div className="grid gap-8 sm:grid-cols-[1.25fr_1fr] sm:gap-14">
            <div className="space-y-4 leading-7">
              <p>
                Atlas Pro brings a balanced driver, a closed acoustic chamber and a thoughtfully
                finished frame together for everyday listening. Voices remain clear and the low end
                feels composed.
              </p>
              <p>
                Hybrid noise cancellation adapts to the room, while transparency lets a conversation
                through. Multipoint keeps a phone and a laptop connected throughout the working day.
              </p>
            </div>
            <div className="space-y-4">
              {[
                ["Hybrid ANC", "A quieter commute, office and cabin."],
                ["40-Hour Battery", "A full day of listening and a quick top-up."],
                ["Multipoint Bluetooth", "Move between two devices with ease."],
                ["Replaceable Ear Pads", "Memory foam pads swap without tools."],
              ].map(([a, b]) => (
                <div className="flex gap-3" key={a}>
                  <Check className="mt-1 size-5 shrink-0 rounded-full bg-muted p-1" />
                  <div>
                    <h3 className="text-xs font-semibold">{a}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="border-t pt-12">
          <Heading eyebrow="Specifications">Built Like A Pro Tool, Tuned For Daily Use</Heading>
          <SpecRows groups={audioSpecs} />
        </section>
        <div className="border-t pt-12">
          <ReviewsSection />
        </div>
        <div className="border-t pt-12">
          <RelatedProducts />
        </div>
      </div>
    </ProductFrame>
  );
}

const bookChapters: Chapter[] = [
  {
    tag: "The Method",
    title: "Clarity is a craft, not a personality type.",
    text: "A practical guide to focused work, built around a weekly ritual and a daily check-in. Small habits, considered carefully, and easy to return to when the week gets busy.",
    image: img.reading,
    specs: [
      ["Pages", "188 pages"],
      ["Chapters", "17 short chapters"],
      ["Examples", "Six worked through"],
    ],
  },
  {
    tag: "Inside The Book",
    title: "Three parts that build on each other.",
    text: "Start with attention, build a system, and learn how to keep it running. Each part ends with a simple recap and an exercise you can try on real work.",
    image: img.library,
    specs: [
      ["Part One", "5 chapters on attention"],
      ["Part Two", "7 chapters on the system"],
      ["Part Three", "5 chapters on staying clear"],
    ],
  },
  {
    tag: "For Daily Use",
    title: "Read it once, run it for years.",
    text: "Keep the workbook nearby for a weekly review. Revisit a chapter on a commute with the author-narrated audiobook, or adapt the included template to your own working rhythm.",
    image: img.books,
    specs: [
      ["Workbook", "20 fillable pages"],
      ["Audiobook", "6 h, author-narrated"],
      ["Template", "Notion, free updates"],
    ],
  },
];
const chapterTitles = [
  "Why The Week Slips",
  "The Three Practices",
  "Calendar As Compass",
  "Notes Worth Keeping",
  "Recap And First Try",
  "Sunday In Thirty Minutes",
  "The Weekly Review",
  "Daily Check-In",
  "Decision Debt",
  "Saying No, Clearly",
  "Working With A Team",
  "Recap And Worked Example",
  "Busy Seasons",
  "The Bad Week",
  "Travel And Life Changes",
  "Coming Back After A Break",
  "Recap And Long View",
];
function EbookDetail() {
  const [format, setFormat] = useState(1),
    [sample, setSample] = useState(false);
  const formats = [
    ["Ebook", "PDF · ePub"],
    ["Ebook + Audio", "Plus 6 h audiobook"],
    ["Complete Bundle", "Adds workbook + template"],
  ];
  const price = [19, 29, 49][format];
  return (
    <ProductFrame>
      <Breadcrumbs items={["Ebooks", "Productivity", "The Clear System"]} />
      <div className="grid gap-8 sm:grid-cols-2 sm:gap-14">
        <ProductGallery
          name="The Clear System"
          images={[img.books, img.reading, img.library, img.books, img.reading]}
          lookInside
          aspect="aspect-[4/3]"
        />
        <div className="space-y-4">
          <p className="text-[10px] tracking-widest text-muted-foreground">EBOOKS · PRODUCTIVITY</p>
          <h1 className="text-3xl font-semibold tracking-tight">The Clear System</h1>
          <div className="flex flex-wrap gap-3 text-xs">
            <span>By Quiet Press</span>
            <RatingStars rating={4.9} count="2,456" />
          </div>
          <p className="leading-6 text-muted-foreground">
            A practical method for finding focus and leaving a little more room in the week.
          </p>
          <ProductPrice
            price={price}
            old={[29, 44, 78][format]}
            label={format === 2 ? "37% Off" : "34% Off"}
            large
          />
          <p className="text-xs text-muted-foreground">
            FORMAT · <span className="text-foreground">{formats[format][0]}</span>
          </p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Edition format">
            {formats.map(([name, note], i) => (
              <Button
                key={name}
                variant="outline"
                className={cn(
                  "h-auto min-h-14 flex-col gap-1 whitespace-normal px-1 text-[11px]",
                  format === i && "border-foreground bg-muted",
                )}
                aria-pressed={format === i}
                aria-label={name}
                onClick={() => setFormat(i)}
              >
                <span>{name}</span>
                <span className="text-[9px] font-normal text-muted-foreground">{note}</span>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              [FileText, "PDF · ePub"],
              [Headphones, format > 0 ? "6 h audiobook" : "Digital edition"],
              [ShieldCheck, "DRM-free"],
              [Download, "Free updates"],
            ].map(([Icon, t]) => {
              const Mark = Icon as typeof FileText;
              return (
                <Badge key={String(t)} variant="outline" className="gap-1 text-[9px]">
                  <Mark className="size-3" />
                  {String(t)}
                </Badge>
              );
            })}
          </div>
          <Bullets
            items={[
              "188 pages, 17 short chapters averaging 8 minutes each",
              "Six practical examples for focused work",
              format === 2
                ? "Companion workbook and Notion template included"
                : "Workbook and template in Complete Bundle",
              "Single-reader, lifetime license with free updates",
            ]}
          />
          <div className="flex gap-2">
            <CartAction
              name="The Clear System"
              detail={formats[format][0]}
              price={price}
              className="flex-1"
            >
              Add to Bag
            </CartAction>
            <ProductWish name="The Clear System" />
          </div>
          <p className="text-[10px] leading-6 text-muted-foreground">
            Instant download · 30-day refund · Lifetime free updates
          </p>
        </div>
      </div>
      <section className="my-14 grid gap-8 rounded-lg bg-muted/40 p-6 sm:grid-cols-[1fr_2.3fr] sm:p-10">
        <div className="text-xs text-muted-foreground">
          <p className="mb-4">00</p>
          <h2 className="mb-2 text-[10px] font-medium tracking-widest text-foreground">
            READ THE OPENING
          </h2>
          <p>From The Foreword · Chapter Zero</p>
          <p className="mt-3">Roughly 4 minutes to read</p>
        </div>
        <div className="space-y-5 font-serif text-base leading-8">
          <p className="first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-semibold">
            There was always another planner, another page, another way to begin again on Monday.
            What I needed was something smaller: a practice I could return to in the middle of a
            real, unfinished week.
          </p>
          <p>
            Clarity starts with a little time to notice what matters. A quiet review, an honest
            list, and a next step small enough to take today.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 font-sans text-[10px] text-muted-foreground">
            <span>Original sample for this independent demo</span>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setSample(true)}>
              Read The Full Sample, Free <ArrowRight />
            </Button>
          </div>
        </div>
      </section>
      <EditorialChapters chapters={bookChapters} />
      <section className="mt-16">
        <ChapterRule n="04" label="Table Of Contents" />
        <Heading eyebrow="">Seventeen short chapters, in three parts.</Heading>
        <p className="mb-6 text-muted-foreground">
          Small chapters designed to fit into an ordinary working week.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Attention", 0, 5],
            ["The System", 5, 12],
            ["Staying Clear", 12, 17],
          ].map(([title, start, end], i) => (
            <div className="rounded-lg border p-4" key={String(title)}>
              <p className="text-[10px] tracking-widest text-muted-foreground">
                PART {["ONE", "TWO", "THREE"][i]}
              </p>
              <h3 className="mb-4 mt-1 font-semibold">{String(title)}</h3>
              <ol className="divide-y">
                {chapterTitles.slice(Number(start), Number(end)).map((t, j) => (
                  <li className="flex gap-3 py-2 text-xs" key={t}>
                    <span className="font-mono text-muted-foreground">
                      {String(Number(start) + j + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">{t}</span>
                    <span className="text-muted-foreground">{8 + (j % 5)}m</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-16">
        <ChapterRule n="05" label="The Details" />
        <Heading eyebrow="">What ships with your order.</Heading>
        <SpecCards
          groups={[
            {
              title: "What You Get",
              rows: [
                ["PDF edition", "Print-ready, tablet and desktop"],
                ["ePub", "Reflowable for any ereader"],
                ["Audiobook", "6 h (Audio and Bundle)"],
              ],
            },
            {
              title: "Inside The Book",
              rows: [
                ["Length", "188 pages"],
                ["Chapters", "17 short chapters"],
                ["Average chapter", "8 to 12 minutes"],
              ],
            },
            {
              title: "About The Author",
              rows: [
                ["Author", "Marin Holm"],
                ["Background", "Designer in independent practice"],
                ["Write back", "Demo contact available locally"],
              ],
            },
            {
              title: "License And Refund",
              rows: [
                ["License", "Single reader, lifetime"],
                ["Refund", "30 days"],
                ["Updates", "Lifetime, sent by email"],
              ],
            },
          ]}
        />
      </section>
      <section className="mt-16">
        <ChapterRule n="06" label="From Readers" />
        <Heading eyebrow="">2,456 readers, 4.9 stars on average.</Heading>
        <div className="grid gap-10 sm:grid-cols-2">
          <ReviewSummary rating={4.9} count="2,456" />
          <ReviewCarousel
            reviews={[
              {
                name: "Anaïs Béland",
                text: "Short chapters made it easy to find a place for a weekly review. The small exercises turn a good idea into something I can actually use.",
              },
              {
                name: "Theo Larsen",
                text: "Concrete examples and a calm reading rhythm. I return to the daily check-in more than any other chapter.",
              },
              {
                name: "Priya Anand",
                text: "A useful companion to a busy working week. The workbook made it easier to get started.",
              },
            ]}
          />
        </div>
        <div className="mt-7">
          <AllReviewsButton count="2,456" />
        </div>
      </section>
      <Dialog open={sample} onOpenChange={setSample}>
        <DialogContent className="max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>The Clear System · Free sample</DialogTitle>
            <DialogDescription>
              An original short sample written for this independent preview.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 font-serif text-base leading-8">
            <p>
              Begin with a blank page. Write down the things that keep returning to your attention,
              without deciding what they mean yet.
            </p>
            <p>
              Choose one commitment you can make this week. Give it a place on your calendar and a
              next step that takes less than twenty minutes.
            </p>
            <p>
              At the end of the week, return to the page. Notice what moved, what changed, and what
              can wait.
            </p>
          </div>
          <Button onClick={() => setSample(false)}>
            <BookOpen /> Back to the book
          </Button>
        </DialogContent>
      </Dialog>
    </ProductFrame>
  );
}

function CapacityPicker({
  kind,
  value,
  onChange,
}: {
  kind: "coffee" | "bag";
  value: string;
  onChange: (value: string) => void;
}) {
  const sizes =
    kind === "coffee"
      ? [
          ["350 ml", "1 cup"],
          ["500 ml", "2 cups"],
          ["700 ml", "3 cups"],
        ]
      : [
          ["14 L", "Day pack"],
          ["18 L", "Commute"],
          ["24 L", "Travel"],
        ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p>
          Size: <span className="text-muted-foreground">{value}</span>
        </p>
        <SizeGuide kind={kind} />
      </div>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Capacity">
        {sizes.map(([name, note]) => (
          <Button
            key={name}
            variant="outline"
            className={cn(
              "h-auto flex-col gap-1 py-2",
              value === name && "border-foreground bg-muted",
            )}
            aria-label={`Size ${name} (${note})`}
            aria-pressed={value === name}
            onClick={() => onChange(name)}
          >
            <span>{name}</span>
            <span className="text-[10px] font-normal text-muted-foreground">{note}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
const coffeeReviews = [
  {
    name: "Noor Haidari",
    title: "Replaced my old setup.",
    text: "An even pour, a comfortable handle and coffee that stays warm through a slow breakfast. Simple to rinse and ready for another day.",
  },
  {
    name: "Daniel Park",
    title: "A calm morning ritual.",
    text: "The dripper sits securely and the carafe pours cleanly. A considered piece of kit that earns its space on the counter.",
  },
  {
    name: "Priya Sharma",
    title: "Warm through the second cup.",
    text: "A useful size for two people and easy to clean after the morning rush.",
  },
  {
    name: "Jules Akinyemi",
    title: "A welcome daily upgrade.",
    text: "The ceramic holds heat well and the carafe feels reassuring in the hand.",
  },
];
function CompactDetail() {
  const [color, setColor] = useState("Cream"),
    [capacity, setCapacity] = useState("700 ml"),
    [quantity, setQuantity] = useState(1),
    [buy, setBuy] = useState(false),
    [confirmed, setConfirmed] = useState(false);
  const stock = color === "Cobalt" ? 2 : 4;
  const changeColor = (v: string) => {
    setColor(v);
    setQuantity((q) => Math.min(q, v === "Cobalt" ? 2 : 4));
  };
  return (
    <ProductFrame>
      <div className="grid items-start gap-8 sm:grid-cols-2 sm:gap-12">
        <div className="sm:sticky sm:top-8">
          <ProductGallery
            name="Drift Pour-Over Kit"
            images={[img.coffeePour, img.coffee, img.coffeePour, img.ceramics, img.coffee]}
          />
        </div>
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-xs tracking-wider text-muted-foreground">
              ATLAS GOODS · COFFEE
            </p>
            <h1 className="mb-3 text-2xl font-semibold tracking-tight">Drift Pour-Over Kit</h1>
            <RatingStars count="1,842 reviews" />
          </div>
          <ProductPrice price={89} old={112} label="Save $23" large />
          <Bullets
            items={[
              "Hand-thrown ceramic with a 60-degree cone",
              "Double-wall carafe keeps the second cup warm",
              "Dishwasher-safe carafe, hand-wash dripper",
            ]}
          />
          <ColorPicker colors={coffeeColors} value={color} onChange={changeColor} />
          <CapacityPicker kind="coffee" value={capacity} onChange={setCapacity} />
          <p className="text-xs leading-6">
            <span className="mr-1 text-emerald-500">●</span>{" "}
            <strong>
              Only {stock} left in {color}
            </strong>
            <span className="mx-2 text-muted-foreground/50">·</span>
            <span className="text-muted-foreground">Free shipping over $75.00</span>
          </p>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Quantity value={quantity} onChange={setQuantity} max={stock} />
              <CartAction
                name="Drift Pour-Over Kit"
                detail={`${color} · ${capacity}`}
                quantity={quantity}
                price={89}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setConfirmed(false);
                  setBuy(true);
                }}
              >
                Buy Now
              </Button>
              <ProductWish name="Drift Pour-Over Kit" />
            </div>
          </div>
        </div>
      </div>
      <section className="mt-16 border-t pt-12">
        <h2 className="mb-7 text-xl font-semibold">Product Details</h2>
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-12">
          <div>
            <p className="mb-4 text-[10px] tracking-widest text-muted-foreground">ABOUT</p>
            <p className="text-base leading-7">
              Drift brings a ceramic cone and a double-wall carafe together for an unhurried daily
              brew. The angled ribs guide water evenly through the coffee, while the glass carafe
              keeps a second cup warm.
            </p>
          </div>
          <div>
            <p className="mb-4 text-[10px] tracking-widest text-muted-foreground">SPECS</p>
            <SpecRows groups={coffeeSpecs} />
          </div>
        </div>
      </section>
      <section className="mt-14 border-t pt-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">What Buyers Say</h2>
          <AllReviewsButton count="1,842" reviews={coffeeReviews} />
        </div>
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-12">
          <ReviewSummary count="1,842" />
          <ReviewCarousel reviews={coffeeReviews} />
        </div>
      </section>
      <div className="mt-14 border-t pt-12">
        <RelatedProducts kind="coffee" />
      </div>
      <Dialog open={buy} onOpenChange={setBuy}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmed ? "Order preview confirmed" : "Review your order"}</DialogTitle>
            <DialogDescription>
              {confirmed
                ? "No payment was taken. This confirmation stays in the demo."
                : "A local checkout preview. No payment details are requested."}
            </DialogDescription>
          </DialogHeader>
          <p className="font-medium">Drift Pour-Over Kit</p>
          <p className="text-sm text-muted-foreground">
            {color} · {capacity} · Quantity {quantity}
          </p>
          <div className="flex justify-between border-t pt-4">
            <span>Total</span>
            <strong>
              <Money value={89 * quantity} />
            </strong>
          </div>
          <Button onClick={() => (confirmed ? setBuy(false) : setConfirmed(true))}>
            {confirmed ? "Continue shopping" : "Confirm demo order"}
          </Button>
        </DialogContent>
      </Dialog>
    </ProductFrame>
  );
}
const bagStories = [
  {
    tag: "Material",
    title: "Leather that earns its patina.",
    text: "Vegetable-tanned leather keeps a record of each day. Small marks settle into a deeper tone over time, leaving a bag that feels a little more your own.",
    image: img.bagTan,
  },
  {
    tag: "Build",
    title: "Built to carry a workday.",
    text: "A suspended sleeve keeps a laptop off the bottom panel. The main compartment leaves room for lunch, a book and the layers that come with a changeable day.",
    image: img.bagSlate,
  },
  {
    tag: "Travel",
    title: "Carry-on legal, weather-resistant, lifetime backed.",
    text: "A durable lining and carefully finished seams help keep the weather outside. Repairable construction makes this a companion for the trips still to come.",
    image: img.bag,
  },
];
function SingleColumnDetail() {
  const [color, setColor] = useState("Tobacco"),
    [capacity, setCapacity] = useState("18 L"),
    [quantity, setQuantity] = useState(1);
  const stock = color === "Charcoal" ? 3 : 6;
  const selected = bagColors.find((c) => c.name === color)!;
  return (
    <div>
      <ProductFrame narrow>
        <Breadcrumbs items={["Bags", "Backpacks", "Drift Mariner Pack"]} />
        <header className="mx-auto mb-9 max-w-lg space-y-3 text-center">
          <p className="text-[10px] tracking-[.15em] text-muted-foreground">ATLAS GOODS · BAGS</p>
          <h1 className="text-3xl font-semibold tracking-tight">Drift Mariner Pack</h1>
          <p className="leading-6 text-muted-foreground">
            A full-grain leather backpack tuned for long commutes and longer travel days.
          </p>
          <div className="flex justify-center">
            <RatingStars rating={4.8} count="1,284 reviews" />
          </div>
        </header>
        <ProductGallery
          key={color}
          name="Drift Mariner Pack"
          images={[selected.image!, img.bagTan, img.bagSlate, img.bagTan, img.bag]}
          aspect="aspect-[4/3]"
        />
        <div className="mx-auto mb-12 mt-8 max-w-md space-y-5">
          <div className="flex justify-center">
            <ProductPrice price={345} old={399} label="Save $54" large />
          </div>
          <Bullets
            items={[
              "Full-grain saddle leather, vegetable-tanned",
              "Padded 16-inch laptop sleeve, suspended off the bottom",
              "Lifetime repair warranty on hand-stitched main seam",
            ]}
          />
          <div className="flex justify-center">
            <ColorPicker
              colors={bagColors}
              value={color}
              onChange={(v) => {
                setColor(v);
                setQuantity((q) => Math.min(q, v === "Charcoal" ? 3 : 6));
              }}
            />
          </div>
          <CapacityPicker kind="bag" value={capacity} onChange={setCapacity} />
          <p className="text-center text-xs">
            <span className="text-emerald-500">●</span> Only {stock} left in {color}
            <span className="ml-2 text-muted-foreground">· Free shipping over $150.00</span>
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Quantity value={quantity} onChange={setQuantity} max={stock} />
            <CartAction
              name="Drift Mariner Pack"
              detail={`${color} · ${capacity}`}
              quantity={quantity}
              price={345}
            />
            <ProductWish name="Drift Mariner Pack" />
          </div>
        </div>
        <p className="mb-12 text-lg leading-8">
          Mariner is the carry for a day that does not move in a straight line. From a morning ride
          to the last train home, it leaves room for what you need and gets more familiar with every
          trip.
        </p>
        <div className="space-y-12">
          {bagStories.map((story, i) => (
            <section
              className="grid grid-cols-[32px_1fr] gap-3 sm:grid-cols-[48px_1fr]"
              key={story.title}
            >
              <span className="font-mono text-2xl text-muted-foreground/50 sm:text-4xl">
                0{i + 1}
              </span>
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {story.tag}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight">{story.title}</h2>
                <p className="my-5 leading-7 text-muted-foreground">{story.text}</p>
                <img
                  src={story.image}
                  alt={story.title}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                />
              </div>
            </section>
          ))}
        </div>
        <section className="mt-14">
          <Heading eyebrow="Specifications">Every Number, In One Place.</Heading>
          <SpecRows groups={bagSpecs} />
        </section>
        <section className="mt-14">
          <div className="mb-8 flex flex-wrap justify-between gap-6">
            <Heading eyebrow="Reviews">What Owners Say.</Heading>
            <div className="flex gap-6">
              <div>
                <p className="text-[9px] tracking-widest text-muted-foreground">RATING</p>
                <strong className="text-lg">
                  4.8 <span className="text-xs font-normal text-muted-foreground">/ 5</span>
                </strong>
                <RatingStars rating={4.8} />
              </div>
              <div>
                <p className="text-[9px] tracking-widest text-muted-foreground">RECOMMEND</p>
                <strong className="text-lg">92%</strong>
                <p className="mt-1 text-[10px] text-muted-foreground">1,284 verified</p>
              </div>
            </div>
          </div>
          <span className="font-serif text-5xl text-muted-foreground/30">“</span>
          <ReviewCarousel
            segments
            reviews={[
              {
                name: "Leon Vargas",
                text: "The suspended sleeve fits my laptop and leaves me comfortable on a bike commute. The leather has developed a richer tone after a few weeks.",
                date: "6 days ago",
              },
              {
                name: "Ines Carbone",
                text: "A useful everyday layout and reassuring hardware. It has handled the journey to work and a rainy weekend away.",
                date: "2 weeks ago",
              },
              {
                name: "Tomas Reinhardt",
                text: "A considered shape that keeps its structure. The lining and stitching are the details I notice each time I use it.",
                date: "3 weeks ago",
              },
              {
                name: "Ada Mensah",
                text: "Room for a laptop and a change of clothes, without feeling oversized on a crowded train.",
                date: "4 weeks ago",
              },
              {
                name: "Noor Haidari",
                text: "Easy to pack for a short trip and comfortable to carry across town.",
                date: "1 month ago",
              },
            ]}
          />
          <div className="mt-6 flex justify-end">
            <AllReviewsButton count="1,284" label="Read All Reviews" />
          </div>
        </section>
      </ProductFrame>
      <div className="border-t bg-muted/15">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <RelatedProducts kind="bags" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetails({ block }: BlockProps) {
  switch (block.index + 1) {
    case 1:
      return <ShoeDetail />;
    case 2:
      return <StoryDetail />;
    case 3:
      return <SpecDetail />;
    case 4:
      return <EbookDetail />;
    case 5:
      return <CompactDetail />;
    case 6:
      return <SingleColumnDetail />;
    default:
      throw new Error(`Unknown product detail ${block.id}`);
  }
}
