export type PricingTierId = "free" | "starter" | "team";

export type HighlightItem = string | { key: string; comingSoon: boolean };

export interface PricingTier {
  id: PricingTierId;
  nameKey: string;
  descriptionKey: string;
  monthlyPriceHkd: number | null;
  currencyKey: string;
  isPopular: boolean;
  ctaKey: string;
  ctaHref: string;
  highlightKeys: HighlightItem[];
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
      { key: "pricingStarterHighlightReplay", comingSoon: true },
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
      { key: "pricingTeamHighlightIntegrations", comingSoon: true },
      { key: "pricingTeamHighlightBranding", comingSoon: true },
      "pricingTeamHighlightRetention",
    ],
  },
];

export interface ComparisonFeature {
  labelKey: string;
  values: Record<PricingTierId, boolean | string>;
  comingSoon?: PricingTierId[];
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
    comingSoon: ["starter", "team"],
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
    comingSoon: ["team"],
  },
  {
    labelKey: "compCustomBranding",
    values: { free: false, starter: false, team: true },
    comingSoon: ["team"],
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

export const ENTERPRISE_FEATURE_KEYS: Array<{ key: string; comingSoon: boolean }> = [
  { key: "pricingEnterpriseSso", comingSoon: true },
  { key: "pricingEnterpriseAudit", comingSoon: true },
  { key: "pricingEnterpriseSupport", comingSoon: false },
  { key: "pricingEnterpriseRetention", comingSoon: false },
];
