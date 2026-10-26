import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  ChartNoAxesCombined,
  CreditCard,
  FileText,
  Globe,
  HeartHandshake,
  History,
  Mail,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";

// Original fixture descriptions, not copied from the paid block.
export const productPages = [
  {
    id: "accounts",
    title: "Business accounts",
    description: "A clear home for your daily finances.",
    icon: Building2,
  },
  {
    id: "cards",
    title: "Corporate cards",
    description: "Give every team a sensible spending limit.",
    icon: CreditCard,
  },
  {
    id: "payments",
    title: "Global payments",
    description: "Keep cross-border payments organized.",
    icon: Globe,
  },
  {
    id: "transfers",
    title: "Transfers",
    description: "Move funds between your workspaces.",
    icon: ArrowLeftRight,
  },
  {
    id: "bills",
    title: "Bill pay",
    description: "Review upcoming bills in one place.",
    icon: Receipt,
  },
  {
    id: "invoicing",
    title: "Invoicing",
    description: "Create clear invoices for your customers.",
    icon: FileText,
  },
  {
    id: "treasury",
    title: "Treasury",
    description: "Plan your team's next financial milestone.",
    icon: Wallet,
  },
  {
    id: "insights",
    title: "Insights",
    description: "Understand your sample workspace activity.",
    icon: ChartNoAxesCombined,
  },
] as const;

export const companyPages = [
  {
    id: "about",
    title: "About us",
    description: "Meet the people building Bricklane.",
    icon: HeartHandshake,
  },
  {
    id: "careers",
    title: "Careers",
    description: "Find a place to do thoughtful work.",
    icon: Users,
  },
  {
    id: "customers",
    title: "Customer stories",
    description: "Explore stories from fictional teams.",
    icon: Building2,
  },
  {
    id: "journal",
    title: "Journal",
    description: "Ideas and notes from our demo studio.",
    icon: BookOpen,
  },
  {
    id: "changelog",
    title: "Changelog",
    description: "See what is new in the local demo.",
    icon: History,
  },
  {
    id: "contact",
    title: "Contact",
    description: "Learn how this independent preview works.",
    icon: Mail,
  },
] as const;

export const editorDocument = {
  title: "Invoice draft",
  reference: "BL-2026-014",
  customer: "Cedar Studio",
  description: "Interface workshop and accessibility review",
  amount: "$1,550.00",
  due: "November 6, 2026",
};
