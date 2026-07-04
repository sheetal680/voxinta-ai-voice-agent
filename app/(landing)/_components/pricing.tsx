"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fadeInUp, revealViewport, staggerContainer } from "./motion-variants";
import { pricingTiers } from "./placeholder-content";
import { SectionHeading } from "./section-heading";

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing that scales with you"
          description="Illustrative pricing — start free, upgrade when your agents are doing real work."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={staggerContainer}
          className="mt-16 grid gap-6 lg:grid-cols-3"
        >
          {pricingTiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={fadeInUp}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 backdrop-blur-md",
                tier.highlighted
                  ? "border-primary/50 bg-card shadow-xl lg:-translate-y-2"
                  : "border-border/50 bg-card/60",
              )}
            >
              {tier.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most popular</Badge>
              )}

              <h3 className="text-base font-semibold">{tier.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>

              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{tier.price}</span>
                {tier.period && <span className="text-sm text-muted-foreground">{tier.period}</span>}
              </p>

              <Link
                href={tier.cta.href}
                className={cn(
                  buttonVariants({ variant: tier.highlighted ? "default" : "outline" }),
                  "mt-6 w-full",
                )}
              >
                {tier.cta.label}
              </Link>

              <ul className="mt-6 space-y-3 text-sm">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
