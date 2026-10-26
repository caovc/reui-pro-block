// Actual official free ReUI c-card-1, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-card-1.json
// Upstream SHA256: 8bea860b37b3645c4f469ec45920e27e7546868532e4acb3ec9ae8bbafb97f8d
// Complete header/title/description/content/footer/outline action composition retained.
// The demo adds slots, an accessible label and removes the narrow max-width cap.
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DemoContentCard({
  title,
  description,
  children,
  actionLabel,
  onAction,
  label,
  id,
}: {
  title: string;
  description: string;
  children: ReactNode;
  actionLabel: string;
  onAction: () => void;
  label: string;
  id?: string;
}) {
  return (
    <Card className="w-full" aria-label={label} id={id}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onAction}>
          {actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
