import { z } from "zod";

export const priorityEnum = z.enum(["none", "low", "medium", "high"]);

export const createListSchema = z.object({
  name: z.string().trim().min(1).max(200),
  color: z.string().max(20).nullable().optional(),
});

export const updateListSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  color: z.string().max(20).nullable().optional(),
});

export const reorderSchema = z.array(
  z.object({
    id: z.string().min(1),
    position: z.number().int().min(0),
    listId: z.string().min(1).optional(),
  })
);

export const createTaskSchema = z.object({
  listId: z.string().min(1),
  title: z.string().trim().min(1).max(500),
  notes: z.string().max(10000).nullable().optional(),
  priority: priorityEnum.optional(),
  dueDate: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  listId: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(500).optional(),
  notes: z.string().max(10000).nullable().optional(),
  priority: priorityEnum.optional(),
  dueDate: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});

export const createSubtaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
});

export const updateSubtaskSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  completed: z.boolean().optional(),
});

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(100),
  color: z.string().max(20).nullable().optional(),
});

export const updateTagSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  color: z.string().max(20).nullable().optional(),
});

export const taskTagBodySchema = z.object({
  tagId: z.string().min(1),
});

/** Returns undefined (not provided), null (explicit clear), a Date, or "invalid". */
export function parseOptionalDueDate(
  value: string | null | undefined
): Date | null | undefined | "invalid" {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? "invalid" : d;
}
