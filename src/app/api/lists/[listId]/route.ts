import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lists } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { updateListSchema } from "@/lib/validation";
import { canAccessList, attachMembers } from "@/lib/lists";
import { logActivity } from "@/lib/activity";
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

    const [existing] = db.select({ name: lists.name }).from(lists).where(eq(lists.id, listId)).all();

    db.update(lists)
      .set({
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.color !== undefined ? { color: parsed.data.color } : {}),
        updatedAt: new Date(),
      })
      .where(eq(lists.id, listId))
      .run();

    if (parsed.data.name !== undefined && parsed.data.name !== existing?.name) {
      logActivity({
        listId,
        actorId: userId,
        type: "list_renamed",
        summary: `renamed the list to "${parsed.data.name}"`,
      });
    }

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
