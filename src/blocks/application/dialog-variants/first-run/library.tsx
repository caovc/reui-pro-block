import { useState } from "react";
import { LayoutTemplate } from "lucide-react";
import { demoPanel } from "@/lib/demo-artwork";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogSurface } from "./free/dialog-surface";
import { DialogLauncher } from "./support";
import { templateCategories, templateRecords, type StarterTemplate } from "./template-data";

export default function TemplateLibraryDialog() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("release");
  const [saved, setSaved] = useState<StarterTemplate | "blank" | null>(null);
  const visible = templateRecords.filter(
    (template) =>
      (category === "all" || template.category === category) &&
      `${template.name} ${template.description} ${template.team} ${template.tags.join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const selected = visible.find((template) => template.id === selectedId) ?? visible[0];

  function chooseTemplate(template: StarterTemplate | "blank") {
    setSaved(template);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogLauncher
        id={5}
        title="Starter library"
        description="Find a useful starting point for your team."
        icon={<LayoutTemplate />}
        action="Open template library"
        result={
          saved && (
            <span>
              {saved === "blank" ? "Blank workspace" : saved.name} selected locally. No project or
              remote workspace has been created.
            </span>
          )
        }
      >
        <ItemGroup>
          {templateRecords.slice(0, 3).map((template, index) => (
            <Item variant="outline" size="xs" key={template.id}>
              <ItemMedia>
                <img className="h-10 w-16 rounded object-cover" src={demoPanel(index)} alt="" />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle>{template.name}</ItemTitle>
                <ItemDescription>{template.team}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </DialogLauncher>
      <DialogSurface
        id={5}
        title="Starter library"
        description="Choose a ready operating shape, then tailor it to your team."
        footer={
          <>
            <p className="refined-template-selection" aria-live="polite">
              {visible.length} ready{selected && <span> · {selected.name}</span>}
            </p>
            <div className="refined-dialog-actions">
              <Button variant="outline" onClick={() => chooseTemplate("blank")}>
                Build from blank
              </Button>
              <Button disabled={!selected} onClick={() => selected && chooseTemplate(selected)}>
                Open template
              </Button>
            </div>
          </>
        }
      >
        <div className="refined-template-layout">
          <ScrollArea className="refined-template-rail">
            <p className="mb-3 text-xs text-muted-foreground">Use cases</p>
            <RadioGroup value={category} onValueChange={setCategory} aria-label="Use cases">
              {templateCategories.map((entry) => (
                <FieldLabel
                  key={entry.id}
                  className="refined-template-category"
                  htmlFor={`refined-template-category-${entry.id}`}
                  data-selected={category === entry.id}
                >
                  <RadioGroupItem
                    id={`refined-template-category-${entry.id}`}
                    value={entry.id}
                    className="sr-only"
                  />
                  <IconTile
                    variant="soft"
                    size="sm"
                    className={`refined-template-tone-${entry.tone}`}
                  >
                    <entry.icon />
                  </IconTile>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span>{entry.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {entry.description}
                    </span>
                  </span>
                </FieldLabel>
              ))}
            </RadioGroup>
          </ScrollArea>
          <div className="refined-template-main">
            <div className="refined-template-search">
              <Input
                aria-label="Search templates"
                placeholder="Search templates, workflows, or teams..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <ScrollArea className="refined-template-results">
              {visible.length ? (
                <ItemGroup>
                  {visible.map((template) => (
                    <Item
                      asChild
                      variant={selected?.id === template.id ? "muted" : "outline"}
                      key={template.id}
                      className="refined-template-card"
                    >
                      <button
                        type="button"
                        aria-label={`Select ${template.name}`}
                        aria-pressed={selected?.id === template.id}
                        onClick={() => setSelectedId(template.id)}
                      >
                        <ItemMedia>
                          <img
                            src={demoPanel(templateRecords.indexOf(template))}
                            alt={`${template.name} original demo preview`}
                          />
                        </ItemMedia>
                        <ItemContent className="min-w-0">
                          <div className="refined-template-card-title">
                            <ItemTitle>{template.name}</ItemTitle>
                            <Badge variant="secondary" size="sm">
                              {template.team}
                            </Badge>
                          </div>
                          <ItemDescription>{template.description}</ItemDescription>
                          <div className="flex flex-wrap gap-1.5">
                            {template.tags.map((tag, index) => (
                              <Badge
                                key={tag}
                                size="sm"
                                variant={
                                  index === 1
                                    ? "focus-light"
                                    : index === 2
                                      ? "warning-light"
                                      : "secondary"
                                }
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </ItemContent>
                      </button>
                    </Item>
                  ))}
                </ItemGroup>
              ) : (
                <Empty className="refined-template-empty">
                  <EmptyHeader>
                    <EmptyTitle>No templates match</EmptyTitle>
                    <EmptyDescription>
                      Try a broader search or switch to another collection to keep exploring.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogSurface>
    </Dialog>
  );
}
