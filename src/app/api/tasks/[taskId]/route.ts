import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { subtasks, tasks } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { updateTaskSchema, parseOptionalDueDate } from "@/lib/validation";
import { attachTags, attachAssignees, attachSubtaskCounts, replaceTaskTags } from "@/lib/tasks";
import { canAccessList, getListMembers } from "@/lib/lists";
import { logActivity, shortUserLabel } from "@/lib/activity";
import { withLogging } from "@/lib/api-logging";

function getAccessibleTask(taskId: string, userId: string) {
  const [task] = db.select().from(tasks).where(eq(tasks.id, taskId)).all();
  if (!task) return null;
  if (!canAccessList(userId, task.listId)) return null;
  return task;
}

export const GET = withLogging(
  "tasks/:taskId",
  async (_req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) => {
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
);

export const PATCH = withLogging(
  "tasks/:taskId",
  async (req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) => {
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

    let assigneeLabel: string | null = null;
    if (parsed.data.assigneeId !== undefined && parsed.data.assigneeId !== null) {
      const members = getListMembers(targetListId);
      const assignee = members.find((m) => m.id === parsed.data.assigneeId);
      if (!assignee) return badRequest("Invalid assigneeId");
      assigneeLabel = shortUserLabel(assignee);
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

    const changes: string[] = [];
    if (parsed.data.title !== undefined && parsed.data.title !== existing.title) {
      changes.push(`renamed to "${parsed.data.title}"`);
    }
    if (parsed.data.notes !== undefined && parsed.data.notes !== existing.notes) {
      changes.push("updated notes");
    }
    if (parsed.data.priority !== undefined && parsed.data.priority !== existing.priority) {
      changes.push(`set priority to ${parsed.data.priority}`);
    }
    if (dueDate !== undefined) {
      const existingTime = existing.dueDate ? existing.dueDate.getTime() : null;
      const newTime = dueDate ? dueDate.getTime() : null;
      if (existingTime !== newTime) {
        changes.push(
          dueDate
            ? `set due date to ${dueDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
            : "cleared the due date"
        );
      }
    }
    if (parsed.data.completed !== undefined && parsed.data.completed !== existing.completed) {
      changes.push(parsed.data.completed ? "marked as done" : "marked as not done");
    }
    if (parsed.data.assigneeId !== undefined && parsed.data.assigneeId !== existing.assigneeId) {
      changes.push(parsed.data.assigneeId ? `assigned to ${assigneeLabel}` : "unassigned it");
    }
    if (parsed.data.listId !== undefined && parsed.data.listId !== existing.listId) {
      changes.push("moved it to another list");
    }

    if (changes.length > 0) {
      logActivity({
        listId: targetListId,
        taskId,
        actorId: userId,
        type: "task_updated",
        summary: `updated "${existing.title}" (${changes.join(", ")})`,
      });
    }

    const [row] = db.select().from(tasks).where(eq(tasks.id, taskId)).all();
    return NextResponse.json(attachSubtaskCounts(attachAssignees(attachTags([row])))[0]);
  }
);

export const DELETE = withLogging(
  "tasks/:taskId",
  async (_req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) => {
    const userId = await requireUserId();
    if (!userId) return unauthorized();
    const { taskId } = await params;

    const existing = getAccessibleTask(taskId, userId);
    if (!existing) return notFound();

    db.delete(tasks).where(eq(tasks.id, taskId)).run();

    logActivity({
      listId: existing.listId,
      taskId: null,
      actorId: userId,
      type: "task_deleted",
      summary: `deleted "${existing.title}"`,
    });

    return NextResponse.json({ ok: true });
  }
);
