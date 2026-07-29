"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TaskBoard from "@/components/TaskBoard";

function AllTasksInner() {
  const searchParams = useSearchParams();
  const tagId = searchParams.get("tag") ?? undefined;
  return <TaskBoard tagId={tagId} />;
}

export default function AllTasksPage() {
  return (
    <Suspense fallback={null}>
      <AllTasksInner />
    </Suspense>
  );
}
