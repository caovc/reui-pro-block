import {
  Activity,
  BookOpen,
  ReceiptText,
  Plug,
  ShieldCheck,
  Target,
  ListChecks,
  Flag,
  Code2,
  Database,
  GitBranch,
  Mail,
  Webhook,
  Zap,
  CalendarClock,
  Circle,
  Triangle,
  CheckCircle2,
  CircleX,
  Minus,
  LoaderCircle,
} from "lucide-react";
import type { RunState } from "./flow-gantt-data";
export function BrandIcon({ app, className = "" }: { app: string; className?: string }) {
  const a = app.toLowerCase();
  if (a.includes("stripe"))
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 7l18-4v14L3 21z" fill="#635bff" />
      </svg>
    );
  if (a.includes("neon"))
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 3h15v18h-4l-7-9v9H4z" stroke="#00c882" strokeWidth="2" />
        <path d="M15 17V8h4" stroke="#00c882" strokeWidth="2" />
      </svg>
    );
  if (a.includes("claude"))
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d="M12 3v6"
            stroke="#d77757"
            strokeWidth="1.5"
            transform={`rotate(${i * 30} 12 12)`}
          />
        ))}
      </svg>
    );
  if (a.includes("slack"))
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        {["#36c5f0", "#2eb67d", "#ecb22e", "#e01e5a"].map((c, i) => (
          <g key={c} fill={c} transform={`rotate(${i * 90} 12 12)`}>
            <rect x="10" y="2" width="4" height="9" rx="2" />
            <circle cx="6" cy="9" r="2" />
          </g>
        ))}
      </svg>
    );
  if (a.includes("resend"))
    return (
      <span
        className={className}
        style={{
          fontWeight: 800,
          fontFamily: "Georgia,serif",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ℛ
      </span>
    );
  if (a.includes("clickup"))
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M5 14q7 10 14 0" stroke="#8b4cff" strokeWidth="4" />
        <path d="M6 9l6-5 6 5" stroke="#1686ff" strokeWidth="4" />
      </svg>
    );
  if (a.includes("cloud") || a.includes("publish"))
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M7 9a6 6 0 0 1 10-3" stroke="#ea4335" strokeWidth="4" />
        <path d="M17 6l2 5a5 5 0 0 1 0 8" stroke="#4285f4" strokeWidth="4" />
        <path d="M19 19H8" stroke="#34a853" strokeWidth="4" />
        <path d="M8 19a5 5 0 0 1-1-10" stroke="#fbbc05" strokeWidth="4" />
      </svg>
    );
  if (a.includes("paypal"))
    return (
      <span
        className={className}
        style={{
          fontSize: "1.4em",
          fontWeight: 900,
          color: "#0577c7",
          fontStyle: "italic",
        }}
      >
        P
      </span>
    );
  if (a.includes("redis") || a.includes("dedupe"))
    return (
      <svg className={className} viewBox="0 0 24 24">
        <path d="M1 14l11-5 11 5-11 7z" fill="#a72120" />
        <path d="M1 10l11-5 11 5-11 7z" fill="#cf302b" />
        <path d="M1 6l11-5 11 5-11 7z" fill="#e54b45" />
        <path d="M8 5h8v2H8z" fill="white" />
      </svg>
    );
  if (a === "initiative") return <ListChecks className={className} />;
  if (a === "input") return <Activity className={className} />;
  if (a === "north star") return <Target className={className} />;
  if (a === "kpi") return <Flag className={className} />;
  if (a === "schedule") return <Zap className={className} />;
  if (a === "check") return <ShieldCheck className={className} />;
  if (a === "ledger") return <BookOpen className={className} />;
  if (a === "receipt") return <ReceiptText className={className} />;
  if (a === "database") return <Plug className={className} />;
  const Icon =
    a.includes("webhook") || a.includes("form")
      ? Webhook
      : a.includes("condition") || a.includes("enterprise")
        ? GitBranch
        : a.includes("data") || a.includes("enrich")
          ? Database
          : a.includes("email") || a.includes("notify")
            ? Mail
            : a.includes("code") || a.includes("guard")
              ? Code2
              : a.includes("night")
                ? CalendarClock
                : a.includes("model") || a.includes("ledger")
                  ? Triangle
                  : Zap;
  return <Icon className={className} />;
}
export function RunIcon({ state }: { state: RunState }) {
  const Icon =
    state === "Succeeded"
      ? CheckCircle2
      : state === "Failed"
        ? CircleX
        : state === "Skipped"
          ? Minus
          : state === "Running"
            ? LoaderCircle
            : Circle;
  return <Icon className={state === "Running" ? "fg-spin" : ""} />;
}
