import { sqliteTable, text, integer, index, unique, primaryKey } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // OIDC `sub`
  email: text("email").notNull(),
  name: text("name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const lists = sqliteTable(
  "lists",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    position: integer("position").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("lists_user_idx").on(t.userId)]
);

export const listMembers = sqliteTable(
  "list_members",
  {
    listId: text("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.listId, t.userId] }), index("list_members_user_idx").on(t.userId)]
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    listId: text("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    // Creator of the task; visibility is now determined by list membership, not this field.
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assigneeId: text("assignee_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    notes: text("notes"),
    priority: text("priority", { enum: ["none", "low", "medium", "high"] })
      .notNull()
      .default("none"),
    dueDate: integer("due_date", { mode: "timestamp" }),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    position: integer("position").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("tasks_user_idx").on(t.userId),
    index("tasks_list_pos_idx").on(t.listId, t.position),
    index("tasks_assignee_idx").on(t.assigneeId),
  ]
);

export const subtasks = sqliteTable(
  "subtasks",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    position: integer("position").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("subtasks_task_idx").on(t.taskId)]
);

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
  },
  (t) => [unique("tags_user_name_unique").on(t.userId, t.name)]
);

export const taskTags = sqliteTable(
  "task_tags",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.tagId] })]
);
