"use client";

import { motion } from "framer-motion";

/** `aria-label` is required, not optional — three animated dots convey nothing to a screen reader without one. */
export function TypingIndicator({ "aria-label": ariaLabel }: { "aria-label": string }) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className="flex w-fit items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3"
    >
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          aria-hidden="true"
          className="size-1.5 rounded-full bg-muted-foreground/60"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: dot * 0.15 }}
        />
      ))}
    </div>
  );
}
