import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Alert } from "@/components/reui/alert";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Item } from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUiStyleCss, UI_STYLES } from "@/foundations/styles";
import { uiFoundation } from "@/lib/ui-foundation";
import "@/index.css";

export function Fixture() {
  const [style, setStyle] = useState("nova");

  return (
    <main className="grid max-w-xl gap-4 p-8" data-library={uiFoundation.primitive}>
      <style id="fixture-style">{getUiStyleCss(style)}</style>
      <label>
        Component style
        <select value={style} onChange={(event) => setStyle(event.target.value)}>
          {UI_STYLES.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
      <div className="flex gap-4">
        <Button data-testid="button">Example button</Button>
        <Button className="h-12 rounded-full" data-testid="custom-button">
          Custom
        </Button>
        <Button size="icon-sm" aria-label="Icon button" data-testid="icon-button">
          +
        </Button>
      </div>
      <Input aria-label="Example input" data-testid="input" />
      <Select defaultValue="first">
        <SelectTrigger aria-label="Example select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" data-testid="select-content">
          <SelectItem value="first" data-testid="select-item">
            First choice
          </SelectItem>
          <SelectItem value="second">Second choice</SelectItem>
        </SelectContent>
      </Select>
      <Frame data-testid="frame">
        <FramePanel>Frame panel</FramePanel>
      </Frame>
      <Card data-testid="card">Card</Card>
      <Item data-testid="item">Item</Item>
      <Alert data-testid="alert">Alert</Alert>
      <Tabs defaultValue="first">
        <TabsList data-testid="tabs">
          <TabsTrigger value="first">First</TabsTrigger>
          <TabsTrigger value="second">Second</TabsTrigger>
        </TabsList>
      </Tabs>
      <Tabs defaultValue="first">
        <TabsList variant="line" data-testid="line-tabs">
          <TabsTrigger value="first">Line</TabsTrigger>
        </TabsList>
      </Tabs>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent data-testid="menu">
          <DropdownMenuItem data-testid="menu-item">An action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent data-testid="dialog">
          <DialogTitle>Example dialog</DialogTitle>
          <DialogDescription>Portaled content uses the selected style.</DialogDescription>
        </DialogContent>
      </Dialog>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Fixture />);
