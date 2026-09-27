import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  checkPassword,
  createSessionToken,
  isAdminConfigured,
} from "@/lib/admin/auth";

interface PageProps {
  searchParams: Promise<{ error?: string; from?: string }>;
}

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  if (!checkPassword(password)) {
    redirect(`/admin/login?error=1&from=${encodeURIComponent(from)}`);
  }

  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect(from);
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const { error, from } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        action={login}
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-8"
      >
        <h1 className="text-xl font-semibold text-foreground">
          Quickscan admin
        </h1>

        {!isAdminConfigured() && (
          <p className="mt-4 text-sm text-appwizer-orange">
            ADMIN_PASSWORD is niet gezet — inloggen is nu niet mogelijk.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-appwizer-orange">
            Onjuist wachtwoord.
          </p>
        )}

        <input type="hidden" name="from" value={from ?? "/admin"} />
        <input
          type="password"
          name="password"
          placeholder="Wachtwoord"
          autoFocus
          autoComplete="current-password"
          className="mt-6 w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-appwizer-orange focus:outline-none"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-appwizer-orange px-4 py-3 text-base font-semibold text-white transition hover:brightness-110"
        >
          Inloggen
        </button>
      </form>
    </main>
  );
}
