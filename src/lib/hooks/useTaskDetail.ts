import useSWR, { useSWRConfig } from "swr";
import { fetcher, apiRequest } from "@/lib/fetcher";
import type { Subtask, Task, TaskDetail, Priority } from "@/lib/types";

export function useTaskDetail(taskId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TaskDetail>(
    taskId ? `/api/tasks/${taskId}` : null,
    fetcher
  );
  const { mutate: globalMutate } = useSWRConfig();

  /** Keeps the "/api/tasks?..." list caches' subtask badges in sync with edits made here. */
  function syncListCaches(updater: (task: Task) => Task) {
    if (!taskId) return;
    globalMutate(
      (key) => typeof key === "string" && key.startsWith("/api/tasks?"),
      (current: Task[] | undefined) => current?.map((t) => (t.id === taskId ? updater(t) : t)),
      { revalidate: false }
    );
  }

  async function update(
    patch: Partial<
      Pick<TaskDetail, "title" | "notes" | "priority" | "dueDate" | "completed" | "listId" | "assigneeId">
    >
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
    syncListCaches((t) => ({ ...t, subtaskCount: t.subtaskCount + 1 }));
  }

  async function toggleSubtask(subtaskId: string, completed: boolean) {
    await mutate(
      (current) =>
        current
          ? { ...current, subtasks: current.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed } : s)) }
          : current,
      { revalidate: false }
    );
    syncListCaches((t) => ({
      ...t,
      subtaskDoneCount: t.subtaskDoneCount + (completed ? 1 : -1),
    }));
    await apiRequest(`/api/subtasks/${subtaskId}`, "PATCH", { completed });
  }

  async function deleteSubtask(subtaskId: string) {
    const removed = data?.subtasks.find((s) => s.id === subtaskId);
    await mutate(
      (current) =>
        current ? { ...current, subtasks: current.subtasks.filter((s) => s.id !== subtaskId) } : current,
      { revalidate: false }
    );
    syncListCaches((t) => ({
      ...t,
      subtaskCount: t.subtaskCount - 1,
      subtaskDoneCount: removed?.completed ? t.subtaskDoneCount - 1 : t.subtaskDoneCount,
    }));
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
