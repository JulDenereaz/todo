import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { unauthorized, badRequest } from "@/lib/api-helpers";
import { getAccessibleListIds, canAccessList } from "@/lib/lists";
import { getActivityFeed } from "@/lib/activity";
import { withLogging } from "@/lib/api-logging";

export const GET = withLogging("activity", async (req: NextRequest) => {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const listId = searchParams.get("listId");

  if (listId && !canAccessList(userId, listId)) return badRequest("Invalid listId");
  const scopedListIds = listId ? [listId] : getAccessibleListIds(userId);
  if (scopedListIds.length === 0) return NextResponse.json([]);

  return NextResponse.json(getActivityFeed(scopedListIds));
});
