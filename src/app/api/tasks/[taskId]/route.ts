import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lists, subtasks, tasks } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { updateTaskSchema, parseOptionalDueDate } from "@/lib/validation";
import { attachTags, replaceTaskTags } from "@/lib/tasks";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { taskId } = await params;

  const [task] = db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .all();
  if (!task) return notFound();

  const taskSubtasks = db
    .select()
    .from(subtasks)
    .where(eq(subtasks.taskId, taskId))
    .orderBy(asc(subtasks.position))
    .all();

  const [withTags] = attachTags([task]);
  return NextResponse.json({ ...withTags, subtasks: taskSubtasks });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { taskId } = await params;

  const [existing] = db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .all();
  if (!existing) return notFound();

  const parsed = updateTaskSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.message);

  if (parsed.data.listId !== undefined) {
    const [list] = db
      .select()
      .from(lists)
      .where(and(eq(lists.id, parsed.data.listId), eq(lists.userId, userId)))
      .all();
    if (!list) return badRequest("Invalid listId");
  }

  const dueDate = parseOptionalDueDate(parsed.data.dueDate);
  if (dueDate === "invalid") return badRequest("Invalid dueDate");

  db.update(tasks)
    .set({
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
      ...(parsed.data.priority !== undefined ? { priority: parsed.data.priority } : {}),
      ...(parsed.data.listId !== undefined ? { listId: parsed.data.listId } : {}),
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
  return NextResponse.json(attachTags([row])[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { taskId } = await params;

  const [existing] = db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .all();
  if (!existing) return notFound();

  db.delete(tasks).where(eq(tasks.id, taskId)).run();
  return NextResponse.json({ ok: true });
}
