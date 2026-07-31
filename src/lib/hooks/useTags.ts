import useSWR, { useSWRConfig } from "swr";
import { fetcher, apiRequest } from "@/lib/fetcher";
import type { TagRef } from "@/lib/types";

export function useTags() {
  const { data, error, isLoading, mutate } = useSWR<TagRef[]>("/api/tags", fetcher);
  const { mutate: globalMutate } = useSWRConfig();

  /** Task lists/details embed a copy of each tag (name/color) from the join at fetch time — refetch them so renames/recolors/deletes show up without a manual page refresh. */
  function revalidateTasks() {
    return globalMutate((key) => typeof key === "string" && key.startsWith("/api/tasks"));
  }

  async function createTag(name: string, color?: string) {
    const created = await apiRequest<TagRef>("/api/tags", "POST", { name, color });
    await mutate((current) => (current ? [...current, created] : [created]), { revalidate: false });
    return created;
  }

  async function updateTag(id: string, patch: { name?: string; color?: string | null }) {
    await mutate(
      (current) => current?.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      { revalidate: false }
    );
    await apiRequest(`/api/tags/${id}`, "PATCH", patch);
    await revalidateTasks();
  }

  async function deleteTag(id: string) {
    await mutate((current) => current?.filter((t) => t.id !== id), { revalidate: false });
    await apiRequest(`/api/tags/${id}`, "DELETE");
    await revalidateTasks();
  }

  return {
    tags: data ?? [],
    error,
    isLoading,
    createTag,
    updateTag,
    deleteTag,
  };
}
