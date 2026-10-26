// Actual official free ReUI c-button-24 + c-toggle-1 + c-button-44, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-button-24.json
// SHA256: fc621c952559010bed66f84201717ca0868681fec52b1a7f718057d9c8ef566c
// https://reui.io/r/radix-nova/c-toggle-1.json
// SHA256: 570bee8300d975d5852c7b8ff0bbc719d379a4955dd440e34f2b765381713c92
// https://reui.io/r/radix-nova/c-button-44.json
// SHA256: 0a59cf3182651e1aec8d410cb862d120209e9033a5b696f4e17b446e75b1782c
// Actual native controls/compositions and async idle/loading/success branches retained.
// Domain labels change; auto-reset is removed because a sent draft remains sent.
import { useEffect, useRef, useState } from "react";
import { Check, PanelRightClose, PanelRightOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Toggle } from "@/components/ui/toggle";

export function CloseEditorButton({ onClose }: { onClose: () => void }) {
  return (
    <Button size="icon-xs" variant="outline" aria-label="Close editor" onClick={onClose}>
      <X aria-hidden="true" />
    </Button>
  );
}

export function PreviewToggle({
  visible,
  onChange,
}: {
  visible: boolean;
  onChange: (visible: boolean) => void;
}) {
  return (
    <Toggle
      pressed={!visible}
      onPressedChange={(collapsed) => onChange(!collapsed)}
      aria-controls="navbar-invoice-preview"
      aria-label={visible ? "Collapse preview" : "Show preview"}
      size="sm"
    >
      {visible ? <PanelRightClose aria-hidden="true" /> : <PanelRightOpen aria-hidden="true" />}
      <span>{visible ? "Collapse preview" : "Show preview"}</span>
    </Toggle>
  );
}

export function ReviewSubmitButton({
  submitted,
  onSubmitted,
}: {
  submitted: boolean;
  onSubmitted: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success">(
    submitted ? "success" : "idle",
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <Button
      onClick={() => {
        if (status !== "idle") return;
        setStatus("loading");
        timer.current = setTimeout(() => {
          setStatus("success");
          onSubmitted();
        }, 900);
      }}
      disabled={status === "loading"}
      aria-busy={status === "loading"}
      aria-live="polite"
      className="min-w-32"
      size="sm"
    >
      {status === "loading" ? (
        <>
          <Spinner aria-hidden="true" />
          Submitting…
        </>
      ) : status === "success" ? (
        <>
          <Check aria-hidden="true" />
          Sent for review
        </>
      ) : (
        "Submit"
      )}
    </Button>
  );
}
