import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/admin/auth";

/**
 * In productie proxyt `/` naar WordPress (zie de fallback-rewrite in
 * next.config.ts). Zonder WORDPRESS_ORIGIN is er lokaal niets dat "/"
 * bedient, dus sturen we hier door naar de quickscan zodat "npm run dev"
 * meteen iets bruikbaars toont.
 *
 * /admin/* is met een wachtwoord afgeschermd. De sessie wordt hier gecheckt
 * vóór elke navigatie én vóór elke server action (die als POST op dezelfde
 * /admin/*-paden binnenkomt).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!isValidSessionToken(token)) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return;
  }

  if (pathname === "/" && !process.env.WORDPRESS_ORIGIN) {
    return NextResponse.redirect(new URL("/quickscan", request.url));
  }
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
