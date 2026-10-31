import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignIn, SignOutButton } from "@clerk/nextjs";
import { getAdminEmail } from "@/lib/admin/auth";

/**
 * Inloggen via Clerk. Is iemand al ingelogd mét toegang, dan door naar /admin;
 * ingelogd zonder toegang (niet in ADMIN_EMAILS) krijgt een melding en kan
 * uitloggen. Een redirect-doel uit de URL gebruiken we bewust niet: een
 * ongevalideerde `from` was een open redirect.
 */
export default async function AdminLoginPage() {
  if (await getAdminEmail()) redirect("/admin");
  const { userId } = await auth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      {userId ? (
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8">
          <h1 className="text-xl font-semibold text-foreground">Geen toegang</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Dit account heeft geen toegang tot de admin. Log uit en log in met een ander account.
          </p>
          <SignOutButton redirectUrl="/admin/login">
            <button
              type="button"
              className="mt-6 w-full rounded-lg bg-appwizer-orange px-4 py-3 text-base font-semibold text-white transition hover:brightness-110"
            >
              Uitloggen
            </button>
          </SignOutButton>
        </div>
      ) : (
        <SignIn
          routing="hash"
          fallbackRedirectUrl="/admin"
          appearance={{ elements: { footerAction: "hidden" } }}
        />
      )}
    </main>
  );
}
