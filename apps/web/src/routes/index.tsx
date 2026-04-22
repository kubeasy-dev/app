import { createFileRoute } from "@tanstack/react-router";
import { CTASection } from "@/components/cta-section";
import { EarlyAccessSection } from "@/components/early-access-section";
import { FeaturesSection } from "@/components/features-section";
import { HeroSection } from "@/components/hero-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { OpenSourceSection } from "@/components/open-source-section";
import { StatsSection } from "@/components/stats-section";
import { VideoSection } from "@/components/video-section";
import { siteConfig } from "@/lib/constants";

export const Route = createFileRoute("/")({
  headers: () => ({
    Link: [
      `<${siteConfig.url}/docs>; rel="service-doc"`,
      `<${siteConfig.url}/api/openapi/openapi.json>; rel="service-desc"; type="application/json"`,
      `<${siteConfig.url}/>; rel="canonical"`,
      `<${siteConfig.url}/>; rel="alternate"; type="text/markdown"`,
    ].join(", "),
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <StatsSection />
      <VideoSection />
      <FeaturesSection />
      <HowItWorksSection />
      <OpenSourceSection />
      <EarlyAccessSection />
      <CTASection />
    </div>
  );
}
