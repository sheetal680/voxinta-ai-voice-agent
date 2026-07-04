"use client";

import { motion } from "framer-motion";

import { fadeInUp, revealViewport, staggerContainer } from "./motion-variants";
import { testimonials } from "./placeholder-content";
import { SectionHeading } from "./section-heading";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Testimonials() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Testimonials"
          title="Placeholder quotes — real ones coming soon"
          description="These are illustrative testimonials standing in for real customer quotes."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={staggerContainer}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {testimonials.map((testimonial) => (
            <motion.figure
              key={testimonial.name}
              variants={fadeInUp}
              className="flex flex-col rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-md"
            >
              <blockquote className="text-sm text-foreground">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {initials(testimonial.name)}
                </div>
                <div>
                  <p className="text-sm font-medium">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
