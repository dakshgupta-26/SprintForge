"use client";

import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { HeroDashboardMockup } from "@/components/landing/HeroDashboardMockup";
import { LogoCloud } from "@/components/landing/LogoCloud";
import { WorkflowComparison } from "@/components/landing/WorkflowComparison";
import { FeatureBentoGrid } from "@/components/landing/FeatureBentoGrid";
import { AIAssistantSection } from "@/components/landing/AIAssistantSection";
import { InteractiveSandbox } from "@/components/landing/InteractiveSandbox";
import { AboutBrandSection } from "@/components/landing/AboutBrandSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { CursorGlow } from "@/components/landing/CursorGlow";
import { SmoothScrollProvider } from "@/components/shared/SmoothScrollProvider";

export default function LandingPage() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-[#05070d] text-slate-100 selection:bg-violet-500/30 selection:text-white relative overflow-x-hidden">
        {/* Desktop-only subtle ambient cursor glow */}
        <CursorGlow />

        {/* Global sticky/floating glass navbar */}
        <LandingNavbar />

        {/* Main Landing Story Flow */}
        <main className="relative z-10">
          {/* 1. Kinetic Hero Section */}
          <LandingHero />

          {/* 2. Realistic Product Dashboard Showcase */}
          <HeroDashboardMockup />

          {/* 3. Social Proof & Logo Cloud */}
          <LogoCloud />

          {/* 4. The Agile Evolution (Before vs After) */}
          <WorkflowComparison />

          {/* 5. Asymmetric Bento Feature Grid */}
          <FeatureBentoGrid />

          {/* 6. Dedicated AI Advantage Engine */}
          <AIAssistantSection />

          {/* 7. 4-Tab Interactive Product Sandbox */}
          <InteractiveSandbox />

          {/* 8. Brand Story & Contact Hub */}
          <AboutBrandSection />

          {/* 9. Final High-Conversion CTA */}
          <FinalCTASection />
        </main>

        {/* 10. Multi-column SaaS Footer */}
        <LandingFooter />
      </div>
    </SmoothScrollProvider>
  );
}
