import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { subtasks, tags, taskTags, users } from "@/db/schema";
import type { UserRef } from "@/lib/types";

type TagRef = { id: string; name: string; color: string | null };

export function attachTags<T extends { id: string }>(taskRows: T[]): (T & { tags: TagRef[] })[] {
  if (taskRows.length === 0) return [];
  const ids = taskRows.map((t) => t.id);
  const rows = db
    .select({ taskId: taskTags.taskId, id: tags.id, name: tags.name, color: tags.color })
    .from(taskTags)
    .innerJoin(tags, eq(tags.id, taskTags.tagId))
    .where(inArray(taskTags.taskId, ids))
    .all();

  const byTask = new Map<string, TagRef[]>();
  for (const row of rows) {
    const list = byTask.get(row.taskId) ?? [];
    list.push({ id: row.id, name: row.name, color: row.color });
    byTask.set(row.taskId, list);
  }

  return taskRows.map((task) => ({ ...task, tags: byTask.get(task.id) ?? [] }));
}

/** Replaces a task's tag set. Returns false if any tagId doesn't belong to the user. */
export function replaceTaskTags(taskId: string, userId: string, tagIds: string[]): boolean {
  if (tagIds.length > 0) {
    const owned = db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.userId, userId), inArray(tags.id, tagIds)))
      .all();
    if (owned.length !== tagIds.length) return false;
  }

  db.delete(taskTags).where(eq(taskTags.taskId, taskId)).run();
  if (tagIds.length > 0) {
    db.insert(taskTags)
      .values(tagIds.map((tagId) => ({ taskId, tagId })))
      .run();
  }
  return true;
}

export function attachAssignees<T extends { id: string; assigneeId: string | null }>(
  taskRows: T[]
): (T & { assignee: UserRef | null })[] {
  const assigneeIds = [...new Set(taskRows.map((t) => t.assigneeId).filter((v): v is string => !!v))];
  if (assigneeIds.length === 0) return taskRows.map((t) => ({ ...t, assignee: null }));

  const rows = db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(inArray(users.id, assigneeIds))
    .all();
  const byId = new Map(rows.map((u) => [u.id, u]));
  return taskRows.map((t) => ({ ...t, assignee: t.assigneeId ? (byId.get(t.assigneeId) ?? null) : null }));
}

export function attachSubtaskCounts<T extends { id: string }>(
  taskRows: T[]
): (T & { subtaskCount: number; subtaskDoneCount: number })[] {
  if (taskRows.length === 0) return [];

  const ids = taskRows.map((t) => t.id);
  const rows = db
    .select({ taskId: subtasks.taskId, completed: subtasks.completed })
    .from(subtasks)
    .where(inArray(subtasks.taskId, ids))
    .all();

  const counts = new Map<string, { total: number; done: number }>();
  for (const row of rows) {
    const c = counts.get(row.taskId) ?? { total: 0, done: 0 };
    c.total += 1;
    if (row.completed) c.done += 1;
    counts.set(row.taskId, c);
  }

  return taskRows.map((t) => ({
    ...t,
    subtaskCount: counts.get(t.id)?.total ?? 0,
    subtaskDoneCount: counts.get(t.id)?.done ?? 0,
  }));
}
