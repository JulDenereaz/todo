"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useLists } from "@/lib/hooks/useLists";
import { useTags } from "@/lib/hooks/useTags";

function SidebarInner({ onClose, userName }: { onClose: () => void; userName: string }) {
  const { lists, createList } = useLists();
  const { tags } = useTags();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");
  const [newListName, setNewListName] = useState("");

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    const name = newListName.trim();
    if (!name) return;
    setNewListName("");
    await createList(name);
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="mb-4 truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">{userName}</div>

      <nav className="flex flex-col gap-1">
        <Link
          href="/"
          onClick={onClose}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            pathname === "/" ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          All tasks
        </Link>
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.id}`}
            onClick={onClose}
            className={`truncate rounded-md px-3 py-2 text-sm font-medium ${
              pathname === `/lists/${list.id}`
                ? "bg-zinc-100 dark:bg-zinc-800"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {list.name}
          </Link>
        ))}
      </nav>

      <form onSubmit={handleCreateList} className="mt-2">
        <input
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New list..."
          className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
        />
      </form>

      {tags.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 px-3 text-xs font-semibold uppercase text-zinc-400">Tags</div>
          <div className="flex flex-wrap gap-1.5 px-3">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={activeTag === tag.id ? pathname : `${pathname}?tag=${tag.id}`}
                onClick={onClose}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  activeTag === tag.id
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-4">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- API route, not a Next page; needs a full navigation */}
        <a
          href="/api/auth/signout"
          className="block rounded-md px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Sign out
        </a>
      </div>
    </div>
  );
}

export default function Sidebar({
  open,
  onClose,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  userName: string;
}) {
  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/30 sm:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 shrink-0 transform border-r border-zinc-200 bg-white transition-transform dark:border-zinc-800 dark:bg-zinc-900 sm:static sm:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Suspense fallback={null}>
          <SidebarInner onClose={onClose} userName={userName} />
        </Suspense>
      </aside>
    </>
  );
}
