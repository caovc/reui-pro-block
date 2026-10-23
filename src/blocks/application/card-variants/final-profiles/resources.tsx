import {
  BookOpen,
  ChartColumnIncreasing,
  Headphones,
  Link,
  Palette,
  Plug,
  ShieldCheck,
} from "lucide-react";
import { FramePanel } from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Stage, GridFrame, ContentLink } from "../extended/common";
import "./final-profiles.css";
export function ResourceHub() {
  return (
    <Stage id={39} width={960}>
      <GridFrame columns={4}>
        {[
          {
            title: "Getting Started",
            description:
              "Follow our step-by-step onboarding guides to integrate and launch your project smoothly, even if you’re just getting started.",
            icon: BookOpen,
          },
          {
            title: "Security Center",
            description:
              "Learn about our advanced security measures and best practices to keep your data protected and your app fully compliant.",
            icon: ShieldCheck,
          },
          {
            title: "Integrations",
            description:
              "Seamlessly connect your app with trusted third-party services, from analytics and payments to automation tools that boost performance.",
            icon: Plug,
          },
          {
            title: "Support Hub",
            description:
              "Access expert support, detailed docs, and a vibrant developer community, with guidance for complex issues whenever needed.",
            icon: Headphones,
          },
        ].map(({ title, description, icon: Icon }) => (
          <FramePanel key={title} className="flex flex-col gap-6">
            <IconTile variant="elevated">
              <Icon />
            </IconTile>
            <Item className="p-0">
              <ItemContent className="gap-2">
                <ItemTitle>
                  <ContentLink title={title} description={description}>
                    {title}
                  </ContentLink>
                </ItemTitle>
                <ItemDescription className="line-clamp-none leading-[1.65]">
                  {description}
                </ItemDescription>
              </ItemContent>
            </Item>
          </FramePanel>
        ))}
      </GridFrame>
    </Stage>
  );
}
export function TopicShortcuts() {
  return (
    <Stage id={41} width={960}>
      <GridFrame columns={4}>
        {[
          {
            title: "API Integration",
            description: "Quick steps to connect APIs",
            icon: Link,
            tone: "bg-green-600",
          },
          {
            title: "UI Themes",
            description: "Ready-made styles for apps",
            icon: Palette,
            tone: "bg-indigo-600",
          },
          {
            title: "Analytics Setup",
            description: "Real-time tracking setup",
            icon: ChartColumnIncreasing,
            tone: "bg-orange-500",
          },
          {
            title: "Security Tips",
            description: "Simple ways to stay secure",
            icon: ShieldCheck,
            tone: "bg-blue-500",
          },
        ].map(({ title, description, icon: Icon, tone }) => (
          <FramePanel key={title} className="flex flex-col gap-5">
            <IconTile variant="elevated" size="sm" className={`${tone} text-white`}>
              <Icon />
            </IconTile>
            <Item className="p-0">
              <ItemContent className="gap-2">
                <ItemTitle>
                  <ContentLink title={title} description={description}>
                    {title}
                  </ContentLink>
                </ItemTitle>
                <ItemDescription className="text-xs">{description}</ItemDescription>
              </ItemContent>
            </Item>
          </FramePanel>
        ))}
      </GridFrame>
    </Stage>
  );
}
