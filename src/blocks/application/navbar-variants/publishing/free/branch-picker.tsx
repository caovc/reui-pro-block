// Actual official free REUI c-button-group-7. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-button-group-7.json
// Upstream source SHA256: 3c040c4b1bc1237d96eac1b32be775fc74e00b5c3ae942ceb7897bb4fa4339d7
// Local adaptations recorded in docs/navbar7-9-implementation.md.
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { GitMerge, ChevronDown, GitBranch, Check, Braces, Zap } from "lucide-react";
import { Badge } from "@/components/reui/badge";

export function BranchPicker({
  value,
  onChange,
  onTarget,
}: {
  value: string;
  onChange: (value: string) => void;
  onTarget: (value: string) => void;
}) {
  return (
    <ButtonGroup>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="max-w-52 gap-2"
            size="sm"
            aria-label="Repository branch"
          >
            <GitMerge aria-hidden="true" />
            <span className="truncate">{value}</span>
            <ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Switch Branch</DropdownMenuLabel>
            {["main", "develop", "feature/auth", "feature/navigation"].map((branch) => (
              <DropdownMenuItem key={branch} onSelect={() => onChange(branch)}>
                <GitBranch aria-hidden="true" />
                <span>{branch}</span>
                {branch === "main" && (
                  <Badge variant="secondary" size="sm">
                    Default
                  </Badge>
                )}
                {value === branch && <Check className="ml-auto" aria-hidden="true" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Deploy targets</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => onTarget("Remix")}>
              <Braces />
              Deploy with Remix
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onTarget("Vite")}>
              <Zap />
              Vite project
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
