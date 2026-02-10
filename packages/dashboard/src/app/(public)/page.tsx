import { HeroSection } from "@/components/landing/hero-section";
import { FeatureHighlights } from "@/components/landing/feature-highlights";
import { WidgetDemoSection } from "@/components/landing/widget-demo-section";
import { IntegrationExamples } from "@/components/landing/integration-examples";
import { CtaSection } from "@/components/landing/cta-section";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <WidgetDemoSection />
      <FeatureHighlights />
      <IntegrationExamples />
      <CtaSection />
    </>
  );
}
