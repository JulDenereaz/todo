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
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [autheliaProvider],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, profile }) {
      if (profile?.sub) {
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
