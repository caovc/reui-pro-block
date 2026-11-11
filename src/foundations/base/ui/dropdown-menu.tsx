// Base Nova dependency used by ReUI's free dropdown-menu examples (MIT).
// https://ui.shadcn.com/r/styles/base-nova/dropdown-menu.json
"use client";

import * as React from "react";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Menu } from "@base-ui/react/menu";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  childRender,
  MenuDismissProvider,
  MenuPortalContainer,
  openState,
  selectHandler,
  stateRender,
  useMenuDismiss,
  type AsChild,
  type MenuSelect,
} from "./menu-compat";
import { MenuContent, MenuGroup, MenuLabel, type MenuContentProps } from "./menu-popup";

type RenderElement = AsChild & { render?: React.ReactElement };

function DropdownMenu({ dir, onOpenChange, ...props }: Menu.Root.Props & { dir?: "ltr" | "rtl" }) {
  const dismiss = useMenuDismiss(onOpenChange);
  const menu = (
    <MenuDismissProvider value={dismiss.register}>
      <Menu.Root loopFocus={false} {...props} onOpenChange={dismiss.onOpenChange} />
    </MenuDismissProvider>
  );
  return dir ? <DirectionProvider direction={dir}>{menu}</DirectionProvider> : menu;
}

function DropdownMenuPortal({
  container,
  forceMount,
  children,
  ...props
}: Menu.Portal.Props & { forceMount?: boolean }) {
  return (
    <MenuPortalContainer.Provider value={container}>
      <Menu.Portal
        data-slot="dropdown-menu-portal"
        container={container}
        keepMounted={forceMount}
        {...props}
      >
        {children}
      </Menu.Portal>
    </MenuPortalContainer.Provider>
  );
}

function DropdownMenuTrigger({
  asChild,
  render,
  children,
  nativeButton,
  ...props
}: Omit<React.ComponentProps<typeof Menu.Trigger>, "render"> & RenderElement) {
  const element = render ?? childRender(asChild, children);
  return (
    <Menu.Trigger
      data-slot="dropdown-menu-trigger"
      nativeButton={
        nativeButton ?? (typeof element?.type !== "string" || element.type === "button")
      }
      {...props}
      render={stateRender<Menu.Trigger.State>("button", element, openState)}
    >
      {asChild ? undefined : children}
    </Menu.Trigger>
  );
}

function DropdownMenuContent(props: MenuContentProps) {
  return <MenuContent family="dropdown-menu" {...props} />;
}

function DropdownMenuGroup(props: React.ComponentProps<typeof MenuGroup>) {
  return <MenuGroup data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuLabel(props: React.ComponentProps<typeof MenuLabel>) {
  return <MenuLabel data-slot="dropdown-menu-label" {...props} />;
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  asChild,
  render,
  children,
  textValue,
  onClick,
  onSelect,
  nativeButton,
  ...props
}: Omit<React.ComponentProps<typeof Menu.Item>, "render" | "onSelect"> &
  RenderElement &
  MenuSelect & { inset?: boolean; variant?: "default" | "destructive"; textValue?: string }) {
  const element = render ?? childRender(asChild, children);
  return (
    <Menu.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/dropdown-menu-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive",
        className,
      )}
      label={textValue}
      nativeButton={nativeButton ?? element?.type === "button"}
      {...props}
      render={element}
      onClick={selectHandler(onClick, onSelect)}
    >
      {asChild ? undefined : children}
    </Menu.Item>
  );
}

function DropdownMenuSub({ onOpenChange, ...props }: Menu.SubmenuRoot.Props) {
  const dismiss = useMenuDismiss(onOpenChange);
  return (
    <MenuDismissProvider value={dismiss.register}>
      <Menu.SubmenuRoot loopFocus={false} {...props} onOpenChange={dismiss.onOpenChange} />
    </MenuDismissProvider>
  );
}

function DropdownMenuSubTrigger({
  className,
  inset,
  asChild,
  render,
  children,
  textValue,
  ...props
}: Omit<React.ComponentProps<typeof Menu.SubmenuTrigger>, "render"> &
  RenderElement & { inset?: boolean; textValue?: string }) {
  const element = render ?? childRender(asChild, children);
  return (
    <Menu.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-popup-open:bg-accent data-popup-open:text-accent-foreground",
        className,
      )}
      label={textValue}
      {...props}
      render={stateRender<Menu.SubmenuTrigger.State>("div", element, openState)}
    >
      {!asChild && (
        <>
          {children}
          <ChevronRightIcon className="ml-auto rtl:rotate-180" aria-hidden="true" />
        </>
      )}
    </Menu.SubmenuTrigger>
  );
}

function DropdownMenuSubContent(props: MenuContentProps) {
  return <MenuContent family="dropdown-menu" sub {...props} />;
}

function DropdownMenuRadioGroup(props: React.ComponentProps<typeof Menu.RadioGroup>) {
  return <Menu.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  asChild,
  render,
  textValue,
  onClick,
  onSelect,
  nativeButton,
  closeOnClick = true,
  ...props
}: Omit<React.ComponentProps<typeof Menu.CheckboxItem>, "render" | "onSelect" | "checked"> &
  RenderElement &
  MenuSelect & { inset?: boolean; textValue?: string; checked?: boolean | "indeterminate" }) {
  const element = render ?? childRender(asChild, children);
  return (
    <Menu.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      label={textValue}
      nativeButton={nativeButton ?? element?.type === "button"}
      closeOnClick={closeOnClick}
      checked={checked === "indeterminate" ? false : checked}
      {...props}
      render={stateRender<Menu.CheckboxItem.State>("div", element, ({ checked: selected }) => ({
        "data-state":
          checked === "indeterminate" ? "indeterminate" : selected ? "checked" : "unchecked",
        "aria-checked": checked === "indeterminate" ? "mixed" : String(selected),
      }))}
      onClick={selectHandler(onClick, onSelect)}
    >
      {!asChild && (
        <>
          <span
            className="pointer-events-none absolute right-2 flex items-center justify-center"
            data-slot="dropdown-menu-checkbox-item-indicator"
          >
            {checked === "indeterminate" ? (
              <CheckIcon aria-hidden="true" />
            ) : (
              <Menu.CheckboxItemIndicator>
                <CheckIcon aria-hidden="true" />
              </Menu.CheckboxItemIndicator>
            )}
          </span>
          {children}
        </>
      )}
    </Menu.CheckboxItem>
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  asChild,
  render,
  textValue,
  onClick,
  onSelect,
  nativeButton,
  closeOnClick = true,
  ...props
}: Omit<React.ComponentProps<typeof Menu.RadioItem>, "render" | "onSelect"> &
  RenderElement &
  MenuSelect & { inset?: boolean; textValue?: string }) {
  const element = render ?? childRender(asChild, children);
  return (
    <Menu.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      label={textValue}
      nativeButton={nativeButton ?? element?.type === "button"}
      closeOnClick={closeOnClick}
      {...props}
      render={stateRender<Menu.RadioItem.State>("div", element, ({ checked }) => ({
        "data-state": checked ? "checked" : "unchecked",
      }))}
      onClick={selectHandler(onClick, onSelect)}
    >
      {!asChild && (
        <>
          <span
            className="pointer-events-none absolute right-2 flex items-center justify-center"
            data-slot="dropdown-menu-radio-item-indicator"
          >
            <Menu.RadioItemIndicator>
              <CheckIcon aria-hidden="true" />
            </Menu.RadioItemIndicator>
          </span>
          {children}
        </>
      )}
    </Menu.RadioItem>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Menu.Separator>) {
  return (
    <Menu.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
