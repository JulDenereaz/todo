import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lists } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, badRequest } from "@/lib/api-helpers";
import { reorderSchema } from "@/lib/validation";
import { getAccessibleListIds } from "@/lib/lists";
import { withLogging } from "@/lib/api-logging";

export const PATCH = withLogging("lists/reorder", async (req: NextRequest) => {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const parsed = reorderSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.message);

  const ids = parsed.data.map((item) => item.id);
  const accessible = new Set(getAccessibleListIds(userId));
  if (!ids.every((id) => accessible.has(id))) return badRequest("Invalid list ids");

  const now = new Date();
  db.transaction((tx) => {
    for (const item of parsed.data) {
      tx.update(lists).set({ position: item.position, updatedAt: now }).where(eq(lists.id, item.id)).run();
    }
  });

  return NextResponse.json({ ok: true });
});
