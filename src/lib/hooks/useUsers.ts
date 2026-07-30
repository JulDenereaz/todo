import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { UserRef } from "@/lib/types";

export function useUsers() {
  const { data, error, isLoading } = useSWR<UserRef[]>("/api/users", fetcher);
  return { users: data ?? [], error, isLoading };
}
