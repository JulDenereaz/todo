import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { subtasks, tasks } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { updateSubtaskSchema } from "@/lib/validation";

function getOwnedSubtask(subtaskId: string, userId: string) {
  const [row] = db
    .select({ subtask: subtasks })
    .from(subtasks)
    .innerJoin(tasks, eq(tasks.id, subtasks.taskId))
    .where(and(eq(subtasks.id, subtaskId), eq(tasks.userId, userId)))
    .all();
  return row?.subtask ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ subtaskId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { subtaskId } = await params;

  const existing = getOwnedSubtask(subtaskId, userId);
  if (!existing) return notFound();

  const parsed = updateSubtaskSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.message);

  db.update(subtasks)
    .set({
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.completed !== undefined ? { completed: parsed.data.completed } : {}),
    })
    .where(eq(subtasks.id, subtaskId))
    .run();

  const [row] = db.select().from(subtasks).where(eq(subtasks.id, subtaskId)).all();
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ subtaskId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { subtaskId } = await params;

  const existing = getOwnedSubtask(subtaskId, userId);
  if (!existing) return notFound();

  db.delete(subtasks).where(eq(subtasks.id, subtaskId)).run();
  return NextResponse.json({ ok: true });
}
