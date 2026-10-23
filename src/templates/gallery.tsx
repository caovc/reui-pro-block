import { useEffect, useRef, useState } from "react";
import { ArrowRight, ExternalLink, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { templates, templateCategories } from "./catalog";
import type { TemplateMeta } from "./catalog";
import "./templates.css";

function TemplateThumbnail({ template, dark }: { template: TemplateMeta; dark: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(500);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const intersection = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          intersection.disconnect();
        }
      },
      { rootMargin: "150px" },
    );
    const resize = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    intersection.observe(element);
    resize.observe(element);
    return () => {
      intersection.disconnect();
      resize.disconnect();
    };
  }, []);
  return (
    <div className="template-thumbnail" ref={ref} aria-hidden="true">
      <div
        inert
        className="template-thumbnail-inner"
        style={{ width: 1440, height: 940, transform: `scale(${width / 1440})` }}
      >
        {visible ? (
          <iframe
            key={`${template.id}-${dark}`}
            src={`#/template-preview/${template.id}`}
            title={`${template.name} thumbnail`}
            width="1440"
            height="940"
            tabIndex={-1}
            className="border-0"
          />
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </div>
    </div>
  );
}

export default function TemplateGallery({ dark }: { dark: boolean }) {
  const [category, setCategory] = useState("All Templates");
  const [query, setQuery] = useState("");
  const filtered = templates.filter(
    (t) =>
      (category === "All Templates" || t.category === category) &&
      `${t.name} ${t.subtitle} ${t.description} ${t.features.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  return (
    <section className="template-gallery">
      <div className="template-gallery-heading">
        <span className="text-xs font-medium tracking-widest text-muted-foreground">TEMPLATES</span>
        <h1>Full-page Templates</h1>
        <p>
          Complete workspaces for your next product. Explore 18 independent, interactive recreations
          built with React and shadcn/ui.
        </p>
        <div className="template-gallery-controls">
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList variant="line">
              {templateCategories.map((name) => (
                <TabsTrigger key={name} value={name}>
                  {name}
                  <span className="text-xs text-muted-foreground">
                    {name === "All Templates"
                      ? templates.length
                      : templates.filter((t) => t.category === name).length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="template-search">
            <Search size={16} />
            <Input
              aria-label="Search templates"
              placeholder="Search templates…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Clear template search"
                onClick={() => setQuery("")}
              >
                <X />
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="template-gallery-results" aria-live="polite">
        <span>{filtered.length} templates</span>
        <span>Interactive local demos</span>
      </div>
      <div className="template-list">
        {filtered.map((template) => (
          <article className="template-list-row" key={template.id}>
            <div className="template-list-copy">
              <Badge variant="secondary">{template.category}</Badge>
              <h2>
                <a href={`#/templates/${template.id}`}>
                  {template.name} <span>— {template.subtitle}</span>
                </a>
              </h2>
              <p>{template.description}</p>
              <div className="flex flex-wrap gap-2">
                {template.features.map((feature) => (
                  <Badge key={feature} variant="outline">
                    {feature}
                  </Badge>
                ))}
              </div>
              <div className="template-list-actions">
                <Button asChild>
                  <a href={`#/templates/${template.id}`}>
                    Open template <ArrowRight />
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={template.reference} target="_blank" rel="noopener noreferrer">
                    Reference <ExternalLink />
                  </a>
                </Button>
              </div>
            </div>
            <a
              className="template-preview-link"
              href={`#/templates/${template.id}`}
              aria-label={`Preview ${template.name}`}
            >
              <TemplateThumbnail template={template} dark={dark} />
              <span className="template-preview-hint">
                Explore {template.name}
                <ArrowRight size={16} />
              </span>
            </a>
          </article>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="template-load-state">
          <h2>No matching templates</h2>
          <p>Try a different name or category.</p>
          <Button
            onClick={() => {
              setCategory("All Templates");
              setQuery("");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </section>
  );
}
