import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { updateProfileSchema } from "@/lib/validation";
import { withLogging } from "@/lib/api-logging";

function serialize(row: typeof users.$inferSelect) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt.toISOString(),
  };
}

export const GET = withLogging("users/me", async () => {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const [row] = db.select().from(users).where(eq(users.id, userId)).all();
  if (!row) return notFound();
  return NextResponse.json(serialize(row));
});

export const PATCH = withLogging("users/me", async (req: NextRequest) => {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const parsed = updateProfileSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.message);

  db.update(users)
    .set({
      ...(parsed.data.avatarUrl !== undefined ? { avatarUrl: parsed.data.avatarUrl } : {}),
    })
    .where(eq(users.id, userId))
    .run();

  const [row] = db.select().from(users).where(eq(users.id, userId)).all();
  return NextResponse.json(serialize(row));
});

// Cascades (see schema.ts) remove the user's owned lists/tasks/tags/activity and
// their membership in shared lists. Tasks they created in someone else's list also
// cascade-delete via tasks.userId — a pre-existing schema behavior, not new here.
export const DELETE = withLogging("users/me", async () => {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  db.delete(users).where(eq(users.id, userId)).run();
  return NextResponse.json({ ok: true });
});
