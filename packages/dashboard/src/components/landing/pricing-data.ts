export type PricingTierId = "free" | "starter" | "team";

export interface PricingTier {
  id: PricingTierId;
  nameKey: string;
  descriptionKey: string;
  monthlyPriceHkd: number | null;
  currencyKey: string;
  isPopular: boolean;
  ctaKey: string;
  ctaHref: string;
  highlightKeys: string[];
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    nameKey: "pricingFreeName",
    descriptionKey: "pricingFreeDesc",
    monthlyPriceHkd: null,
    currencyKey: "pricingCurrencyPrefix",
    isPopular: false,
    ctaKey: "pricingFreeCta",
    ctaHref: "/register",
    highlightKeys: [
      "pricingFreeHighlightReports",
      "pricingFreeHighlightProjects",
      "pricingFreeHighlightSeats",
      "pricingFreeHighlightScreenshot",
      "pricingFreeHighlightLogs",
    ],
  },
  {
    id: "starter",
    nameKey: "pricingStarterName",
    descriptionKey: "pricingStarterDesc",
    monthlyPriceHkd: 199,
    currencyKey: "pricingCurrencyPrefix",
    isPopular: false,
    ctaKey: "pricingStarterCta",
    ctaHref: "/register",
    highlightKeys: [
      "pricingStarterHighlightReports",
      "pricingStarterHighlightProjects",
      "pricingStarterHighlightSeats",
      "pricingStarterHighlightIncludes",
      "pricingStarterHighlightReplay",
      "pricingStarterHighlightGithub",
      "pricingStarterHighlightRetention",
    ],
  },
  {
    id: "team",
    nameKey: "pricingTeamName",
    descriptionKey: "pricingTeamDesc",
    monthlyPriceHkd: 799,
    currencyKey: "pricingCurrencyPrefix",
    isPopular: true,
    ctaKey: "pricingTeamCta",
    ctaHref: "/register",
    highlightKeys: [
      "pricingTeamHighlightReports",
      "pricingTeamHighlightProjects",
      "pricingTeamHighlightSeats",
      "pricingTeamHighlightIncludes",
      "pricingTeamHighlightAi",
      "pricingTeamHighlightIntegrations",
      "pricingTeamHighlightBranding",
      "pricingTeamHighlightRetention",
    ],
  },
];

export interface ComparisonFeature {
  labelKey: string;
  values: Record<PricingTierId, boolean | string>;
}

export const COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    labelKey: "compReportsMonth",
    values: { free: "50", starter: "500", team: "5,000" },
  },
  {
    labelKey: "compProjects",
    values: { free: "1", starter: "3", team: "10" },
  },
  {
    labelKey: "compSeats",
    values: { free: "1", starter: "3", team: "10" },
  },
  {
    labelKey: "compScreenshot",
    values: { free: true, starter: true, team: true },
  },
  {
    labelKey: "compConsoleLogs",
    values: { free: true, starter: true, team: true },
  },
  {
    labelKey: "compSessionReplay",
    values: { free: false, starter: true, team: true },
  },
  {
    labelKey: "compGithub",
    values: { free: false, starter: true, team: true },
  },
  {
    labelKey: "compAiAnalysis",
    values: { free: false, starter: false, team: true },
  },
  {
    labelKey: "compJiraLinearSlack",
    values: { free: false, starter: false, team: true },
  },
  {
    labelKey: "compCustomBranding",
    values: { free: false, starter: false, team: true },
  },
  {
    labelKey: "compDataRetention",
    values: {
      free: "compRetention7d",
      starter: "compRetention30d",
      team: "compRetention90d",
    },
  },
];

export const ENTERPRISE_FEATURE_KEYS = [
  "pricingEnterpriseSso",
  "pricingEnterpriseAudit",
  "pricingEnterpriseSupport",
  "pricingEnterpriseRetention",
] as const;
