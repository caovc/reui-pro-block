import { useState } from "react";
import { FileText, Play, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SearchCardsIllustration } from "./free/search-cards";
import { EmptyHero, EmptyStage, LocalDialog } from "./first-run/shared";

const library = [
  {
    title: "Meeting transcript",
    type: "Transcripts",
    detail: "Product review · 24 minutes · #research",
  },
  { title: "Launch plan", type: "Files", detail: "Launch checklist and owners · #launch-plan" },
  { title: "Handoff notes", type: "Notes", detail: "Engineering handoff · #handoff" },
];
const types = ["Files", "Notes", "Transcripts"];

export default function SearchEmpty() {
  const [query, setQuery] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState(types);
  const [draftTypes, setDraftTypes] = useState(types);
  const [detail, setDetail] = useState<(typeof library)[number] | null>(null);
  const results = library.filter(
    (file) =>
      selected.includes(file.type) &&
      (!query ||
        `${file.title} ${file.detail}`
          .toLowerCase()
          .includes(query.replaceAll('"', "").replace(/^#/, "").toLowerCase())),
  );

  return (
    <EmptyStage id={2}>
      {query !== null ? (
        <div className="empty-first-populated">
          <header>
            <div>
              <h1>Workspace library</h1>
              <p>Local example files · {results.length} results</p>
            </div>
            <Button variant="outline" onClick={() => setQuery(null)}>
              Back to empty state
            </Button>
          </header>
          <div className="mb-6 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                aria-label="Search library"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Search files, notes, or tags"
              />
            </div>
            <Button
              variant="outline"
              aria-label="Refine filters"
              onClick={() => {
                setDraftTypes(selected);
                setFiltersOpen(true);
              }}
            >
              <SlidersHorizontal />
            </Button>
          </div>
          <div className="grid gap-2" aria-live="polite">
            {results.length ? (
              results.map((file) => (
                <Button
                  key={file.title}
                  variant="outline"
                  onClick={() => setDetail(file)}
                  className="h-auto justify-start gap-3 p-4 text-left whitespace-normal"
                >
                  <FileText className="size-5" />
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm">{file.title}</strong>
                    <span className="mt-1 block text-xs text-muted-foreground">{file.detail}</span>
                  </span>
                  <Badge variant="secondary">{file.type}</Badge>
                </Button>
              ))
            ) : (
              <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No files match these filters. Try another query or include more file types.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <EmptyHero
            media={<SearchCardsIllustration />}
            title="No search matches yet"
            description="Broaden your query or browse the library to explore files, notes, and tagged moments across the workspace."
          >
            <ButtonGroup>
              <Button onClick={() => setQuery("")}>
                <Play />
                Browse library
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDraftTypes(selected);
                  setFiltersOpen(true);
                }}
              >
                <SlidersHorizontal />
                Refine filters
              </Button>
            </ButtonGroup>
          </EmptyHero>
          <div className="empty-first-suggestions">
            <h2>Try these searches</h2>
            <div>
              {['"meeting transcript"', "#launch-plan", '"handoff notes"'].map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setQuery(term)}
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
      <LocalDialog
        title="Refine filters"
        description="Choose which local example file types to include."
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
      >
        <div className="grid gap-4">
          {types.map((type) => (
            <label key={type} className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={draftTypes.includes(type)}
                onCheckedChange={(checked) =>
                  setDraftTypes((current) =>
                    checked ? [...current, type] : current.filter((value) => value !== type),
                  )
                }
              />
              {type}
            </label>
          ))}
          <Button
            onClick={() => {
              setSelected(draftTypes);
              setQuery(query ?? "");
              setFiltersOpen(false);
            }}
          >
            Apply filters
          </Button>
        </div>
      </LocalDialog>
      <LocalDialog
        title={detail?.title ?? "File preview"}
        description="Local example content. No document service is connected."
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">{detail?.detail}</p>
        <p className="text-sm leading-relaxed">
          The team aligned the next milestone, recorded decisions, and assigned a single owner to
          each follow-up. Review the checklist before the next handoff.
        </p>
      </LocalDialog>
    </EmptyStage>
  );
}
