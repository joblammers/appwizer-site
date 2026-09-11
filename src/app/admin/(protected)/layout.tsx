import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";

async function logout() {
  "use server";
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
        <Link href="/admin" className="font-semibold text-foreground">
          Quickscan admin
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Uitloggen
          </button>
        </form>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
