import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lists } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, badRequest } from "@/lib/api-helpers";
import { createListSchema } from "@/lib/validation";
import { getAccessibleListIds, getListsByIds, attachMembers } from "@/lib/lists";
import { withLogging } from "@/lib/api-logging";

export const GET = withLogging("lists", async () => {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const listIds = getAccessibleListIds(userId);
  const rows = getListsByIds(listIds).sort((a, b) => a.position - b.position);
  return NextResponse.json(attachMembers(rows));
});

export const POST = withLogging("lists", async (req: NextRequest) => {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const parsed = createListSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.message);

  const last = db
    .select({ position: lists.position })
    .from(lists)
    .where(eq(lists.userId, userId))
    .orderBy(desc(lists.position))
    .limit(1)
    .all();
  const nextPosition = last.length > 0 ? last[0].position + 1 : 0;

  const now = new Date();
  const id = crypto.randomUUID();
  db.insert(lists)
    .values({
      id,
      userId,
      name: parsed.data.name,
      color: parsed.data.color ?? null,
      position: nextPosition,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const [row] = db.select().from(lists).where(eq(lists.id, id)).all();
  return NextResponse.json(attachMembers([row])[0], { status: 201 });
});
