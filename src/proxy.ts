import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isLoginPage = createRouteMatcher(["/admin/login(.*)"]);

const gate = clerkMiddleware(async (auth, request) => {
  if (isLoginPage(request)) return;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
});

/**
 * /admin/* vereist een Clerk-sessie. Dit is alleen de poort voor navigatie en
 * server actions (die als POST op dezelfde /admin/*-paden binnenkomen); wie
 * daadwerkelijk admin is (ADMIN_EMAILS) controleert getAdminEmail() in de
 * layout en in elke server action. De rest van de site draait niet door
 * Clerk: de matcher dekt alleen /admin.
 *
 * Zonder Clerk-sleutels (CLERK_SECRET_KEY + NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
 * weigeren we /admin met een duidelijke 503 (fail closed) in plaats van een
 * crash. De rest van de site blijft gewoon werken.
 */
const clerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

export default function proxy(request: NextRequest, event: Parameters<typeof gate>[1]) {
  if (!clerkConfigured) {
    return new NextResponse("Admin is niet geconfigureerd: Clerk-sleutels ontbreken.", {
      status: 503,
    });
  }
  return gate(request, event);
}

export const config = {
  matcher: ["/admin/:path*"],
};
