"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { fadeInUp, revealViewport } from "./motion-variants";
import { ctaContent } from "./placeholder-content";

export function Cta() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={revealViewport}
        variants={fadeInUp}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border/50 bg-card/60 px-6 py-16 text-center backdrop-blur-xl sm:px-12"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 flex justify-center blur-3xl"
        >
          <div className="h-64 w-[28rem] rounded-full bg-primary/15" />
        </div>

        <h2 className="relative text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {ctaContent.headline}
        </h2>
        <p className="relative mt-4 text-lg text-muted-foreground text-balance">
          {ctaContent.subheadline}
        </p>

        <div className="relative mt-8 flex justify-center">
          <Link
            href={ctaContent.primaryCta.href}
            className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
          >
            {ctaContent.primaryCta.label}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
