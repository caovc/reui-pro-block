import { useState } from "react";
import { Plus } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DialogSurface } from "../../dialog-variants/first-run/free/dialog-surface";
import { AccountMenu } from "../first-run/free/account-menu";
import { ToolbarSearch } from "./free/search";
import NotificationsFeed from "./notifications";
import { PlaceholderPanel, ToolbarNotice, ToolbarScene } from "./support";
import { useToolbarTheme } from "./use-theme";

export default function AdminCommandNavbar() {
  const { theme, setTheme, dark } = useToolbarTheme();
  const [notice, setNotice] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <ToolbarScene id={4} dark={dark}>
      <header className="toolbar-admin">
        <div className="toolbar-brand">
          <BrandMark className="size-7" />
          <span className="text-sm font-semibold">Bricklane</span>
        </div>
        <div className="toolbar-centered-search">
          <ToolbarSearch onSelect={(file) => setNotice(`Selected ${file} locally.`)} />
        </div>
        <div className="toolbar-actions">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus data-icon="inline-start" />
                New
              </Button>
            </DialogTrigger>
            <DialogSurface
              id={104}
              title="Create workspace item"
              description="Save a local example draft. Nothing is created remotely."
              footer={
                <>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    disabled={!name.trim()}
                    onClick={() => {
                      setNotice(`Created ${name.trim()} locally. No remote request was sent.`);
                      setCreateOpen(false);
                      setName("");
                    }}
                  >
                    Create draft
                  </Button>
                </>
              }
            >
              <Field>
                <FieldLabel htmlFor="navbar4-draft-name">Item name</FieldLabel>
                <Input
                  id="navbar4-draft-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                />
              </Field>
            </DialogSurface>
          </Dialog>
          <NotificationsFeed />
          <Separator orientation="vertical" className="h-5" />
          <AccountMenu
            dark={dark}
            theme={theme}
            onThemeChange={setTheme}
            onAction={(action) => setNotice(`${action}: local account demo.`)}
          />
        </div>
      </header>
      <PlaceholderPanel />
      <ToolbarNotice>{notice}</ToolbarNotice>
    </ToolbarScene>
  );
}
