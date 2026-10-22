import { useState } from "react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { photos, SectionHeading, PageArrows } from "./shared";

const posts = [
  {
    title: "Good design starts with better questions.",
    category: "Perspective",
    image: photos.workspace,
    author: "Alex Morgan",
    time: "6 min read",
    text: "Before the wireframes and the components, there is a more useful place to start: understanding what people are trying to do.",
  },
  {
    title: "The quiet power of a considered system.",
    category: "Design systems",
    image: photos.architecture,
    author: "Jamie Chen",
    time: "8 min read",
    text: "How a few deliberate decisions can give a team the freedom to build with confidence.",
  },
  {
    title: "Make space for the work that matters.",
    category: "Practice",
    image: photos.coast,
    author: "Sam Rivera",
    time: "5 min read",
    text: "A practical guide to making your tools, your process, and your day feel a little lighter.",
  },
  {
    title: "Small details. Lasting impressions.",
    category: "Craft",
    image: photos.chair,
    author: "Taylor Brooks",
    time: "4 min read",
    text: "The details people notice are often the ones they can’t quite name. That’s where craft comes in.",
  },
];
export function Blog({ block }: BlockProps) {
  const i = block.index,
    [page, setPage] = useState(0),
    [article, setArticle] = useState<number | null>(i >= 4 ? 0 : null);
  const p = posts[article ?? 0];
  if (article !== null)
    return (
      <article className="mx-auto max-w-3xl p-6 sm:p-10">
        <Button variant="ghost" size="sm" onClick={() => setArticle(null)}>
          ← All articles
        </Button>
        <div
          className={cn(
            "mt-5",
            i === 4 && "relative overflow-hidden rounded-xl",
          )}
        >
          <img
            src={p.image}
            alt="Editorial cover"
            className="aspect-[16/8] w-full rounded-xl object-cover"
          />
          {i === 4 && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          )}
          <div
            className={cn(
              "py-7",
              i === 4 && "absolute bottom-0 p-7 text-white",
            )}
          >
            <Badge variant="secondary">{p.category}</Badge>
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">
              {p.title}
            </h1>
            <p className="mt-4 text-xs opacity-70">
              By {p.author} · October 22, 2026 · {p.time}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-6 py-4 text-sm leading-7 text-muted-foreground">
          <p className="text-lg leading-8 text-foreground">{p.text}</p>
          <p>
            The best systems make complex things feel simple. They give people a
            clear place to start, and just enough structure to keep going. That
            clarity comes from making thoughtful choices, one small decision at
            a time.
          </p>
          <h2 className="text-xl font-semibold text-foreground">
            Start with what matters.
          </h2>
          <p>
            Ask what the person on the other side of the screen needs to
            understand, decide, or do. Then build around that. Remove the parts
            that create work without adding value. Make the important things
            easy to find.
          </p>
          <blockquote className="border-l-2 border-foreground pl-5 text-lg italic text-foreground">
            “Craft is the care you put into the things that other people will
            use.”
          </blockquote>
          <p>
            Better tools don’t happen all at once. They grow through
            observation, iteration, and a willingness to keep asking whether
            this could feel a little better.
          </p>
        </div>
        <Separator className="my-7" />
        <SectionHeading title="Read next" />
        <div className="grid gap-4 sm:grid-cols-2">
          {posts
            .filter((x) => x !== p)
            .slice(0, 2)
            .map((x) => (
              <button
                className="text-left"
                key={x.title}
                onClick={() => setArticle(posts.indexOf(x))}
              >
                <img
                  src={x.image}
                  alt=""
                  className="aspect-[16/9] w-full rounded-lg object-cover"
                />
                <p className="mt-3 text-sm font-medium">{x.title}</p>
              </button>
            ))}
        </div>
      </article>
    );
  return (
    <div className="mx-auto max-w-6xl p-6 sm:p-10">
      <SectionHeading
        title={i === 3 ? "News & insights" : "From the journal"}
        description="Ideas, perspectives, and a closer look at the way we work."
        action={
          i === 2 ? (
            <PageArrows
              onPrevious={() => setPage((page + 3) % 4)}
              onNext={() => setPage((page + 1) % 4)}
            />
          ) : undefined
        }
      />
      <div
        className={cn(
          "grid gap-6",
          i === 2 ? "md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {(i === 2
          ? [posts[page], posts[(page + 1) % 4]]
          : posts.slice(0, 3)
        ).map((x) => (
          <button
            key={x.title}
            onClick={() => setArticle(posts.indexOf(x))}
            className={cn(
              "group flex flex-col overflow-hidden rounded-xl text-left",
              i !== 1 && "border",
              i === 1 && "relative min-h-[390px]",
            )}
          >
            <img
              src={x.image}
              alt=""
              className={cn(
                "aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105",
                i === 1 && "absolute inset-0 size-full",
                i === 3 && "grayscale group-hover:grayscale-0",
              )}
            />
            {i === 1 && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            )}
            <div
              className={cn(
                "relative flex flex-1 flex-col gap-3 p-5",
                i === 1 && "mt-auto justify-end text-white",
              )}
            >
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary">{x.category}</Badge>
                <span className="opacity-60">{x.time}</span>
              </div>
              <h3 className="text-lg font-medium leading-6 tracking-tight">
                {x.title}
              </h3>
              {i !== 1 && (
                <p className="text-sm leading-6 text-muted-foreground">
                  {x.text}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="flex size-7 items-center justify-center rounded-full bg-muted text-foreground">
                  {x.author
                    .split(" ")
                    .map((t) => t[0])
                    .join("")}
                </span>
                {x.author}
                <ArrowUpRight className="ml-auto size-4" />
              </div>
            </div>
          </button>
        ))}
      </div>
      {i === 2 && (
        <div className="mt-6 h-px bg-border">
          <div
            className="h-px bg-foreground transition-all"
            style={{ width: `${(page + 1) * 25}%` }}
          />
        </div>
      )}
    </div>
  );
}

export { FAQ, Contact } from "./marketing-contact-faq";

export function MarketingCompare({ block }: BlockProps) {
  const i = block.index,
    [info, setInfo] = useState(false);
  const before = [
      "Write a prompt from scratch",
      "Search for components",
      "Fix inconsistent styling",
      "Wire up every interaction",
      "Test responsive layouts",
    ],
    after = [
      "Choose a thoughtful starting point",
      "Add your content and data",
      "Make it yours with tokens",
      "Connect the pieces",
      "Ship with confidence",
    ];
  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-10">
      <SectionHeading
        title="A better starting point."
        description="Spend more time on the work that makes your product yours."
        action={
          <Button variant="outline" onClick={() => setInfo(!info)}>
            See how it works
            <ArrowRight data-icon="inline-end" />
          </Button>
        }
      />
      {i === 1 ? (
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-3 bg-muted/40 p-4 text-xs font-medium">
            <span>What you need</span>
            <span className="text-center">With a system</span>
            <span>From scratch</span>
          </div>
          {[
            "Consistent components",
            "Responsive layouts",
            "Accessible controls",
            "Theme support",
            "Editable source",
            "Working interactions",
          ].map((t, j) => (
            <div key={t} className="grid grid-cols-3 border-t text-sm">
              <span className="p-4">{t}</span>
              <span className="flex items-center justify-center bg-emerald-500/10 text-emerald-600">
                <Check className="size-4" />
              </span>
              <span className="p-4 text-muted-foreground">
                {
                  [
                    "Build each one",
                    "Set every breakpoint",
                    "Check every control",
                    "Maintain two styles",
                    "Write from zero",
                    "Wire everything up",
                  ][j]
                }
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {[before, after].map((steps, j) => (
            <div
              key={j}
              className={cn(
                "rounded-xl border p-6",
                j === 1 && "border-emerald-500/20 bg-emerald-500/5",
              )}
            >
              <Badge variant="outline">
                {j === 0 ? "The long way" : "A considered way"}
              </Badge>
              <h3 className="mt-5 text-xl font-semibold">
                {j === 0 ? "Start from nothing." : "Start with clarity."}
              </h3>
              <div className="mt-6 flex flex-col gap-5">
                {steps.map((s, k) => (
                  <div key={s} className="flex items-center gap-3 text-sm">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full border text-xs",
                        j === 1 && "border-emerald-500/20 text-emerald-600",
                      )}
                    >
                      {j === 1 ? <Check className="size-3" /> : k + 1}
                    </span>
                    {s}
                  </div>
                ))}
              </div>
              <div className="mt-7 rounded-lg bg-background/70 p-4 text-sm">
                <span className="text-muted-foreground">
                  Time to a solid foundation
                </span>
                <p className="mt-1 font-medium">
                  {j === 0
                    ? "Days of setup and iteration"
                    : "Minutes to make it yours"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      {info && (
        <div className="mt-5 rounded-lg border p-5 text-sm leading-6 text-muted-foreground">
          Choose a block, open its source tab, and copy the component files into
          your project. Shared shadcn primitives keep the result consistent with
          the rest of your app.
        </div>
      )}
    </div>
  );
}
