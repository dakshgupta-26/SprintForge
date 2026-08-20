"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { FeaturesIntro } from "./FeaturesIntro";
import { HeroProductWorkspace } from "./HeroProductWorkspace";
import { SmartPlanningChapter } from "./SmartPlanningChapter";
import { KanbanInteractiveChapter } from "./KanbanInteractiveChapter";
import { RealtimeCollaborationChapter } from "./RealtimeCollaborationChapter";
import { TeamChatChapter } from "./TeamChatChapter";
import { PermissionsMatrixChapter } from "./PermissionsMatrixChapter";
import { AISprintEngineChapter } from "./AISprintEngineChapter";
import { FeaturesChapterNav } from "./FeaturesChapterNav";

export function FeaturesStorySection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <section
      id="features"
      ref={containerRef}
      className="py-24 sm:py-32 relative overflow-hidden bg-[#05070d]"
    >
      {/* Subtle top scroll progress indicator for the feature story */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-400 z-50 origin-left pointer-events-none"
        style={{ scaleX }}
      />

      {/* Engineering background grid & subtle ambient lighting */}
      <div className="absolute inset-0 bg-grid-faint opacity-50 pointer-events-none -z-10" />
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#05070d] to-transparent pointer-events-none -z-10" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#05070d] to-transparent pointer-events-none -z-10" />

      {/* 1. Cinematic Intro */}
      <FeaturesIntro />

      {/* 2. Hero Product Workspace Showcase */}
      <HeroProductWorkspace />

      {/* Sticky Chapter Navigation Bar */}
      <FeaturesChapterNav />

      {/* Main Chapter Journey */}
      <div className="relative z-10">
        {/* Chapter 1: Smart Sprint Planning */}
        <div id="sprint-planning">
          <SmartPlanningChapter />
        </div>

        {/* Chapter 2: Kanban & Scrum */}
        <div id="kanban-scrum">
          <KanbanInteractiveChapter />
        </div>

        {/* Chapter 3: Real-Time Presence & Collaboration */}
        <div id="live-presence">
          <RealtimeCollaborationChapter />
        </div>

        {/* Chapter 4: Encrypted Team Chat */}
        <div id="team-chat">
          <TeamChatChapter />
        </div>

        {/* Chapter 5: Granular Permissions & RBAC */}
        <div id="permissions-rbac">
          <PermissionsMatrixChapter />
        </div>

        {/* Chapter 6: Autonomous AI Sprint Engine */}
        <div id="ai-engine">
          <AISprintEngineChapter />
        </div>
      </div>
    </section>
  );
}
