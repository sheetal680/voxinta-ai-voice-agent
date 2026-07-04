"use client";

import { motion } from "framer-motion";
import { BarChart3, BrainCircuit, FileSearch, Mic, Users, Wrench, type LucideIcon } from "lucide-react";

import { fadeInUp, revealViewport, staggerContainer } from "./motion-variants";
import { features } from "./placeholder-content";
import { SectionHeading } from "./section-heading";

const ICONS: Record<(typeof features)[number]["icon"], LucideIcon> = {
  Mic,
  BrainCircuit,
  FileSearch,
  Wrench,
  Users,
  BarChart3,
};

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Features"
          title="Everything an AI voice agent needs"
          description="Voice, memory, documents, and tools — wired together so you configure an agent instead of building one from scratch."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={staggerContainer}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = ICONS[feature.icon];
            return (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-md"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
