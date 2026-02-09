export type PricingTierId = "free" | "starter" | "team";

export interface PricingTier {
  id: PricingTierId;
  nameKey: string;
  descriptionKey: string;
  monthlyPriceHkd: number | null;
  isPopular: boolean;
  ctaKey: string;
  ctaHref: string;
  featureKeys: string[];
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    nameKey: "pricingFreeName",
    descriptionKey: "pricingFreeDesc",
    monthlyPriceHkd: null,
    isPopular: false,
    ctaKey: "pricingFreeCta",
    ctaHref: "/register",
    featureKeys: [
      "pricingFreeFeature1",
      "pricingFreeFeature2",
      "pricingFreeFeature3",
      "pricingFreeFeature4",
      "pricingFreeFeature5",
    ],
  },
  {
    id: "starter",
    nameKey: "pricingStarterName",
    descriptionKey: "pricingStarterDesc",
    monthlyPriceHkd: 199,
    isPopular: false,
    ctaKey: "pricingStarterCta",
    ctaHref: "/register",
    featureKeys: [
      "pricingStarterFeature1",
      "pricingStarterFeature2",
      "pricingStarterFeature3",
      "pricingStarterFeature4",
      "pricingStarterFeature5",
      "pricingStarterFeature6",
      "pricingStarterFeature7",
    ],
  },
  {
    id: "team",
    nameKey: "pricingTeamName",
    descriptionKey: "pricingTeamDesc",
    monthlyPriceHkd: 799,
    isPopular: true,
    ctaKey: "pricingTeamCta",
    ctaHref: "/register",
    featureKeys: [
      "pricingTeamFeature1",
      "pricingTeamFeature2",
      "pricingTeamFeature3",
      "pricingTeamFeature4",
      "pricingTeamFeature5",
      "pricingTeamFeature6",
      "pricingTeamFeature7",
      "pricingTeamFeature8",
    ],
  },
];

export interface ComparisonFeature {
  labelKey: string;
  free: string | boolean;
  starter: string | boolean;
  team: string | boolean;
}

export const COMPARISON_FEATURES: ComparisonFeature[] = [
  { labelKey: "compReportsMonth", free: "50", starter: "500", team: "5,000" },
  { labelKey: "compProjects", free: "1", starter: "3", team: "10" },
  { labelKey: "compSeats", free: "1", starter: "3", team: "10" },
  { labelKey: "compScreenshot", free: true, starter: true, team: true },
  { labelKey: "compConsoleLogs", free: true, starter: true, team: true },
  { labelKey: "compSessionReplay", free: false, starter: true, team: true },
  { labelKey: "compGithub", free: false, starter: true, team: true },
  { labelKey: "compAiAnalysis", free: false, starter: false, team: true },
  { labelKey: "compJiraLinearSlack", free: false, starter: false, team: true },
  { labelKey: "compCustomBranding", free: false, starter: false, team: true },
  {
    labelKey: "compDataRetention",
    free: "7 days",
    starter: "30 days",
    team: "90 days",
  },
];
