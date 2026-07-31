export type Priority = "none" | "low" | "medium" | "high";

export interface TagRef {
  id: string;
  name: string;
  color: string | null;
}

export interface UserRef {
  id: string;
  email: string;
  name: string | null;
}

export interface List {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  members: UserRef[];
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
}

export interface Task {
  id: string;
  listId: string;
  userId: string;
  assigneeId: string | null;
  assignee: UserRef | null;
  title: string;
  notes: string | null;
  priority: Priority;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  tags: TagRef[];
  subtasks: Subtask[];
}

/** Same shape as Task — separate name kept for call-site clarity in the task-detail hook/UI. */
export type TaskDetail = Task;

export type ActivityType =
  | "task_created"
  | "task_updated"
  | "task_deleted"
  | "member_added"
  | "member_removed"
  | "list_renamed";

export interface ActivityEntry {
  id: string;
  listId: string;
  listName: string;
  taskId: string | null;
  type: ActivityType;
  summary: string;
  actor: UserRef | null;
  createdAt: string;
}

export interface ActivityPage {
  entries: ActivityEntry[];
  total: number;
  page: number;
  pageSize: number;
}
