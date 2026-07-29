import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { lists, tasks } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, badRequest } from "@/lib/api-helpers";
import { reorderSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const parsed = reorderSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.message);

  const ids = parsed.data.map((item) => item.id);
  const owned = db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), inArray(tasks.id, ids)))
    .all();
  if (owned.length !== ids.length) return badRequest("Invalid task ids");

  const listIds = [...new Set(parsed.data.map((item) => item.listId).filter((v): v is string => !!v))];
  if (listIds.length > 0) {
    const ownedLists = db
      .select({ id: lists.id })
      .from(lists)
      .where(and(eq(lists.userId, userId), inArray(lists.id, listIds)))
      .all();
    if (ownedLists.length !== listIds.length) return badRequest("Invalid list ids");
  }

  const now = new Date();
  db.transaction((tx) => {
    for (const item of parsed.data) {
      tx.update(tasks)
        .set({
          position: item.position,
          updatedAt: now,
          ...(item.listId ? { listId: item.listId } : {}),
        })
        .where(eq(tasks.id, item.id))
        .run();
    }
  });

  return NextResponse.json({ ok: true });
}
