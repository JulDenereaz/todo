import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { lists, listMembers, users } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { canAccessList } from "@/lib/lists";
import { logActivity, shortUserLabel } from "@/lib/activity";
import { withLogging } from "@/lib/api-logging";

export const DELETE = withLogging(
  "lists/:listId/members/:userId",
  async (_req: NextRequest, { params }: { params: Promise<{ listId: string; userId: string }> }) => {
    const requesterId = await requireUserId();
    if (!requesterId) return unauthorized();
    const { listId, userId: targetUserId } = await params;

    if (!canAccessList(requesterId, listId)) return notFound();

    const [list] = db.select({ userId: lists.userId }).from(lists).where(eq(lists.id, listId)).all();
    if (!list) return notFound();
    if (list.userId === targetUserId) return badRequest("Cannot remove the list owner; delete the list instead");

    const [target] = db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, targetUserId))
      .all();

    db.delete(listMembers)
      .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, targetUserId)))
      .run();

    logActivity({
      listId,
      actorId: requesterId,
      type: "member_removed",
      summary: `removed ${target ? shortUserLabel(target) : "a member"} from the list`,
    });

    return NextResponse.json({ ok: true });
  }
);
