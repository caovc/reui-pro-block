import type { ReactNode } from "react";
import { Copy, Eye, Share2, Sparkles, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { useId, useState } from "react";
import { Logo } from "./workflow-shell";
import { copyMeshText, meshPageLink } from "./mesh-page-actions";

const teammates = [
  { name: "Leo Grant", initials: "LG", color: "#e4eaff", state: "Here" },
  { name: "Mira Stone", initials: "MS", color: "#e2f2e6", state: "Here" },
  { name: "Nora Vale", initials: "NV", color: "#ffecd9", state: "Here" },
  { name: "Ravi Shah", initials: "RS", color: "#f2e4fa", state: "Away" },
];

export function MeshHeader({
  title,
  status,
  children,
  navigation,
  onHome,
  onAskAI,
  assistantOpen,
  readOnly,
  onReadOnlyChange,
  documentId,
}: {
  title: "Canvas" | "Documents";
  status?: string;
  children?: ReactNode;
  navigation?: ReactNode;
  onHome: () => void;
  onAskAI: () => void;
  assistantOpen: boolean;
  readOnly: boolean;
  onReadOnlyChange: (value: boolean) => void;
  documentId?: string;
}) {
  const id = useId();
  const [access, setAccess] = useState(() =>
    new URLSearchParams(location.search).get("mode") === "view" ? "view" : "edit",
  );
  return (
    <header className="mesh-page-header">
      <Button
        className="wf-mobile-brand mesh-mobile-brand"
        variant="ghost"
        size="icon-sm"
        aria-label="Bricklane home"
        onClick={onHome}
      >
        <Logo />
      </Button>
      <SidebarTrigger className="wf-mobile-menu" aria-label="Open navigation" />
      <span className="mesh-page-title">{title}</span>
      {status && (
        <span className="mesh-page-save" role="status">
          {status}
        </span>
      )}
      {navigation}
      <div className="mesh-page-actions">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="mesh-presence"
              aria-label="People on this page"
            >
              <span className="mesh-presence-avatars" aria-hidden="true">
                {teammates.slice(0, 3).map((person) => (
                  <Avatar key={person.name} className="size-6 border-2 border-background">
                    <AvatarFallback
                      style={{ background: person.color }}
                      className="text-[8px] text-zinc-800"
                    >
                      {person.initials}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </span>
              <span>{title === "Canvas" ? "3 here · 1 away" : "4 here"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Users className="size-4" />
              People
            </p>
            {teammates.map((person) => (
              <div key={person.name} className="flex items-center gap-2 py-2 text-xs">
                <Avatar className="size-7">
                  <AvatarFallback
                    style={{ background: person.color }}
                    className="text-[9px] text-zinc-800"
                  >
                    {person.initials}
                  </AvatarFallback>
                </Avatar>
                <span>{person.name}</span>
                <span className="ms-auto text-muted-foreground">
                  {title === "Documents" ? "Here" : person.state}
                </span>
              </div>
            ))}
            <p className="mt-2 text-[11px] text-muted-foreground">Sample workspace members</p>
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="sm"
          className="mesh-header-action"
          aria-label="Ask AI"
          aria-pressed={assistantOpen}
          onClick={onAskAI}
        >
          <Sparkles />
          <span>Ask AI</span>
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="mesh-header-action" aria-label="Share">
              <Share2 />
              <span>Share</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="mesh-share-popover w-80 max-w-[calc(100vw-24px)]">
            <div>
              <h3 className="text-sm font-semibold">
                Share {title === "Documents" ? "document" : "canvas"}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Copy a link to this local preview.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                aria-label="Page link"
                readOnly
                value={meshPageLink(documentId, access === "view")}
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button
                size="icon"
                variant="outline"
                aria-label="Copy link"
                onClick={() =>
                  copyMeshText(meshPageLink(documentId, access === "view"), "Link copied")
                }
              >
                <Copy />
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor={`${id}-access`}>Link access</Label>
              <Select value={access} onValueChange={setAccess}>
                <SelectTrigger id={`${id}-access`} className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">Can edit</SelectItem>
                  <SelectItem value="view">Can view</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor={`${id}-view`} className="flex items-center gap-2">
                <Eye className="size-4" />
                View only
              </Label>
              <Switch id={`${id}-view`} checked={readOnly} onCheckedChange={onReadOnlyChange} />
            </div>
          </PopoverContent>
        </Popover>
        {children}
      </div>
    </header>
  );
}
