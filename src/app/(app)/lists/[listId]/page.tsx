"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import TaskBoard from "@/components/TaskBoard";

function ListInner({ listId }: { listId: string }) {
  const searchParams = useSearchParams();
  const tagId = searchParams.get("tag") ?? undefined;
  return <TaskBoard listId={listId} tagId={tagId} />;
}

export default function ListPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = use(params);
  return (
    <Suspense fallback={null}>
      <ListInner listId={listId} />
    </Suspense>
  );
}
