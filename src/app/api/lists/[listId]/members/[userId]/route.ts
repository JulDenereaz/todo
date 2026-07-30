import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { lists, listMembers } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { canAccessList } from "@/lib/lists";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ listId: string; userId: string }> }
) {
  const requesterId = await requireUserId();
  if (!requesterId) return unauthorized();
  const { listId, userId: targetUserId } = await params;

  if (!canAccessList(requesterId, listId)) return notFound();

  const [list] = db.select({ userId: lists.userId }).from(lists).where(eq(lists.id, listId)).all();
  if (!list) return notFound();
  if (list.userId === targetUserId) return badRequest("Cannot remove the list owner; delete the list instead");

  db.delete(listMembers)
    .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, targetUserId)))
    .run();

  return NextResponse.json({ ok: true });
}
