"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, LogIn, Users, FolderKanban, CheckCircle2, ShieldCheck, MessageSquare, Zap, BarChart3, Globe, Star, Code2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";

const features = [
  { icon: FolderKanban, title: "Modern Kanban & Scrum", desc: "Drag-and-drop boards built for speed. Easily manage workflows and sprints without the clutter.", color: "from-violet-500 to-indigo-500" },
  { icon: Users, title: "Invite & Collaborate", desc: "Instantly invite teammates via email or join link. Build your project workspace effortlessly.", color: "from-blue-500 to-cyan-500" },
  { icon: MessageSquare, title: "Encrypted Team Chat", desc: "Real-time Socket.IO chat rooms for every project. Fully end-to-end encrypted out of the box.", color: "from-emerald-500 to-teal-500" },
  { icon: ShieldCheck, title: "Granular Roles & Permissions", desc: "Explicit control over who views, edits, or deletes components in your stack.", color: "from-pink-500 to-rose-500" },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">SprintForge</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</button>
            <button onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</button>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link href="/signup" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-all active:scale-95">
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 max-w-7xl mx-auto">
        {/* Background orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

        <motion.div {...fadeUp} className="text-center max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Introducing AI-powered sprint planning
            <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">NEW</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
            Where Agile Teams{" "}
            <span className="gradient-text">Build Faster,</span>
            <br />
            Smarter, Better
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            SprintForge is the modern project management platform built for software teams. 
            Scrum boards, Kanban views, real-time collaboration, and AI-powered insights — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/25 text-lg"
            >
              Start for free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 px-8 py-4 border border-border bg-card text-foreground font-semibold rounded-xl hover:bg-muted transition-all text-lg"
            >
              Sign in to Workspace
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">No credit card required • Free forever for small teams</p>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-20 relative max-w-6xl mx-auto"
        >
          <div className="gradient-border overflow-hidden rounded-2xl shadow-2xl">
            <div className="bg-card p-2">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-2 mb-3 px-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 bg-muted rounded-md h-6 flex items-center px-3">
                  <span className="text-xs text-muted-foreground">app.sprintforge.io/dashboard</span>
                </div>
              </div>
              {/* Mock board */}
              <div className="flex gap-3 p-4 overflow-x-auto">
                {["To Do", "In Progress", "In Review", "Done"].map((col, ci) => (
                  <div key={col} className="kanban-column min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground">{col}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{3 - ci > 0 ? 3 - ci : 1}</span>
                    </div>
                    {[...Array(Math.max(1, 3 - ci))].map((_, i) => (
                      <div key={i} className="task-card mb-2">
                        <div className="flex items-center gap-1 mb-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${["bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"][i % 4]}`} />
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">SFG-{100 + i + ci * 3}</span>
                        </div>
                        <div className="h-2.5 rounded skeleton w-full mb-1.5" />
                        <div className="h-2 rounded skeleton w-3/4" />
                        <div className="flex items-center gap-2 mt-2.5">
                          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">U</div>
                          <div className="flex gap-1 ml-auto">
                            <div className="h-3 w-8 skeleton rounded-full" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Glow */}
          <div className="absolute inset-x-0 -bottom-10 h-20 bg-gradient-to-t from-background to-transparent" />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-black mb-4">Everything your team needs</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From planning to shipping — SprintForge has every tool to keep your team aligned and moving fast.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all duration-300 group cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">About SprintForge</h2>
          <p className="text-lg text-muted-foreground mb-16 max-w-2xl mx-auto leading-relaxed">
            SprintForge is a modern Agile project management platform built for teams and developers. We focus on speed, collaboration, and intuitive workflows to help you build great software.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center p-8 bg-background rounded-3xl border border-border">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <Globe className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2 text-lg">Location</h3>
              <p className="text-muted-foreground font-medium">Pune, Maharashtra</p>
            </div>
            
            <div className="flex flex-col items-center p-8 bg-background rounded-3xl border border-border">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
              <h3 className="font-bold text-foreground mb-2 text-lg">Phone</h3>
              <p className="text-muted-foreground font-medium">+91 7780935163</p>
            </div>

            <div className="flex flex-col items-center p-8 bg-background rounded-3xl border border-border">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </div>
              <h3 className="font-bold text-foreground mb-2 text-lg">Email</h3>
              <a href="mailto:sprintforge@gmail.com" className="text-primary hover:underline font-medium">sprintforge@gmail.com</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-5xl font-black mb-6">Ready to build faster?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of teams shipping great software with SprintForge.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 active:scale-95"
          >
            Start building for free <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            {["No credit card", "Free forever plan", "Cancel anytime"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {item}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-sm">SprintForge</span>
            <span className="text-muted-foreground text-sm">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {["Privacy", "Terms", "Security", "Status"].map((item) => (
              <a key={item} href="#" className="hover:text-foreground transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
