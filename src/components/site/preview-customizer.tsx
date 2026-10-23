import { useState, type ReactNode } from "react";
import {
  Blend,
  ChartNoAxesCombined,
  Check,
  Copy,
  CornerDownRight,
  Library,
  ListFilter,
  PaintBucket,
  PanelLeftClose,
  Palette,
  Shapes,
  Shuffle,
  Sun,
  Type,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Frame, FrameHeader, FrameTitle, FramePanel } from "@/components/reui/frame";
import { ColorPicker } from "@/components/reui/color-picker";
import {
  accents,
  fonts,
  defaultTheme,
  normalizeTheme,
  themeCSS,
  themeOptions,
  type PreviewTheme,
} from "./preview-theme";

const labels: Record<string, string> = {
  inter: "Inter",
  geist: "Geist",
  system: "System",
  serif: "Serif",
  mono: "Mono",
  "0": "Square",
  "0.375": "Small radius",
  "0.625": "Default radius",
  "1": "Large radius",
  inherit: "Match site",
  default: "Default",
  theme: "Match theme",
  colorful: "Colorful",
};
const title = (value: string) => labels[value] || value[0].toUpperCase() + value.slice(1);
const bases: Record<string, string> = {
  default: "#737373",
  neutral: "#737373",
  zinc: "#71717a",
  stone: "#78716c",
  gray: "#6b7280",
  slate: "#64748b",
};
function Setting({
  label,
  name = label,
  value,
  options,
  onChange,
  icon,
  colors,
  fontPreview,
  custom,
}: {
  label: string;
  name?: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  icon: ReactNode;
  colors?: Record<string, string>;
  fontPreview?: boolean;
  custom?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={name} className="theme-setting-row">
        <span className="theme-row-copy">
          <span className="theme-row-label">{label}</span>
          <span className="theme-row-value">{custom ? "Custom" : <SelectValue />}</span>
        </span>
        <span className="theme-row-icon" aria-hidden="true">
          {colors ? (
            <span
              className="theme-swatch"
              style={{ background: custom || colors[value] || "#737373" }}
            />
          ) : (
            icon
          )}
        </span>
      </SelectTrigger>
      <SelectContent
        position="popper"
        side="right"
        align="start"
        sideOffset={10}
        className="theme-setting-options"
      >
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              <span
                className="theme-option"
                style={
                  fontPreview ? { fontFamily: fonts[option as keyof typeof fonts] } : undefined
                }
              >
                {colors && (
                  <span
                    aria-hidden="true"
                    className="theme-swatch theme-option-swatch"
                    style={{ background: colors[option] || "#737373" }}
                  />
                )}
                {title(option)}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
function Foundation({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div
      className="theme-setting-row theme-foundation"
      title={`${value} is the installed ${label.toLowerCase()}.`}
    >
      <span className="theme-row-copy">
        <span className="theme-row-label">{label}</span>
        <span className="theme-row-value">{value}</span>
      </span>
      <span className="theme-row-icon" aria-hidden="true">
        {icon}
      </span>
    </div>
  );
}
export function PreviewCustomizer({
  theme,
  onChange,
  onClose,
  presetLink,
}: {
  theme: PreviewTheme;
  onChange: (value: PreviewTheme) => void;
  onClose: () => void;
  presetLink: string;
}) {
  const [presetOpen, setPresetOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState("");
  const update = (key: keyof PreviewTheme, value: string) =>
    onChange({ ...theme, [key]: value, ...(key === "accent" ? { custom: "" } : {}) });
  const presetId =
    Array.from(JSON.stringify(theme)).reduce(
      (hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619),
      2166136261,
    ) >>> 0;
  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
      return true;
    } catch {
      toast.error("Clipboard unavailable. Try again with clipboard access enabled.");
      return false;
    }
  }
  function shuffle() {
    const pick = (values: readonly string[]) => values[Math.floor(Math.random() * values.length)];
    onChange({
      ...theme,
      base: pick(themeOptions.base),
      accent: pick(themeOptions.accent.filter((v) => v !== "default")),
      custom: "",
      radius: pick(themeOptions.radius),
      chart: pick(themeOptions.chart),
    });
  }
  function importPreset() {
    try {
      const text = input.trim();
      const url = text.startsWith("{") ? null : new URL(text, location.origin);
      const serialized = url
        ? new URLSearchParams(url.hash.split("?")[1] || url.search).get("preset")
        : text;
      if (!serialized) throw new Error();
      const value: unknown = JSON.parse(serialized);
      if (
        !value ||
        typeof value !== "object" ||
        !Object.keys(themeOptions).some((key) => key in value)
      )
        throw new Error();
      onChange(normalizeTheme(value));
      setPresetOpen(false);
      setError("");
      toast.success("Global preset applied");
    } catch {
      setError("Paste a Bricklane preset link or valid theme JSON.");
    }
  }
  return (
    <aside id="preview-customizer" aria-label="Preview customization" className="theme-customizer">
      <Frame variant="ghost" spacing="sm" className="theme-customizer-frame">
        <FrameHeader className="theme-customizer-header">
          <FrameTitle>Customize</FrameTitle>
          <span className="theme-scope">Global</span>
          <Button variant="ghost" size="icon-sm" aria-label="Close customizer" onClick={onClose}>
            <PanelLeftClose />
          </Button>
        </FrameHeader>
        <FramePanel className="theme-customizer-fields">
          <Foundation label="Component Library" value="Radix UI" icon={<Library />} />
          <Foundation label="Style" value="Nova" icon={<Shapes />} />
          <Setting
            label="Base Color"
            name="Base color"
            value={theme.base}
            options={themeOptions.base}
            colors={bases}
            icon={<Palette />}
            onChange={(v) => update("base", v)}
          />
          <Setting
            label="Theme"
            name="Accent color"
            value={theme.accent}
            options={themeOptions.accent}
            colors={{ default: "#737373", ...accents }}
            custom={theme.custom}
            icon={<Palette />}
            onChange={(v) => update("accent", v)}
          />
          <div className="theme-custom-color">
            <ColorPicker
              aria-label="Custom accent"
              placeholder="Custom accent…"
              value={theme.custom || null}
              format="hex"
              onValueChange={(v) => (v ? update("custom", v) : update("custom", ""))}
            />
          </div>
          <Setting
            label="Chart Color"
            name="Chart color"
            value={theme.chart}
            options={themeOptions.chart}
            icon={<ChartNoAxesCombined />}
            onChange={(v) => update("chart", v)}
          />
          <Foundation label="Icon Library" value="Lucide" icon={<Blend />} />
          <Setting
            label="Heading"
            name="Heading font"
            value={theme.heading}
            options={themeOptions.heading}
            fontPreview
            icon={<Type />}
            onChange={(v) => update("heading", v)}
          />
          <Setting
            label="Font"
            name="Body font"
            value={theme.font}
            options={themeOptions.font}
            fontPreview
            icon={<Type />}
            onChange={(v) => update("font", v)}
          />
          <Setting
            label="Radius"
            name="Corner radius"
            value={theme.radius}
            options={themeOptions.radius}
            icon={<CornerDownRight />}
            onChange={(v) => update("radius", v)}
          />
          <Setting
            label="Menu"
            value={theme.menu}
            options={themeOptions.menu}
            icon={<ListFilter />}
            onChange={(v) => update("menu", v)}
          />
          <Setting
            label="Menu Accent"
            name="Menu accent"
            value={theme.menuAccent}
            options={themeOptions.menuAccent}
            icon={<PaintBucket />}
            onChange={(v) => update("menuAccent", v)}
          />
          <Setting
            label="Mode"
            name="Preview mode"
            value={theme.mode}
            options={themeOptions.mode}
            icon={<Sun />}
            onChange={(v) => update("mode", v)}
          />
        </FramePanel>
        <div className="theme-customizer-actions">
          <Button
            variant="outline"
            size="sm"
            aria-label="Copy preset link"
            onClick={async () => {
              const success = await copy(presetLink, "Preset link copied");
              setCopiedLink(success ? presetLink : "");
            }}
          >
            <span className="theme-preset-id">preset {presetId.toString(36)}</span>
            {copiedLink === presetLink ? <Check /> : <Copy />}
          </Button>
          <Dialog
            open={presetOpen}
            onOpenChange={(open) => {
              setPresetOpen(open);
              if (!open) setError("");
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Open preset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogTitle>Open theme preset</DialogTitle>
              <DialogDescription>
                Paste a preset link to apply its theme across Bricklane.
              </DialogDescription>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  importPreset();
                }}
                className="grid gap-3"
              >
                <Input
                  aria-label="Preset link or JSON"
                  placeholder="Paste a preset link…"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  aria-invalid={Boolean(error)}
                />
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button type="submit">Apply preset</Button>
              </form>
            </DialogContent>
          </Dialog>
          <div className="theme-action-pair">
            <Button variant="outline" size="sm" onClick={shuffle}>
              <Shuffle />
              Shuffle
            </Button>
            <Button variant="outline" size="sm" onClick={() => onChange({ ...defaultTheme })}>
              <RotateCcw />
              Reset
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copy(themeCSS(theme), "Theme CSS copied")}
          >
            <Copy />
            Copy theme CSS
          </Button>
          <p>Applies to the site, blocks and templates. Saved across visits.</p>
        </div>
      </Frame>
    </aside>
  );
}
