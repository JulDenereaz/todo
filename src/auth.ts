import NextAuth from "next-auth";
import type { OIDCConfig } from "@auth/core/providers";
import { eq } from "drizzle-orm";
import authConfig from "@/auth.config";
import { db } from "@/db";
import { users, lists } from "@/db/schema";
import { logger } from "@/lib/logger";

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
  // Unless idToken is explicitly false, Auth.js only ever reads claims off the
  // decoded ID token and never calls the userinfo endpoint (see
  // @auth/core/lib/actions/callback/oauth/callback.js). Authelia's ID token only
  // carries auth/session claims (sub, amr, aud, ...) — email/name only show up
  // in the userinfo response — so this must be false to actually get them.
  idToken: false,
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [autheliaProvider],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, profile, account }) {
      if (profile?.sub) {
        const log = logger.child({ userId: profile.sub });
        log.info({ grantedScope: account?.scope, profile }, "oidc login: raw profile received from Authelia");

        const email = (profile.email as string | undefined) ?? "";
        const name = (profile.name as string | undefined) ?? null;
        if (!email && !name) {
          log.warn(
            "oidc login: Authelia returned neither an email nor a name claim for this user — check the " +
              "account's displayname/email attributes and the client's granted scopes in Authelia's config"
          );
        }

        const now = new Date();
        db.insert(users)
          .values({ id: profile.sub, email, name, createdAt: now })
          .onConflictDoUpdate({ target: users.id, set: { email, name } })
          .run();
        log.debug({ email, name }, "user row upserted");

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
          log.info("created default \"My Tasks\" list for new user");
        }

        token.sub = profile.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        logger.debug({ userId: token.sub }, "session created");
      }
      return session;
    },
  },
});
