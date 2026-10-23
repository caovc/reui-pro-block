import { useId, useState, type FormEvent } from "react";
import { Bell, BellRing, Check } from "lucide-react";
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/reui/alert";

/** Actual controlled official c-dialog-1 form composition, adapted to a local reminder.
 * https://reui.io/r/radix-nova/c-dialog-1.json · MIT, Keenthemes.
 */
export function DropReminder({
  email,
  onSave,
}: {
  email: string | null;
  onSave: (email: string | null) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSave(String(data.get("email")).trim());
    setOpen(false);
  }
  return (
    <div className="space-y-3">
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          setError("");
        }}
      >
        <DialogTrigger asChild>
          <Button className="bg-white text-black hover:bg-white/90">
            {email ? <BellRing className="size-4" /> : <Bell className="size-4" />}
            {email ? "Edit Drop Reminder" : "Set A Drop Reminder"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>A little heads-up for the next drop</DialogTitle>
            <DialogDescription>
              The Longer Way · Friday, 8 AM PT. Save a reminder in this preview; no email is sent.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="contents">
            <FieldGroup>
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor={id}>Email address</FieldLabel>
                <Input
                  id={id}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={email || ""}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(error)}
                  onInvalid={() => setError("Enter a valid email address.")}
                  onChange={() => setError("")}
                />
                <FieldDescription>
                  Your address stays in this local preview and resets on reload.
                </FieldDescription>
                {error && <FieldError>{error}</FieldError>}
              </Field>
            </FieldGroup>
            <DialogFooter className="flex-wrap">
              {email && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    onSave(null);
                    setOpen(false);
                  }}
                >
                  Remove reminder
                </Button>
              )}
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">{email ? "Update reminder" : "Save reminder"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {email && (
        <Alert variant="success" className="max-w-sm bg-background/95 text-foreground">
          <Check />
          <AlertDescription className="min-w-0 break-all">
            Reminder saved for {email}. This preview does not send email.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
