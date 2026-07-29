import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tags, tasks, taskTags } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { taskTagBodySchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { taskId } = await params;

  const [task] = db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .all();
  if (!task) return notFound();

  const parsed = taskTagBodySchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.message);

  const [tag] = db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.id, parsed.data.tagId), eq(tags.userId, userId)))
    .all();
  if (!tag) return badRequest("Invalid tagId");

  db.insert(taskTags).values({ taskId, tagId: parsed.data.tagId }).onConflictDoNothing().run();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { taskId } = await params;

  const [task] = db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .all();
  if (!task) return notFound();

  const parsed = taskTagBodySchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.message);

  db.delete(taskTags)
    .where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, parsed.data.tagId)))
    .run();
  return NextResponse.json({ ok: true });
}
