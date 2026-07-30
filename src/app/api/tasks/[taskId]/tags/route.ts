import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tags, tasks, taskTags } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { taskTagBodySchema } from "@/lib/validation";
import { canAccessList } from "@/lib/lists";
import { withLogging } from "@/lib/api-logging";

function getAccessibleTask(taskId: string, userId: string) {
  const [task] = db.select({ id: tasks.id, listId: tasks.listId }).from(tasks).where(eq(tasks.id, taskId)).all();
  if (!task) return null;
  if (!canAccessList(userId, task.listId)) return null;
  return task;
}

export const POST = withLogging(
  "tasks/:taskId/tags",
  async (req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) => {
    const userId = await requireUserId();
    if (!userId) return unauthorized();
    const { taskId } = await params;

    const task = getAccessibleTask(taskId, userId);
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
);

export const DELETE = withLogging(
  "tasks/:taskId/tags",
  async (req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) => {
    const userId = await requireUserId();
    if (!userId) return unauthorized();
    const { taskId } = await params;

    const task = getAccessibleTask(taskId, userId);
    if (!task) return notFound();

    const parsed = taskTagBodySchema.safeParse(await req.json());
    if (!parsed.success) return badRequest(parsed.error.message);

    db.delete(taskTags)
      .where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, parsed.data.tagId)))
      .run();
    return NextResponse.json({ ok: true });
  }
);
