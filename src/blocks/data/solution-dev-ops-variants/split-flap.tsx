import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Original display treatment. No free ReUI split-flap implementation is indexed. */
export function SplitFlap({
  value,
  characters = false,
  className,
}: {
  value: string;
  characters?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("deploy-flap", characters && "deploy-flap-characters", className)}
      aria-label={value}
    >
      {characters ? (
        <span aria-hidden="true" className="deploy-flap-digits">
          {Array.from(value).map((letter, index) => (
            <span
              key={`${index}-${letter}`}
              className={letter === ":" ? "deploy-flap-colon" : "deploy-flap-digit"}
              style={{ "--flap-delay": `${index * 12}ms` } as CSSProperties}
            >
              {letter}
            </span>
          ))}
        </span>
      ) : (
        <span key={value} aria-hidden="true" className="deploy-flap-label">
          {value}
        </span>
      )}
    </span>
  );
}
