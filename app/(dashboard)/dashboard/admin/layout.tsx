import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/features/admin/queries";

/**
 * Admin-role gate for every /dashboard/admin/** route. The (dashboard)
 * layout already guarantees an authenticated session; this layer checks
 * `profiles.role === "admin"` on top of that and sends anyone else back to
 * their own dashboard — the same defense-in-depth pattern as the dashboard
 * layout's own auth check (this page-level gate, plus each admin RPC/action
 * re-checking is_admin() itself, per CLAUDE.md's Zod-on-every-input spirit
 * applied to authorization).
 */
// Depends on the caller's cookie-scoped auth session — must never be
// statically prerendered.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return <div className="flex flex-col gap-6">{children}</div>;
}
