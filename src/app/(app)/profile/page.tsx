"use client";

import ProfileSettings from "@/components/ProfileSettings";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-4 text-xl font-semibold">Profile</h1>
      <ProfileSettings />
    </div>
  );
}
