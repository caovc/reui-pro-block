import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Item, ItemActions, ItemContent } from "@/components/ui/item";

export function LucentOriginsDialog({
  origins,
  onChange,
}: {
  origins: readonly string[];
  onChange: (origins: string[]) => void;
}) {
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState("");

  function addOrigin() {
    try {
      const url = new URL(origin.trim());
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      ) {
        throw new Error("Invalid origin");
      }
      if (origins.includes(url.origin)) {
        setError("This origin is already allowed.");
        return;
      }
      onChange([...origins, url.origin]);
      setOrigin("");
      setError("");
    } catch {
      setError(
        "Enter an HTTP or HTTPS origin without a path, for example https://app.example.com.",
      );
    }
  }

  return (
    <Dialog
      onOpenChange={() => {
        setOrigin("");
        setError("");
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Plus aria-hidden="true" />
          Add origin
        </Button>
      </DialogTrigger>
      <DialogContent className="reui-reference wf-lucent-origin-dialog">
        <DialogHeader>
          <DialogTitle>Allowed origins</DialogTitle>
          <DialogDescription>
            Browsers may call the API from these domains. Add one per entry.
          </DialogDescription>
        </DialogHeader>
        <div className="wf-lucent-origin-list" aria-label="Allowed origins">
          {origins.map((value) => (
            <Item variant="outline" key={value}>
              <ItemContent>
                <code>{value}</code>
              </ItemContent>
              <ItemActions>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${value}`}
                  onClick={() => onChange(origins.filter((entry) => entry !== value))}
                >
                  <X aria-hidden="true" />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </div>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="lucent-new-origin">New origin</FieldLabel>
          <Input
            id="lucent-new-origin"
            value={origin}
            placeholder="https://app.example.com"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "lucent-origin-error" : undefined}
            onChange={(event) => {
              setOrigin(event.target.value);
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addOrigin();
              }
            }}
          />
          {error && <FieldError id="lucent-origin-error">{error}</FieldError>}
        </Field>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Done
            </Button>
          </DialogClose>
          <Button type="button" onClick={addOrigin}>
            Add origin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
