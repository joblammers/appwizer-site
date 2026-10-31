import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { getAdminEmail } from "@/lib/admin/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Sessie én allowlist (ADMIN_EMAILS) — de proxy checkt alleen of er een sessie is.
  if (!(await getAdminEmail())) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
        <Link href="/admin" className="font-semibold text-foreground">
          Quickscan admin
        </Link>
        <SignOutButton redirectUrl="/admin/login">
          <button
            type="button"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Uitloggen
          </button>
        </SignOutButton>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
