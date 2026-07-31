import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { ActivityPage } from "@/lib/types";

export function useActivity({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number } = {}) {
  const { data, error, isLoading, mutate } = useSWR<ActivityPage>(
    `/api/activity?page=${page}&pageSize=${pageSize}`,
    fetcher,
    { refreshInterval: 30_000 }
  );
  return {
    activity: data?.entries ?? [],
    total: data?.total ?? 0,
    page,
    pageSize,
    error,
    isLoading,
    mutate,
  };
}
