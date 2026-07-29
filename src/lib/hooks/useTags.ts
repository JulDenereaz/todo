import useSWR from "swr";
import { fetcher, apiRequest } from "@/lib/fetcher";
import type { TagRef } from "@/lib/types";

export function useTags() {
  const { data, error, isLoading, mutate } = useSWR<TagRef[]>("/api/tags", fetcher);

  async function createTag(name: string, color?: string) {
    const created = await apiRequest<TagRef>("/api/tags", "POST", { name, color });
    await mutate((current) => (current ? [...current, created] : [created]), { revalidate: false });
    return created;
  }

  async function deleteTag(id: string) {
    await mutate((current) => current?.filter((t) => t.id !== id), { revalidate: false });
    await apiRequest(`/api/tags/${id}`, "DELETE");
  }

  return {
    tags: data ?? [],
    error,
    isLoading,
    createTag,
    deleteTag,
  };
}
