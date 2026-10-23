// Actual official free REUI c-tabs-7, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-tabs-7.json
// Retains line TabsList, gap-2 triggers and actual ReUI Badge composition.
// Labels/data lifted; mobile radio menu and dashed demo panels replace mail Cards.
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { projectTabs } from "../data";

export function ProjectTabs({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Tabs value={value} onValueChange={onChange} className="gap-0">
      <div className="navbar-project-sections">
        <TabsList variant="line" className="navbar-project-tablist">
          {projectTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2 px-3">
              {tab.label}
              {"count" in tab && (
                <Badge variant="secondary" size="sm">
                  {tab.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="navbar-phone-tabs">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Project sections">
                {projectTabs.find((tab) => tab.value === value)?.label}
                <ChevronDown data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
                  {projectTabs.map((tab) => (
                    <DropdownMenuRadioItem value={tab.value} key={tab.value}>
                      {tab.label}
                      {"count" in tab && (
                        <Badge variant="secondary" size="sm">
                          {tab.count}
                        </Badge>
                      )}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {children}
      </div>
      {projectTabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          <div className="navbar-demo-placeholder" aria-label={`${tab.label} demo content`}>
            <span className="sr-only">{tab.label} section placeholder</span>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
