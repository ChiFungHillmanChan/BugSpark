import { HeroSection } from "@/components/landing/hero-section";
import { FeatureHighlights } from "@/components/landing/feature-highlights";
import { WidgetDemoPreview } from "@/components/landing/widget-demo-preview";
import { IntegrationExamples } from "@/components/landing/integration-examples";
import { PricingSection } from "@/components/landing/pricing-section";
import { CtaSection } from "@/components/landing/cta-section";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeatureHighlights />
      <WidgetDemoPreview />
      <IntegrationExamples />
      <PricingSection />
      <CtaSection />
    </>
  );
}
