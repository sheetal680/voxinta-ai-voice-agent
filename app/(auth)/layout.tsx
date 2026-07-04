"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Shared shell for /login, /signup, /forgot-password, /reset-password.
 * Route-level auth redirects (bouncing a logged-in user away from these
 * pages) live in the Proxy (lib/supabase/proxy.ts), not here — this layout
 * is purely presentational.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <Link href="/" className="mb-8 text-lg font-semibold tracking-tight text-foreground">
        Voxinta
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {children}
      </motion.div>
    </div>
  );
}
