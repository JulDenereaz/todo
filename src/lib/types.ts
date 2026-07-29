export type Priority = "none" | "low" | "medium" | "high";

export interface TagRef {
  id: string;
  name: string;
  color: string | null;
}

export interface List {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
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
}

export interface TaskDetail extends Task {
  subtasks: Subtask[];
}
