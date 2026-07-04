"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AudioWaveform, Mic, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { heroContent } from "./placeholder-content";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative glow blobs behind the glass content — subtle glassmorphism backdrop. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center blur-3xl"
      >
        <div className="h-72 w-[36rem] rounded-full bg-primary/10" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-40 -z-10 size-72 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-md">
            <Sparkles className="size-3.5 text-primary" />
            {heroContent.eyebrow}
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {heroContent.headline}
          </h1>

          <p className="mt-6 text-lg text-muted-foreground text-balance">
            {heroContent.subheadline}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href={heroContent.primaryCta.href}
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              {heroContent.primaryCta.label}
            </Link>
            <a
              href={heroContent.secondaryCta.href}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
            >
              {heroContent.secondaryCta.label}
            </a>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">{heroContent.trustNote}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          className="relative mx-auto w-full max-w-sm lg:mx-0"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-2xl border border-border/50 bg-card/60 p-6 shadow-xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Mic className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Voxinta Assistant</p>
                <p className="text-xs text-muted-foreground">Listening…</p>
              </div>
            </div>

            <div className="mt-5 flex items-end gap-1 rounded-xl bg-muted/60 p-4">
              {[0.3, 0.6, 1, 0.5, 0.8, 0.4, 0.7].map((height, index) => (
                <motion.span
                  key={index}
                  className="w-1.5 rounded-full bg-primary/70"
                  style={{ height: `${height * 32}px` }}
                  animate={{ scaleY: [1, 0.4, 1] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.1,
                  }}
                />
              ))}
            </div>

            <div className="mt-5 space-y-2">
              <div className="ml-auto w-4/5 rounded-lg rounded-tr-sm bg-primary/10 px-3 py-2 text-xs text-foreground">
                &ldquo;Book me a table for two tonight at 7.&rdquo;
              </div>
              <div className="mr-auto w-4/5 rounded-lg rounded-tl-sm bg-muted px-3 py-2 text-xs text-muted-foreground">
                Done — you&apos;re booked at 7:00 PM.
              </div>
            </div>
          </motion.div>

          <div className="absolute -bottom-4 -left-4 flex size-12 items-center justify-center rounded-xl border border-border/50 bg-card/80 shadow-lg backdrop-blur-md">
            <AudioWaveform className="size-5 text-primary" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
