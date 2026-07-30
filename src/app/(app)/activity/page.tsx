"use client";

import ActivityFeed from "@/components/ActivityFeed";

export default function ActivityPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-4 text-xl font-semibold">Activity</h1>
      <ActivityFeed />
    </div>
  );
}
