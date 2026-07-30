import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, badRequest } from "@/lib/api-helpers";
import { createTagSchema } from "@/lib/validation";
import { withLogging } from "@/lib/api-logging";

export const GET = withLogging("tags", async () => {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const rows = db.select().from(tags).where(eq(tags.userId, userId)).orderBy(asc(tags.name)).all();
  return NextResponse.json(rows);
});

export const POST = withLogging("tags", async (req: NextRequest) => {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const parsed = createTagSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.message);

  const id = crypto.randomUUID();
  try {
    db.insert(tags)
      .values({ id, userId, name: parsed.data.name, color: parsed.data.color ?? null })
      .run();
  } catch {
    return badRequest("Tag already exists");
  }

  const [row] = db.select().from(tags).where(eq(tags.id, id)).all();
  return NextResponse.json(row, { status: 201 });
});
