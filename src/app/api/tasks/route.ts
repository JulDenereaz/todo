import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lists, tasks, taskTags } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { unauthorized, badRequest } from "@/lib/api-helpers";
import { createTaskSchema, parseOptionalDueDate } from "@/lib/validation";
import { attachTags, replaceTaskTags } from "@/lib/tasks";

export async function GET(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const listId = searchParams.get("listId");
  const tagId = searchParams.get("tagId");

  let rows;
  if (tagId) {
    rows = db
      .select({ task: tasks })
      .from(tasks)
      .innerJoin(taskTags, eq(taskTags.taskId, tasks.id))
      .where(
        and(eq(tasks.userId, userId), eq(taskTags.tagId, tagId), listId ? eq(tasks.listId, listId) : undefined)
      )
      .orderBy(asc(tasks.position))
      .all()
      .map((r) => r.task);
  } else {
    rows = db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), listId ? eq(tasks.listId, listId) : undefined))
      .orderBy(asc(tasks.position))
      .all();
  }

  return NextResponse.json(attachTags(rows));
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const parsed = createTaskSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.message);

  const [list] = db
    .select()
    .from(lists)
    .where(and(eq(lists.id, parsed.data.listId), eq(lists.userId, userId)))
    .all();
  if (!list) return badRequest("Invalid listId");

  const dueDate = parseOptionalDueDate(parsed.data.dueDate);
  if (dueDate === "invalid") return badRequest("Invalid dueDate");

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

  const [row] = db.select().from(tasks).where(eq(tasks.id, id)).all();
  return NextResponse.json(attachTags([row])[0], { status: 201 });
}
