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

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));

  if (listId && !canAccessList(userId, listId)) return badRequest("Invalid listId");
  const scopedListIds = listId ? [listId] : getAccessibleListIds(userId);
  if (scopedListIds.length === 0) return NextResponse.json({ entries: [], total: 0, page, pageSize });

  const { entries, total } = getActivityFeed(scopedListIds, { limit: pageSize, offset: (page - 1) * pageSize });
  return NextResponse.json({ entries, total, page, pageSize });
});
