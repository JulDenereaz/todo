"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useLists } from "@/lib/hooks/useLists";
import { useTags } from "@/lib/hooks/useTags";
import { useProfile } from "@/lib/hooks/useProfile";
import SidebarListItem from "./SidebarListItem";
import TagSettings from "./TagSettings";
import ThemeToggle from "./ThemeToggle";
import Avatar from "./Avatar";
import { PencilIcon, GearIcon } from "./icons";

function SidebarInner({ onClose, userName }: { onClose: () => void; userName: string }) {
  const t = useTranslations("Sidebar");
  const { lists, createList, updateList, deleteList, reorderLists, addMember, removeMember } = useLists();
  const { tags, updateTag, deleteTag } = useTags();
  const { profile } = useProfile();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");
  const [newListName, setNewListName] = useState("");
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);
  const [openTagSettingsId, setOpenTagSettingsId] = useState<string | null>(null);

  const [items, setItems] = useState(lists);
  useEffect(() => setItems(lists), [lists]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((l) => l.id === active.id);
    const newIndex = items.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    reorderLists(reordered.map((l, i) => ({ id: l.id, position: i })));
  }

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    const name = newListName.trim();
    if (!name) return;
    setNewListName("");
    await createList(name);
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="mb-4 flex items-center gap-2">
        <Avatar name={profile?.name ?? userName} email={profile?.email ?? ""} avatarUrl={profile?.avatarUrl} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {userName}
        </span>
        <Link
          href="/profile"
          onClick={onClose}
          aria-label={t("profileSettings")}
          className={`shrink-0 rounded p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
            pathname === "/profile" ? "bg-zinc-100 dark:bg-zinc-800" : ""
          }`}
        >
          <GearIcon className="h-4 w-4" />
        </Link>
      </div>

      <nav className="flex flex-col gap-1">
        <Link
          href="/"
          onClick={onClose}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            pathname === "/" ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          {t("allTasks")}
        </Link>
        <Link
          href="/activity"
          onClick={onClose}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            pathname === "/activity" ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          {t("activity")}
        </Link>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            {items.map((list) => (
              <SidebarListItem
                key={list.id}
                list={list}
                active={pathname === `/lists/${list.id}`}
                settingsOpen={openSettingsId === list.id}
                onToggleSettings={() => setOpenSettingsId(openSettingsId === list.id ? null : list.id)}
                onClose={onClose}
                onRename={(name) => updateList(list.id, { name })}
                onColorChange={(color) => updateList(list.id, { color })}
                onDelete={() => {
                  setOpenSettingsId(null);
                  deleteList(list.id);
                }}
                onAddMember={(email) => addMember(list.id, email)}
                onRemoveMember={(userId) => removeMember(list.id, userId)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </nav>

      <form onSubmit={handleCreateList} className="mt-2">
        <input
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder={t("newListPlaceholder")}
          className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
        />
      </form>

      {tags.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 px-3 text-xs font-semibold uppercase text-zinc-400">{t("tags")}</div>
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
                    aria-label={t("editTag", { name: tag.name })}
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
          {t("signOut")}
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
