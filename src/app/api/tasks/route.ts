import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { tasks, taskTags } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, badRequest } from "@/lib/api-helpers";
import { createTaskSchema, parseOptionalDueDate } from "@/lib/validation";
import { attachTags, attachAssignees, attachSubtaskCounts, replaceTaskTags } from "@/lib/tasks";
import { getAccessibleListIds, canAccessList, getListMembers } from "@/lib/lists";
import { logActivity } from "@/lib/activity";
import { withLogging } from "@/lib/api-logging";

export const GET = withLogging("tasks", async (req: NextRequest) => {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const listId = searchParams.get("listId");
  const tagId = searchParams.get("tagId");

  if (listId && !canAccessList(userId, listId)) return badRequest("Invalid listId");
  const scopedListIds = listId ? [listId] : getAccessibleListIds(userId);
  if (scopedListIds.length === 0) return NextResponse.json([]);

  let rows;
  if (tagId) {
    rows = db
      .select({ task: tasks })
      .from(tasks)
      .innerJoin(taskTags, eq(taskTags.taskId, tasks.id))
      .where(and(inArray(tasks.listId, scopedListIds), eq(taskTags.tagId, tagId)))
      .orderBy(asc(tasks.position))
      .all()
      .map((r) => r.task);
  } else {
    rows = db
      .select()
      .from(tasks)
      .where(inArray(tasks.listId, scopedListIds))
      .orderBy(asc(tasks.position))
      .all();
  }

  return NextResponse.json(attachSubtaskCounts(attachAssignees(attachTags(rows))));
});

export const POST = withLogging("tasks", async (req: NextRequest) => {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const parsed = createTaskSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.message);

  if (!canAccessList(userId, parsed.data.listId)) return badRequest("Invalid listId");

  const dueDate = parseOptionalDueDate(parsed.data.dueDate);
  if (dueDate === "invalid") return badRequest("Invalid dueDate");

  if (parsed.data.assigneeId) {
    const members = getListMembers(parsed.data.listId);
    if (!members.some((m) => m.id === parsed.data.assigneeId)) return badRequest("Invalid assigneeId");
  }

  const last = db
    .select({ position: tasks.position })
    .from(tasks)
    .where(eq(tasks.listId, parsed.data.listId))
    .orderBy(desc(tasks.position))
    .limit(1)
    .all();
  const nextPosition = last.length > 0 ? last[0].position + 1 : 0;

  const now = new Date();
  const id = crypto.randomUUID();
  db.insert(tasks)
    .values({
      id,
      listId: parsed.data.listId,
      userId,
      assigneeId: parsed.data.assigneeId ?? null,
      title: parsed.data.title,
      notes: parsed.data.notes ?? null,
      priority: parsed.data.priority ?? "none",
      dueDate: dueDate ?? null,
      position: nextPosition,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  if (parsed.data.tagIds?.length) {
    if (!replaceTaskTags(id, userId, parsed.data.tagIds)) return badRequest("Invalid tagIds");
  }

  logActivity({
    listId: parsed.data.listId,
    taskId: id,
    actorId: userId,
    type: "task_created",
    summary: `created "${parsed.data.title}"`,
  });

  const [row] = db.select().from(tasks).where(eq(tasks.id, id)).all();
  return NextResponse.json(attachSubtaskCounts(attachAssignees(attachTags([row])))[0], { status: 201 });
});
