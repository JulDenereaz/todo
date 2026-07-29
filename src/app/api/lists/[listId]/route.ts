import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { lists } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { updateListSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ listId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { listId } = await params;

  const [existing] = db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, userId)))
    .all();
  if (!existing) return notFound();

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
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ listId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { listId } = await params;

  const [existing] = db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, userId)))
    .all();
  if (!existing) return notFound();

  db.delete(lists).where(eq(lists.id, listId)).run();
  return NextResponse.json({ ok: true });
}
