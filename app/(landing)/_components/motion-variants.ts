import type { Variants } from "framer-motion";

/** Fade + slide up. Used with `whileInView` across most landing sections. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/** Wrap a grid of `fadeInUp` children in this to stagger their reveal. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/** Default viewport config so section reveals trigger once, slightly early. */
export const revealViewport = { once: true, margin: "-80px" } as const;
