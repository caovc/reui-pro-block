// Actual official free ReUI c-navigation-menu-4, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-navigation-menu-4.json
// Upstream SHA256: 3659aad74e95edd0fccf5613adeda41de76d28e6c6fa18c96df515ddbd3b2de7
// Retains the native NavigationMenu/List/Item/Trigger/Content and mapped two-column
// icon/title/description links. Adds Company/plain Pricing, replaces finance fixtures,
// bounds the panel for phones, omits the unrelated Learn more footer.
import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { companyPages, productPages } from "../data";

export type MarketingPage = { title: string; description: string };

export function MarketingMegaMenu({ onNavigate }: { onNavigate: (page: MarketingPage) => void }) {
  const [value, setValue] = useState("");
  return (
    <NavigationMenu
      value={value}
      onValueChange={setValue}
      className="final-marketing-menu"
      aria-label="Marketing navigation"
    >
      <NavigationMenuList>
        {[
          { label: "Product", pages: productPages },
          { label: "Company", pages: companyPages },
        ].map((section) => (
          <NavigationMenuItem key={section.label} value={section.label}>
            <NavigationMenuTrigger>{section.label}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="final-mega-panel" aria-label={`${section.label} pages`}>
                <ul className="grid grid-cols-2 gap-1">
                  {section.pages.map((page) => {
                    const Icon = page.icon;
                    return (
                      <li key={page.id}>
                        <NavigationMenuLink asChild className="flex items-start gap-2 p-3">
                          <a
                            href={`#${page.id}`}
                            onClick={(event) => {
                              event.preventDefault();
                              setValue("");
                              onNavigate(page);
                            }}
                          >
                            <Icon aria-hidden="true" className="shrink-0" />
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <div className="text-sm font-medium leading-none">{page.title}</div>
                              <p className="text-xs leading-snug text-muted-foreground">
                                {page.description}
                              </p>
                            </div>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <a
              href="#pricing"
              onClick={(event) => {
                event.preventDefault();
                setValue("");
                onNavigate({
                  title: "Pricing",
                  description:
                    "Compare fictional workspace plans in this local demonstration. No purchase or subscription is created.",
                });
              }}
            >
              Pricing
            </a>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
