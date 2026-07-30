import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { ActivityEntry } from "@/lib/types";

export function useActivity() {
  const { data, error, isLoading, mutate } = useSWR<ActivityEntry[]>("/api/activity", fetcher, {
    refreshInterval: 30_000,
  });
  return { activity: data ?? [], error, isLoading, mutate };
}
