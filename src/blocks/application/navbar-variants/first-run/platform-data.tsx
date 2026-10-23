import { AppWindow, Circle, FolderCode } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import type { SwitcherOption } from "./free/context-switcher";
export const organizations: SwitcherOption[] = [
  {
    id: "bricklane",
    name: "Bricklane",
    plan: "Team workspace",
    logo: <BrandMark className="size-5" />,
  },
  {
    id: "studio",
    name: "Studio",
    plan: "Personal workspace",
    logo: <AppWindow className="size-4" />,
  },
  {
    id: "labs",
    name: "Research Labs",
    plan: "Developer workspace",
    logo: <FolderCode className="size-4" />,
  },
];
export const projects: SwitcherOption[] = [
  {
    id: "web",
    name: "Web Application",
    plan: "React · main",
    logo: <FolderCode className="size-4" />,
  },
  {
    id: "api",
    name: "API Service",
    plan: "Node.js · main",
    logo: <FolderCode className="size-4" />,
  },
  {
    id: "docs",
    name: "Documentation",
    plan: "MDX · main",
    logo: <FolderCode className="size-4" />,
  },
];
export const environments: SwitcherOption[] = [
  {
    id: "production",
    name: "Production",
    plan: "Live environment",
    logo: <Circle className="size-2 fill-success text-success" />,
  },
  {
    id: "preview",
    name: "Preview",
    plan: "Pull request previews",
    logo: <Circle className="size-2 fill-warning text-warning" />,
  },
  {
    id: "development",
    name: "Development",
    plan: "Local environment",
    logo: <Circle className="size-2 fill-info text-info" />,
  },
];
