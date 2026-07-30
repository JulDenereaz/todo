import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { lists, listMembers, users } from "@/db/schema";
import type { UserRef } from "@/lib/types";

/** All list ids the user can see: lists they created plus lists they were added to. */
export function getAccessibleListIds(userId: string): string[] {
  const owned = db.select({ id: lists.id }).from(lists).where(eq(lists.userId, userId)).all();
  const member = db
    .select({ id: listMembers.listId })
    .from(listMembers)
    .where(eq(listMembers.userId, userId))
    .all();
  return [...new Set([...owned.map((r) => r.id), ...member.map((r) => r.id)])];
}

export function canAccessList(userId: string, listId: string): boolean {
  const [owned] = db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, userId)))
    .all();
  if (owned) return true;

  const [member] = db
    .select({ listId: listMembers.listId })
    .from(listMembers)
    .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)))
    .all();
  return !!member;
}

/** Owner + members of a list, deduped, as user refs. Empty array if the list doesn't exist. */
export function getListMembers(listId: string): UserRef[] {
  const [list] = db.select({ userId: lists.userId }).from(lists).where(eq(lists.id, listId)).all();
  if (!list) return [];

  const [owner] = db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, list.userId))
    .all();
  const memberRows = db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(listMembers)
    .innerJoin(users, eq(users.id, listMembers.userId))
    .where(eq(listMembers.listId, listId))
    .all();

  const seen = new Set<string>();
  const all: UserRef[] = [];
  for (const u of owner ? [owner, ...memberRows] : memberRows) {
    if (seen.has(u.id)) continue;
    seen.add(u.id);
    all.push(u);
  }
  return all;
}

export function attachMembers<T extends { id: string }>(listRows: T[]): (T & { members: UserRef[] })[] {
  return listRows.map((list) => ({ ...list, members: getListMembers(list.id) }));
}

export function getListsByIds(listIds: string[]) {
  if (listIds.length === 0) return [];
  return db.select().from(lists).where(inArray(lists.id, listIds)).all();
}
