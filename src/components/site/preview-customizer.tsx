import { Copy, RotateCcw, Shuffle, X } from "lucide-react";
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
  Frame,
  FrameHeader,
  FrameTitle,
  FramePanel,
} from "@/components/reui/frame";
import { ColorPicker } from "@/components/reui/color-picker";
import {
  accents,
  defaultTheme,
  themeCSS,
  themeOptions,
  type PreviewTheme,
} from "./preview-theme";

const labels: Record<string, string> = {
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
};
function Setting({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="preset-setting">
      <span>{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {labels[option] || option[0].toUpperCase() + option.slice(1)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </label>
  );
}
export function PreviewCustomizer({
  theme,
  onChange,
  onClose,
  presetLink,
}: {
  theme: PreviewTheme;
  onChange: (v: PreviewTheme) => void;
  onClose: () => void;
  presetLink: string;
}) {
  const update = (key: keyof PreviewTheme, value: string) =>
    onChange({
      ...theme,
      [key]: value,
      ...(key === "accent" ? { custom: "" } : {}),
    });
  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error(
        "Clipboard unavailable. Try again with clipboard access enabled.",
      );
    }
  }
  function shuffle() {
    const pick = (values: readonly string[]) =>
      values[Math.floor(Math.random() * values.length)];
    onChange({
      ...theme,
      base: pick(themeOptions.base),
      accent: pick(themeOptions.accent),
      custom: "",
      radius: pick(themeOptions.radius),
      chart: pick(themeOptions.chart),
    });
  }
  return (
    <aside
      id="preview-customizer"
      aria-label="Preview customization"
      className="preset-sidebar"
    >
      <Frame spacing="sm" className="preset-frame">
        <FrameHeader className="flex-row items-center justify-between">
          <FrameTitle>Customize</FrameTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close customizer"
            onClick={onClose}
          >
            <X />
          </Button>
        </FrameHeader>
        <FramePanel className="preset-fields">
          <div className="preset-foundation">
            <span>Component library</span>
            <strong>Radix UI</strong>
            <span>Style · Nova</span>
            <span>Icons · Lucide</span>
          </div>
          <Setting
            label="Base color"
            value={theme.base}
            options={themeOptions.base}
            onChange={(v) => update("base", v)}
          />
          <Setting
            label="Accent color"
            value={theme.accent}
            options={themeOptions.accent}
            onChange={(v) => update("accent", v)}
          />
          <div className="preset-setting">
            <span>Custom accent</span>
            <ColorPicker
              aria-label="Custom accent"
              value={
                theme.custom || accents[theme.accent as keyof typeof accents]
              }
              format="hex"
              onValueChange={(v) => v && update("custom", v)}
            />
          </div>
          <Setting
            label="Chart color"
            value={theme.chart}
            options={themeOptions.chart}
            onChange={(v) => update("chart", v)}
          />
          <Setting
            label="Heading font"
            value={theme.heading}
            options={themeOptions.heading}
            onChange={(v) => update("heading", v)}
          />
          <Setting
            label="Body font"
            value={theme.font}
            options={themeOptions.font}
            onChange={(v) => update("font", v)}
          />
          <Setting
            label="Corner radius"
            value={theme.radius}
            options={themeOptions.radius}
            onChange={(v) => update("radius", v)}
          />
          <Setting
            label="Preview mode"
            value={theme.mode}
            options={themeOptions.mode}
            onChange={(v) => update("mode", v)}
          />
        </FramePanel>
        <div className="preset-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copy(themeCSS(theme), "Theme CSS copied")}
          >
            <Copy />
            Copy theme CSS
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copy(presetLink, "Preset link copied")}
          >
            <Copy />
            Copy preset link
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={shuffle}>
              <Shuffle />
              Shuffle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ ...defaultTheme })}
            >
              <RotateCcw />
              Reset
            </Button>
          </div>
          <p>
            Settings apply to the live preview and are saved on this device.
          </p>
        </div>
      </Frame>
    </aside>
  );
}
