import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, Code, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { WorkspaceTrail } from "./free/trail";
import { ContextSwitcher } from "./free/context-switcher";
import { AccountMenu } from "./free/account-menu";
import { LocalNotice } from "./support";
import { organizations, projects, environments } from "./platform-data";
import "./navbar.css";

export default function PlatformNavbar() {
  const [organization, setOrganization] = useState("bricklane");
  const [project, setProject] = useState("web");
  const [environment, setEnvironment] = useState("production");
  const [theme, setTheme] = useState("light");
  const [systemDark, setSystemDark] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const dark = theme === "dark" || (theme === "system" && systemDark);
  const action = (value: string) => setNotice(`${value}: local demonstration only.`);
  return (
    <section
      className={dark ? "refined-navbar-scene dark" : "refined-navbar-scene"}
      data-navbar-entry="3"
      data-theme={theme}
    >
      <h1 className="navbar-demo-heading">Navbar</h1>
      <header className="navbar-platform-header">
        <div className="navbar-platform-trail">
          <WorkspaceTrail
            items={[
              {
                label: "Organization",
                content: (
                  <ContextSwitcher
                    label="Organization"
                    options={organizations}
                    value={organization}
                    onChange={setOrganization}
                    onAction={action}
                  />
                ),
              },
              {
                label: "Project",
                content: (
                  <ContextSwitcher
                    label="Project"
                    options={projects}
                    value={project}
                    onChange={setProject}
                    onAction={action}
                  />
                ),
              },
              {
                label: "Environment",
                content: (
                  <ContextSwitcher
                    label="Environment"
                    options={environments}
                    value={environment}
                    onChange={setEnvironment}
                    onAction={action}
                  />
                ),
              },
            ]}
          />
        </div>
        <div className="navbar-header-actions">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="Documentation menu">
                Docs
                <ChevronDown data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <a href="https://ui.shadcn.com/docs" target="_blank" rel="noreferrer">
                    <BookOpen />
                    Documentation
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://react.dev/reference/react" target="_blank" rel="noreferrer">
                    <Code />
                    API Reference
                  </a>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Platform settings"
            onClick={() => action("Settings")}
          >
            <Settings />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setUpgradeOpen(true)}>
            Upgrade
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <AccountMenu dark={dark} theme={theme} onThemeChange={setTheme} onAction={action} />
        </div>
      </header>
      <div className="navbar-demo-placeholder" aria-label="Platform content placeholder">
        <output className="sr-only" aria-live="polite">
          {organization} / {project} / {environment}
        </output>
      </div>
      <LocalNotice>{notice}</LocalNotice>
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade workspace</DialogTitle>
            <DialogDescription>
              Preview a plan change locally. No checkout or payment occurs.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Pro workspace · Unlimited collaborators · Advanced project controls
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setNotice("Pro plan selected locally. No billing changes were made.");
                setUpgradeOpen(false);
              }}
            >
              Preview Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
