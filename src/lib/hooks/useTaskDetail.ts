import useSWR from "swr";
import { fetcher, apiRequest } from "@/lib/fetcher";
import type { Subtask, TaskDetail, Priority } from "@/lib/types";

export function useTaskDetail(taskId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TaskDetail>(
    taskId ? `/api/tasks/${taskId}` : null,
    fetcher
  );

  async function update(
    patch: Partial<Pick<TaskDetail, "title" | "notes" | "priority" | "dueDate" | "completed" | "listId">>
  ) {
    if (!taskId) return;
    await mutate((current) => (current ? { ...current, ...patch } : current), { revalidate: false });
    const updated = await apiRequest<TaskDetail>(`/api/tasks/${taskId}`, "PATCH", patch);
    await mutate((current) => (current ? { ...current, ...updated } : current), { revalidate: false });
  }

  async function addSubtask(title: string) {
    if (!taskId) return;
    const created = await apiRequest<Subtask>(`/api/tasks/${taskId}/subtasks`, "POST", { title });
    await mutate(
      (current) => (current ? { ...current, subtasks: [...current.subtasks, created] } : current),
      { revalidate: false }
    );
  }

  async function toggleSubtask(subtaskId: string, completed: boolean) {
    await mutate(
      (current) =>
        current
          ? { ...current, subtasks: current.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed } : s)) }
          : current,
      { revalidate: false }
    );
    await apiRequest(`/api/subtasks/${subtaskId}`, "PATCH", { completed });
  }

  async function deleteSubtask(subtaskId: string) {
    await mutate(
      (current) =>
        current ? { ...current, subtasks: current.subtasks.filter((s) => s.id !== subtaskId) } : current,
      { revalidate: false }
    );
    await apiRequest(`/api/subtasks/${subtaskId}`, "DELETE");
  }

  async function addTag(tagId: string) {
    if (!taskId) return;
    await apiRequest(`/api/tasks/${taskId}/tags`, "POST", { tagId });
    await mutate();
  }

  async function removeTag(tagId: string) {
    if (!taskId) return;
    await apiRequest(`/api/tasks/${taskId}/tags`, "DELETE", { tagId });
    await mutate();
  }

  return {
    task: data,
    error,
    isLoading,
    update,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addTag,
    removeTag,
  };
}

export type { Priority };
