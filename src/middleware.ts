import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // Edge runtime — pino's Node APIs aren't available here, so this stays a plain
  // structured console.log (still captured as-is by `docker logs` / Portainer).
  console.log(
    JSON.stringify({
      level: "debug",
      msg: "middleware",
      method: req.method,
      url: req.nextUrl.pathname + req.nextUrl.search,
      authenticated: !!req.auth,
      userId: req.auth?.user?.id,
    })
  );

  if (!req.auth) {
    // GET /api/auth/signin/:provider is unsupported by Auth.js v5 (it only
    // accepts a CSRF-protected POST there). Redirect to a small client page
    // that calls the signIn() helper instead, which does that POST for us.
    const signInUrl = new URL("/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    "/((?!api/auth|api/health|signin|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
