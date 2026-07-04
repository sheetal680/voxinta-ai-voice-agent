"use client";

import { motion } from "framer-motion";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fadeInUp, revealViewport } from "./motion-variants";
import { faqs } from "./placeholder-content";
import { SectionHeading } from "./section-heading";

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={fadeInUp}
          className="mt-12 rounded-2xl border border-border/50 bg-card/60 px-6 backdrop-blur-md"
        >
          <Accordion>
            {faqs.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
