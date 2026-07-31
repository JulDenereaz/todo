import useSWR from "swr";
import { fetcher, apiRequest } from "@/lib/fetcher";
import type { Profile } from "@/lib/types";

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR<Profile>("/api/users/me", fetcher);

  async function updateAvatar(avatarUrl: string | null) {
    await mutate((current) => (current ? { ...current, avatarUrl } : current), { revalidate: false });
    const updated = await apiRequest<Profile>("/api/users/me", "PATCH", { avatarUrl });
    await mutate(updated, { revalidate: false });
  }

  async function deleteAccount() {
    await apiRequest("/api/users/me", "DELETE");
  }

  return {
    profile: data,
    error,
    isLoading,
    updateAvatar,
    deleteAccount,
  };
}
