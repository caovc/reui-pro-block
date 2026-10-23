import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/reui/badge";
import { AccountMenu } from "../first-run/free/account-menu";
import { PlaceholderPanel, ToolbarNotice, ToolbarScene } from "../toolbars/support";
import { useToolbarTheme } from "../toolbars/use-theme";
import type { DesignSection, SyncSource } from "./data";
import { DesignSections } from "./free/sections";
import { SyncPicker } from "./free/sync-picker";
import "./developer.css";

export default function DesignSystemNavbar() {
  const { theme, setTheme, dark } = useToolbarTheme();
  const [section, setSection] = useState<DesignSection>("Patterns");
  const [source, setSource] = useState<SyncSource>("shadcn");
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <ToolbarScene id={11} dark={dark}>
      <header className="developer-design-header">
        <div className="developer-brand">
          <BrandMark className="size-8 shrink-0" />
          <span className="sr-only">Bricklane</span>
          <Badge variant="outline" size="sm">
            v2.3.0
          </Badge>
        </div>
        <div className="developer-sections">
          <DesignSections value={section} onChange={setSection} />
        </div>
        <div className="developer-tools">
          <SyncPicker
            value={source}
            onChange={(next) => {
              setSource(next);
              setNotice(`Sync source set to ${next} locally. No remote files were synchronized.`);
            }}
          />
          <AccountMenu
            theme={theme}
            dark={dark}
            onThemeChange={setTheme}
            onAction={(action) => setNotice(`${action} selected locally. No account was changed.`)}
          />
        </div>
      </header>
      <PlaceholderPanel>
        <output className="sr-only" aria-live="polite">
          Design section: {section}. Sync source: {source}.
        </output>
      </PlaceholderPanel>
      <ToolbarNotice>{notice}</ToolbarNotice>
    </ToolbarScene>
  );
}
