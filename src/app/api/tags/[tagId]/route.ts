import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { updateTagSchema } from "@/lib/validation";
import { withLogging } from "@/lib/api-logging";

export const PATCH = withLogging(
  "tags/:tagId",
  async (req: NextRequest, { params }: { params: Promise<{ tagId: string }> }) => {
    const userId = await requireUserId();
    if (!userId) return unauthorized();
    const { tagId } = await params;

    const [existing] = db
      .select()
      .from(tags)
      .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
      .all();
    if (!existing) return notFound();

    const parsed = updateTagSchema.safeParse(await req.json());
    if (!parsed.success) return badRequest(parsed.error.message);

    try {
      db.update(tags)
        .set({
          ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
          ...(parsed.data.color !== undefined ? { color: parsed.data.color } : {}),
        })
        .where(eq(tags.id, tagId))
        .run();
    } catch {
      return badRequest("Tag name already exists");
    }

    const [row] = db.select().from(tags).where(eq(tags.id, tagId)).all();
    return NextResponse.json(row);
  }
);

export const DELETE = withLogging(
  "tags/:tagId",
  async (_req: NextRequest, { params }: { params: Promise<{ tagId: string }> }) => {
    const userId = await requireUserId();
    if (!userId) return unauthorized();
    const { tagId } = await params;

    const [existing] = db
      .select()
      .from(tags)
      .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
      .all();
    if (!existing) return notFound();

    db.delete(tags).where(eq(tags.id, tagId)).run();
    return NextResponse.json({ ok: true });
  }
);
