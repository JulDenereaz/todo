import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { lists } from "@/db/schema";
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
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.userId, userId), inArray(lists.id, ids)))
    .all();
  if (owned.length !== ids.length) return badRequest("Invalid list ids");

  const now = new Date();
  db.transaction((tx) => {
    for (const item of parsed.data) {
      tx.update(lists).set({ position: item.position, updatedAt: now }).where(eq(lists.id, item.id)).run();
    }
  });

  return NextResponse.json({ ok: true });
}
