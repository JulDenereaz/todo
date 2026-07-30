import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lists, listMembers, users } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { addListMemberSchema } from "@/lib/validation";
import { canAccessList, getListMembers } from "@/lib/lists";
import { withLogging } from "@/lib/api-logging";

export const GET = withLogging(
  "lists/:listId/members",
  async (_req: NextRequest, { params }: { params: Promise<{ listId: string }> }) => {
    const userId = await requireUserId();
    if (!userId) return unauthorized();
    const { listId } = await params;

    if (!canAccessList(userId, listId)) return notFound();

    return NextResponse.json(getListMembers(listId));
  }
);

export const POST = withLogging(
  "lists/:listId/members",
  async (req: NextRequest, { params }: { params: Promise<{ listId: string }> }) => {
    const userId = await requireUserId();
    if (!userId) return unauthorized();
    const { listId } = await params;

    if (!canAccessList(userId, listId)) return notFound();

    const parsed = addListMemberSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest(parsed.error.message);

    const [target] = db.select().from(users).where(eq(users.id, parsed.data.userId)).all();
    if (!target) return badRequest("Unknown user");

    const [list] = db.select({ userId: lists.userId }).from(lists).where(eq(lists.id, listId)).all();
    if (!list) return notFound();
    if (list.userId === target.id) return badRequest("That user already owns this list");

    db.insert(listMembers)
      .values({ listId, userId: target.id, createdAt: new Date() })
      .onConflictDoNothing()
      .run();

    return NextResponse.json(getListMembers(listId), { status: 201 });
  }
);
