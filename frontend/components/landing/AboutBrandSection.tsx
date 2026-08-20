"use client";

import { AboutHero } from "./about/AboutHero";
import { WhyWeBuiltIt } from "./about/WhyWeBuiltIt";
import { ThreePrinciplesSticky } from "./about/ThreePrinciplesSticky";
import { RealtimeSyncStory } from "./about/RealtimeSyncStory";
import { ProductLifecycleTimeline } from "./about/ProductLifecycleTimeline";
import { EngineeringEngineArchitecture } from "./about/EngineeringEngineArchitecture";
import { EngineeringTerminalContact } from "./about/EngineeringTerminalContact";

export function AboutBrandSection() {
  return (
    <section
      id="about"
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#05070d]"
    >
      {/* Subtle background engineering grid */}
      <div className="absolute inset-0 bg-grid-faint opacity-40 pointer-events-none -z-10" />
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#05070d] to-transparent pointer-events-none -z-10" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#05070d] to-transparent pointer-events-none -z-10" />

      {/* 01. Hero & Philosophy */}
      <AboutHero />

      {/* 02. Why We Built It & Lifecycle Node Pipeline */}
      <WhyWeBuiltIt />

      {/* 03. Three Core Principles (Speed, Intelligence, Governance) */}
      <ThreePrinciplesSticky />

      {/* 04. Real-Time Collaboration Canvas */}
      <RealtimeSyncStory />

      {/* 05. Product Lifecycle Timeline (Idea to Ship) */}
      <ProductLifecycleTimeline />

      {/* 06. Engine Architecture (Built by engineers for engineers) */}
      <EngineeringEngineArchitecture />

      {/* 07. Contact Command Center Terminal */}
      <EngineeringTerminalContact />
    </section>
  );
}
