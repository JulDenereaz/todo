import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lists } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { updateListSchema } from "@/lib/validation";
import { canAccessList, attachMembers } from "@/lib/lists";
import { withLogging } from "@/lib/api-logging";

export const PATCH = withLogging(
  "lists/:listId",
  async (req: NextRequest, { params }: { params: Promise<{ listId: string }> }) => {
    const userId = await requireUserId();
    if (!userId) return unauthorized();
    const { listId } = await params;

    if (!canAccessList(userId, listId)) return notFound();

    const parsed = updateListSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest(parsed.error.message);

    db.update(lists)
      .set({
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.color !== undefined ? { color: parsed.data.color } : {}),
        updatedAt: new Date(),
      })
      .where(eq(lists.id, listId))
      .run();

    const [row] = db.select().from(lists).where(eq(lists.id, listId)).all();
    return NextResponse.json(attachMembers([row])[0]);
  }
);

export const DELETE = withLogging(
  "lists/:listId",
  async (_req: NextRequest, { params }: { params: Promise<{ listId: string }> }) => {
    const userId = await requireUserId();
    if (!userId) return unauthorized();
    const { listId } = await params;

    if (!canAccessList(userId, listId)) return notFound();

    db.delete(lists).where(eq(lists.id, listId)).run();
    return NextResponse.json({ ok: true });
  }
);
