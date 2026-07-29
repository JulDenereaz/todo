import type { NextAuthConfig } from "next-auth";

// Edge-safe config used by middleware. No providers/DB here — better-sqlite3
// is a native Node addon and can't be bundled into the Edge runtime that
// Next.js middleware runs on by default. Providers + DB access live in
// src/auth.ts, which is only ever imported from Node-runtime code (route
// handlers, server components).
export default {
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
