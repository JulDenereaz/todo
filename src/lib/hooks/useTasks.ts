import useSWR from "swr";
import { fetcher, apiRequest } from "@/lib/fetcher";
import type { Task } from "@/lib/types";

export function useTasks(params: { listId?: string; tagId?: string }) {
  const query = new URLSearchParams();
  if (params.listId) query.set("listId", params.listId);
  if (params.tagId) query.set("tagId", params.tagId);
  const key = `/api/tasks?${query.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<Task[]>(key, fetcher);

  async function createTask(input: { listId: string; title: string }) {
    const created = await apiRequest<Task>("/api/tasks", "POST", input);
    await mutate((current) => (current ? [...current, created] : [created]), { revalidate: false });
    return created;
  }

  async function toggleComplete(task: Task) {
    const nextCompleted = !task.completed;
    await mutate(
      (current) => current?.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t)),
      { revalidate: false }
    );
    await apiRequest(`/api/tasks/${task.id}`, "PATCH", { completed: nextCompleted });
  }

  async function deleteTask(id: string) {
    await mutate((current) => current?.filter((t) => t.id !== id), { revalidate: false });
    await apiRequest(`/api/tasks/${id}`, "DELETE");
  }

  async function reorderTasks(items: { id: string; position: number; listId?: string }[]) {
    await mutate(
      (current) => {
        if (!current) return current;
        const updated = current.map((t) => {
          const item = items.find((i) => i.id === t.id);
          return item ? { ...t, position: item.position, listId: item.listId ?? t.listId } : t;
        });
        return updated.sort((a, b) => a.position - b.position);
      },
      { revalidate: false }
    );
    await apiRequest("/api/tasks/reorder", "PATCH", items);
  }

  return {
    tasks: data ?? [],
    error,
    isLoading,
    createTask,
    toggleComplete,
    deleteTask,
    reorderTasks,
  };
}
