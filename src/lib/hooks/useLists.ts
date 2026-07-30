import useSWR from "swr";
import { fetcher, apiRequest } from "@/lib/fetcher";
import type { List, UserRef } from "@/lib/types";

export function useLists() {
  const { data, error, isLoading, mutate } = useSWR<List[]>("/api/lists", fetcher);

  async function createList(name: string) {
    const created = await apiRequest<List>("/api/lists", "POST", { name });
    await mutate((current) => (current ? [...current, created] : [created]), { revalidate: false });
    return created;
  }

  async function renameList(id: string, name: string) {
    await mutate(
      (current) => current?.map((l) => (l.id === id ? { ...l, name } : l)),
      { revalidate: false }
    );
    await apiRequest(`/api/lists/${id}`, "PATCH", { name });
  }

  async function deleteList(id: string) {
    await mutate((current) => current?.filter((l) => l.id !== id), { revalidate: false });
    await apiRequest(`/api/lists/${id}`, "DELETE");
  }

  async function reorderLists(items: { id: string; position: number }[]) {
    await mutate(
      (current) =>
        current
          ?.map((l) => {
            const item = items.find((i) => i.id === l.id);
            return item ? { ...l, position: item.position } : l;
          })
          .sort((a, b) => a.position - b.position),
      { revalidate: false }
    );
    await apiRequest("/api/lists/reorder", "PATCH", items);
  }

  async function addMember(listId: string, email: string) {
    const members = await apiRequest<UserRef[]>(`/api/lists/${listId}/members`, "POST", { email });
    await mutate(
      (current) => current?.map((l) => (l.id === listId ? { ...l, members } : l)),
      { revalidate: false }
    );
  }

  async function removeMember(listId: string, userId: string) {
    await mutate(
      (current) =>
        current?.map((l) => (l.id === listId ? { ...l, members: l.members.filter((m) => m.id !== userId) } : l)),
      { revalidate: false }
    );
    await apiRequest(`/api/lists/${listId}/members/${userId}`, "DELETE");
  }

  return {
    lists: data ?? [],
    error,
    isLoading,
    createList,
    renameList,
    deleteList,
    reorderLists,
    addMember,
    removeMember,
  };
}
