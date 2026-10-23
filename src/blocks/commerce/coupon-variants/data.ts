export interface CouponOffer {
  code: string;
  category: string;
  value: string;
  subtitle: string;
  description: string;
  minimum: number;
  expiry: string;
  percentage?: number;
  amount?: number;
  badge?: { label: string; variant: "success" | "warning" | "info" };
}

export const couponOffers: CouponOffer[] = [
  {
    code: "WELCOME10",
    category: "Welcome",
    value: "10% off",
    subtitle: "first order",
    description: "Discount applied automatically at checkout on your first cart.",
    minimum: 0,
    expiry: "No expiry",
    percentage: 10,
    badge: { label: "Popular", variant: "success" },
  },
  {
    code: "SUMMER25",
    category: "Seasonal",
    value: "25% off",
    subtitle: "sitewide",
    description: "Quarter off the entire catalog. One use per customer.",
    minimum: 50,
    expiry: "Ends Sun, Jul 31",
    percentage: 25,
    badge: { label: "Featured", variant: "warning" },
  },
  {
    code: "SHIPFREE",
    category: "Shipping",
    value: "Free shipping",
    subtitle: "no minimum",
    description: "Free standard delivery anywhere in the contiguous US.",
    minimum: 0,
    expiry: "Ongoing",
  },
  {
    code: "BUNDLE30",
    category: "Bundle",
    value: "$30 off",
    subtitle: "any bundle",
    description: "Save $30 when you add any 3 items from a single category.",
    minimum: 150,
    expiry: "Ends Aug 18",
    amount: 30,
  },
  {
    code: "MEMBER15",
    category: "Loyalty",
    value: "15% off",
    subtitle: "members only",
    description: "Recurring discount for active members of the loyalty program.",
    minimum: 0,
    expiry: "Renews monthly",
    percentage: 15,
    badge: { label: "Members", variant: "info" },
  },
  {
    code: "STUDENT20",
    category: "Education",
    value: "20% off",
    subtitle: "verified students",
    description: "Verified through SheerID. Reverifies every 12 months.",
    minimum: 0,
    expiry: "Verify required",
    percentage: 20,
  },
];

export interface CouponCampaign {
  variant: 1 | 3 | 4;
  eyebrow: string;
  expiry?: string;
  heading: string;
  description: string;
  code: string;
  percentage: number;
  minimum: number;
  terms: string[];
  action: string;
}

export const campaigns: Record<1 | 3 | 4, CouponCampaign> = {
  1: {
    variant: 1,
    eyebrow: "Limited time",
    expiry: "Ends Sun, Jul 31",
    heading: "Summer sale, 25% off everything",
    description:
      "Refresh your essentials with a quarter off the entire catalog. One code, no minimums, free returns inside 30 days.",
    code: "SUMMER25",
    percentage: 25,
    minimum: 0,
    terms: [
      "Applies sitewide, including new arrivals.",
      "Stackable with free shipping over $50.",
      "One use per customer. No code, no discount.",
    ],
    action: "Shop the sale",
  },
  3: {
    variant: 3,
    eyebrow: "Members only",
    expiry: "Members get 48 hours",
    heading: "Early access: 30% off the holiday drop",
    description:
      "Shop the holiday collection 48 hours before everyone else. Active loyalty members save 30% on every item, automatically applied at checkout.",
    code: "EARLY30",
    percentage: 30,
    minimum: 0,
    terms: [
      "Open to active loyalty members.",
      "Discount covers the full holiday catalog.",
      "Stacks with free shipping on orders over $75.",
    ],
    action: "Shop early access",
  },
  4: {
    variant: 4,
    eyebrow: "Member offer",
    heading: "15% off your next order",
    description:
      "Apply the code at checkout and the discount lands automatically on every eligible item in your cart.",
    code: "WELCOME15",
    percentage: 15,
    minimum: 50,
    expiry: "Expires Aug 15",
    terms: [
      "Valid on regular-price items.",
      "One use per customer.",
      "Cannot stack with other percentage discounts.",
    ],
    action: "Shop now",
  },
};

export const couponMoney = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
