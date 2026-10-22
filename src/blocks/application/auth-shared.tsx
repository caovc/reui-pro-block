import { Separator } from "@/components/ui/separator";

export type Provider = "Google" | "Apple" | "GitHub";
export function OAuthIcon({ provider }: { provider: Provider }) {
  if (provider === "Google")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M21.6 12.23c0-.71-.06-1.39-.18-2.04H12v3.86h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.34Z"
        />
        <path
          fill="#34A853"
          d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.75-5.59-4.11H3.06v2.59A10 10 0 0 0 12 22Z"
        />
        <path
          fill="#FBBC05"
          d="M6.41 13.92A6 6 0 0 1 6.1 12c0-.67.11-1.31.31-1.92V7.49H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.51l3.35-2.59Z"
        />
        <path
          fill="#EA4335"
          d="M12 5.97c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.35 2.59C7.2 7.72 9.4 5.97 12 5.97Z"
        />
      </svg>
    );
  if (provider === "Apple")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.7 12.8c0-2 1.6-3 1.7-3.1-1-1.5-2.6-1.7-3.2-1.7-1.4-.2-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.6 2.2 2.8 2.1 1.1 0 1.6-.7 3-.7s1.8.7 3.1.7c1.3 0 2.1-1.1 2.8-2.1.8-1.2 1.2-2.5 1.2-2.5-.1 0-2.3-.9-2.3-4ZM14.4 6.5c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1.1 2.9 1 .1 2.2-.5 2.9-1.3Z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.64-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.83c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

export function AuthMark({
  wordmark = false,
  large = false,
  outlined = false,
}: {
  wordmark?: boolean;
  large?: boolean;
  outlined?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2 text-sm font-medium">
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className={large ? "size-10" : "size-8"}
      >
        <rect
          x={outlined ? 0.5 : 0}
          y={outlined ? 0.5 : 0}
          width={outlined ? 31 : 32}
          height={outlined ? 31 : 32}
          rx="10"
          fill={outlined ? "var(--background)" : "currentColor"}
          stroke={outlined ? "var(--border)" : "none"}
        />
        <path
          d="M9 9v8c0 5 3 7 7 7s7-2 7-7v-3"
          fill="none"
          stroke={outlined ? "currentColor" : "var(--background)"}
          strokeWidth="2.7"
          strokeLinecap="round"
        />
        <circle
          cx="23"
          cy="9"
          r="1.7"
          fill={outlined ? "currentColor" : "var(--background)"}
        />
      </svg>
      {wordmark && "ReUI"}
    </div>
  );
}
export function FormDivider({ children = "or" }: { children?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <Separator className="flex-1" />
      <span>{children}</span>
      <Separator className="flex-1" />
    </div>
  );
}
