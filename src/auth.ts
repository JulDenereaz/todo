import NextAuth from "next-auth";
import type { OIDCConfig } from "@auth/core/providers";
import { eq } from "drizzle-orm";
import authConfig from "@/auth.config";
import { db } from "@/db";
import { users, lists } from "@/db/schema";

interface AutheliaProfile {
  sub: string;
  email?: string;
  name?: string;
}

const autheliaProvider: OIDCConfig<AutheliaProfile> = {
  id: "authelia",
  name: "Authelia",
  type: "oidc",
  issuer: process.env.AUTH_AUTHELIA_ISSUER,
  clientId: process.env.AUTH_AUTHELIA_ID,
  clientSecret: process.env.AUTH_AUTHELIA_SECRET,
  authorization: { params: { scope: "openid profile email" } },
  // Auth.js only auto-adds the "state" check when redirectProxyUrl is set;
  // without it the default is just ["pkce"]. Authelia rejects authorization
  // requests that omit `state` (or is under 8 chars), so it must be explicit.
  checks: ["pkce", "state"],
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [autheliaProvider],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, profile, account }) {
      if (profile?.sub) {
        // TEMPORARY: diagnosing missing name/email claims from Authelia. Remove after debugging.
        console.log("[auth debug] granted scope:", account?.scope);
        console.log("[auth debug] raw profile:", JSON.stringify(profile));

        const now = new Date();
        db.insert(users)
          .values({
            id: profile.sub,
            email: (profile.email as string | undefined) ?? "",
            name: (profile.name as string | undefined) ?? null,
            createdAt: now,
          })
          .onConflictDoUpdate({
            target: users.id,
            set: {
              email: (profile.email as string | undefined) ?? "",
              name: (profile.name as string | undefined) ?? null,
            },
          })
          .run();

        const hasLists = db
          .select({ id: lists.id })
          .from(lists)
          .where(eq(lists.userId, profile.sub))
          .limit(1)
          .all();
        if (hasLists.length === 0) {
          db.insert(lists)
            .values({
              id: crypto.randomUUID(),
              userId: profile.sub,
              name: "My Tasks",
              position: 0,
              createdAt: now,
              updatedAt: now,
            })
            .run();
        }

        token.sub = profile.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
