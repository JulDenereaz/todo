import { NextRequest, NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { subtasks, tasks } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, notFound, badRequest } from "@/lib/api-helpers";
import { createSubtaskSchema } from "@/lib/validation";
import { canAccessList } from "@/lib/lists";

function getAccessibleTask(taskId: string, userId: string) {
  const [task] = db.select({ id: tasks.id, listId: tasks.listId }).from(tasks).where(eq(tasks.id, taskId)).all();
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

  const rows = db.select().from(subtasks).where(eq(subtasks.taskId, taskId)).orderBy(asc(subtasks.position)).all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { taskId } = await params;

  const task = getAccessibleTask(taskId, userId);
  if (!task) return notFound();

  const parsed = createSubtaskSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.message);

  const last = db
    .select({ position: subtasks.position })
    .from(subtasks)
    .where(eq(subtasks.taskId, taskId))
    .orderBy(desc(subtasks.position))
    .limit(1)
    .all();
  const nextPosition = last.length > 0 ? last[0].position + 1 : 0;

  const id = crypto.randomUUID();
  db.insert(subtasks)
    .values({ id, taskId, title: parsed.data.title, position: nextPosition, createdAt: new Date() })
    .run();

  const [row] = db.select().from(subtasks).where(eq(subtasks.id, id)).all();
  return NextResponse.json(row, { status: 201 });
}
