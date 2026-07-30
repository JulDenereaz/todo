import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { subtasks, tasks } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { updateTaskSchema, parseOptionalDueDate } from "@/lib/validation";
import { attachTags, attachAssignees, attachSubtaskCounts, replaceTaskTags } from "@/lib/tasks";
import { canAccessList, getListMembers } from "@/lib/lists";

function getAccessibleTask(taskId: string, userId: string) {
  const [task] = db.select().from(tasks).where(eq(tasks.id, taskId)).all();
  if (!task) return null;
  if (!canAccessList(userId, task.listId)) return null;
  return task;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { taskId } = await params;

  const task = getAccessibleTask(taskId, userId);
  if (!task) return notFound();

  const taskSubtasks = db
    .select()
    .from(subtasks)
    .where(eq(subtasks.taskId, taskId))
    .orderBy(asc(subtasks.position))
    .all();

  const [withCounts] = attachSubtaskCounts(attachAssignees(attachTags([task])));
  return NextResponse.json({ ...withCounts, subtasks: taskSubtasks });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { taskId } = await params;

  const existing = getAccessibleTask(taskId, userId);
  if (!existing) return notFound();

  const parsed = updateTaskSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.message);

  const targetListId = parsed.data.listId ?? existing.listId;
  if (parsed.data.listId !== undefined && !canAccessList(userId, parsed.data.listId)) {
    return badRequest("Invalid listId");
  }

  if (parsed.data.assigneeId !== undefined && parsed.data.assigneeId !== null) {
    const members = getListMembers(targetListId);
    if (!members.some((m) => m.id === parsed.data.assigneeId)) return badRequest("Invalid assigneeId");
  }

  const dueDate = parseOptionalDueDate(parsed.data.dueDate);
  if (dueDate === "invalid") return badRequest("Invalid dueDate");

  db.update(tasks)
    .set({
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
      ...(parsed.data.priority !== undefined ? { priority: parsed.data.priority } : {}),
      ...(parsed.data.listId !== undefined ? { listId: parsed.data.listId } : {}),
      ...(parsed.data.assigneeId !== undefined ? { assigneeId: parsed.data.assigneeId } : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
      ...(parsed.data.completed !== undefined
        ? { completed: parsed.data.completed, completedAt: parsed.data.completed ? new Date() : null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .run();

  if (parsed.data.tagIds !== undefined) {
    if (!replaceTaskTags(taskId, userId, parsed.data.tagIds)) return badRequest("Invalid tagIds");
  }

  const [row] = db.select().from(tasks).where(eq(tasks.id, taskId)).all();
  return NextResponse.json(attachSubtaskCounts(attachAssignees(attachTags([row])))[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { taskId } = await params;

  const existing = getAccessibleTask(taskId, userId);
  if (!existing) return notFound();

  db.delete(tasks).where(eq(tasks.id, taskId)).run();
  return NextResponse.json({ ok: true });
}
