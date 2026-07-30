import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { activity, lists, users } from "@/db/schema";
import type { ActivityEntry, ActivityType, UserRef } from "@/lib/types";

/** Short name-or-email label for embedding in a feed sentence (no parenthetical). */
export function shortUserLabel(user: Pick<UserRef, "name" | "email">): string {
  return user.name || user.email || "Unknown user";
}

export function logActivity(params: {
  listId: string;
  taskId?: string | null;
  actorId: string;
  type: ActivityType;
  summary: string;
}) {
  db.insert(activity)
    .values({
      id: crypto.randomUUID(),
      listId: params.listId,
      taskId: params.taskId ?? null,
      actorId: params.actorId,
      type: params.type,
      summary: params.summary,
      createdAt: new Date(),
    })
    .run();
}

export function getActivityFeed(listIds: string[], limit = 100): ActivityEntry[] {
  if (listIds.length === 0) return [];

  const rows = db
    .select({
      id: activity.id,
      listId: activity.listId,
      listName: lists.name,
      taskId: activity.taskId,
      type: activity.type,
      summary: activity.summary,
      createdAt: activity.createdAt,
      actorId: users.id,
      actorEmail: users.email,
      actorName: users.name,
    })
    .from(activity)
    .innerJoin(lists, eq(lists.id, activity.listId))
    .leftJoin(users, eq(users.id, activity.actorId))
    .where(inArray(activity.listId, listIds))
    .orderBy(desc(activity.createdAt))
    .limit(limit)
    .all();

  return rows.map((r) => ({
    id: r.id,
    listId: r.listId,
    listName: r.listName,
    taskId: r.taskId,
    type: r.type as ActivityType,
    summary: r.summary,
    actor: r.actorId ? { id: r.actorId, email: r.actorEmail as string, name: r.actorName } : null,
    createdAt: r.createdAt.toISOString(),
  }));
}
