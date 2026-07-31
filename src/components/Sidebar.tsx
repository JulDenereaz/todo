"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useLists } from "@/lib/hooks/useLists";
import { useTags } from "@/lib/hooks/useTags";
import ListSettings from "./ListSettings";
import TagSettings from "./TagSettings";
import ThemeToggle from "./ThemeToggle";
import { PencilIcon } from "./icons";

function SidebarInner({ onClose, userName }: { onClose: () => void; userName: string }) {
  const { lists, createList, updateList, deleteList, addMember, removeMember } = useLists();
  const { tags, updateTag, deleteTag } = useTags();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");
  const [newListName, setNewListName] = useState("");
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);
  const [openTagSettingsId, setOpenTagSettingsId] = useState<string | null>(null);

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
        <Link
          href="/activity"
          onClick={onClose}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            pathname === "/activity" ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          Activity
        </Link>
        {lists.map((list) => (
          <div key={list.id}>
            <div
              className={`flex items-center gap-1 rounded-md pr-1 ${
                pathname === `/lists/${list.id}` ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Link
                href={`/lists/${list.id}`}
                onClick={onClose}
                className="flex flex-1 items-center gap-2 truncate px-3 py-2 text-sm font-medium"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: list.color ?? "#a1a1aa" }}
                />
                <span className="truncate">
                  {list.name}
                  {list.members.length > 1 && (
                    <span className="ml-1.5 text-xs font-normal text-zinc-400">{list.members.length}</span>
                  )}
                </span>
              </Link>
              <button
                onClick={() => setOpenSettingsId(openSettingsId === list.id ? null : list.id)}
                aria-label={`Edit ${list.name}`}
                aria-expanded={openSettingsId === list.id}
                className="shrink-0 rounded p-1.5 text-amber-500 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </div>
            {openSettingsId === list.id && (
              <ListSettings
                list={list}
                onRename={(name) => updateList(list.id, { name })}
                onColorChange={(color) => updateList(list.id, { color })}
                onDelete={() => {
                  setOpenSettingsId(null);
                  deleteList(list.id);
                }}
                onAddMember={(email) => addMember(list.id, email)}
                onRemoveMember={(userId) => removeMember(list.id, userId)}
              />
            )}
          </div>
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
          <div className="flex flex-col gap-0.5">
            {tags.map((tag) => (
              <div key={tag.id}>
                <div
                  className={`flex items-center gap-1 rounded-md pr-1 ${
                    activeTag === tag.id ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Link
                    href={activeTag === tag.id ? pathname : `${pathname}?tag=${tag.id}`}
                    onClick={onClose}
                    className="flex flex-1 items-center gap-2 truncate px-3 py-1.5 text-sm"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: tag.color ?? "#a1a1aa" }}
                    />
                    <span className="truncate">{tag.name}</span>
                  </Link>
                  <button
                    onClick={() => setOpenTagSettingsId(openTagSettingsId === tag.id ? null : tag.id)}
                    aria-label={`Edit ${tag.name}`}
                    aria-expanded={openTagSettingsId === tag.id}
                    className="shrink-0 rounded p-1.5 text-amber-500 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </div>
                {openTagSettingsId === tag.id && (
                  <TagSettings
                    tag={tag}
                    onRename={(name) => updateTag(tag.id, { name })}
                    onColorChange={(color) => updateTag(tag.id, { color })}
                    onDelete={() => {
                      setOpenTagSettingsId(null);
                      deleteTag(tag.id);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <ThemeToggle />
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
