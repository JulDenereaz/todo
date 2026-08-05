import useSWR, { useSWRConfig } from "swr";
import { fetcher, apiRequest } from "@/lib/fetcher";
import type { Attachment, Subtask, Task, TaskDetail, Priority } from "@/lib/types";

export function useTaskDetail(taskId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TaskDetail>(
    taskId ? `/api/tasks/${taskId}` : null,
    fetcher
  );
  const { mutate: globalMutate } = useSWRConfig();

  /** Keeps the "/api/tasks?..." list caches in sync with edits made here (in the accordion). */
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
    syncListCaches((t) => ({ ...t, ...patch }));
    const updated = await apiRequest<TaskDetail>(`/api/tasks/${taskId}`, "PATCH", patch);
    await mutate((current) => (current ? { ...current, ...updated } : current), { revalidate: false });
    syncListCaches((t) => ({ ...t, ...updated }));
  }

  async function addSubtask(title: string) {
    if (!taskId) return;
    const created = await apiRequest<Subtask>(`/api/tasks/${taskId}/subtasks`, "POST", { title });
    await mutate(
      (current) => (current ? { ...current, subtasks: [...current.subtasks, created] } : current),
      { revalidate: false }
    );
    syncListCaches((t) => ({ ...t, subtasks: [...t.subtasks, created] }));
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
      subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed } : s)),
    }));
    await apiRequest(`/api/subtasks/${subtaskId}`, "PATCH", { completed });
  }

  async function deleteSubtask(subtaskId: string) {
    await mutate(
      (current) =>
        current ? { ...current, subtasks: current.subtasks.filter((s) => s.id !== subtaskId) } : current,
      { revalidate: false }
    );
    syncListCaches((t) => ({ ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }));
    await apiRequest(`/api/subtasks/${subtaskId}`, "DELETE");
  }

  async function addTag(tagId: string) {
    if (!taskId) return;
    await apiRequest(`/api/tasks/${taskId}/tags`, "POST", { tagId });
    const updated = await mutate();
    if (updated) syncListCaches((t) => ({ ...t, tags: updated.tags }));
  }

  async function removeTag(tagId: string) {
    if (!taskId) return;
    await apiRequest(`/api/tasks/${taskId}/tags`, "DELETE", { tagId });
    const updated = await mutate();
    if (updated) syncListCaches((t) => ({ ...t, tags: updated.tags }));
  }

  async function addAttachment(input: { dataUrl: string; filename?: string | null }) {
    if (!taskId) return;
    const created = await apiRequest<Attachment>(`/api/tasks/${taskId}/attachments`, "POST", input);
    await mutate(
      (current) => (current ? { ...current, attachments: [...current.attachments, created] } : current),
      { revalidate: false }
    );
    return created;
  }

  async function removeAttachment(attachmentId: string) {
    await mutate(
      (current) =>
        current ? { ...current, attachments: current.attachments.filter((a) => a.id !== attachmentId) } : current,
      { revalidate: false }
    );
    await apiRequest(`/api/attachments/${attachmentId}`, "DELETE");
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
    addAttachment,
    removeAttachment,
  };
}

export type { Priority };
