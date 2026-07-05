import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/app/(dashboard)/_components/empty-state";
import { UserRow } from "@/features/admin/components/user-row";
import { getAdminUsers } from "@/features/admin/queries";

export const metadata: Metadata = { title: "User Management — Voxinta" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const users = await getAdminUsers();

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/admin"
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Back to admin"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">{users.length} accounts.</p>
        </div>
      </div>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No users yet" description="Accounts will show up here once people sign up." />
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((row) => (
            <UserRow key={row.id} user={row} isSelf={row.id === user?.id} />
          ))}
        </div>
      )}
    </>
  );
}
