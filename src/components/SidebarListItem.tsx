"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import type { List } from "@/lib/types";
import ListSettings from "./ListSettings";
import { PencilIcon } from "./icons";

export default function SidebarListItem({
  list,
  active,
  settingsOpen,
  onToggleSettings,
  onClose,
  onRename,
  onColorChange,
  onDelete,
  onAddMember,
  onRemoveMember,
}: {
  list: List;
  active: boolean;
  settingsOpen: boolean;
  onToggleSettings: () => void;
  onClose: () => void;
  onRename: (name: string) => void;
  onColorChange: (color: string | null) => void;
  onDelete: () => void;
  onAddMember: (userId: string) => Promise<void>;
  onRemoveMember: (userId: string) => void;
}) {
  const t = useTranslations("Sidebar");
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({ id: list.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`flex items-center gap-1 rounded-md pr-1 ${
          active ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none px-1 text-zinc-300 dark:text-zinc-600"
          aria-label={t("dragToReorder", { name: list.name })}
        >
          ⠿
        </button>
        <Link
          href={`/lists/${list.id}`}
          onClick={onClose}
          className="flex flex-1 items-center gap-2 truncate py-2 text-sm font-medium"
        >
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: list.color ?? "#a1a1aa" }} />
          <span className="truncate">
            {list.name}
            {list.members.length > 1 && (
              <span className="ml-1.5 text-xs font-normal text-zinc-400">{list.members.length}</span>
            )}
          </span>
        </Link>
        <button
          onClick={onToggleSettings}
          aria-label={t("editList", { name: list.name })}
          aria-expanded={settingsOpen}
          className="shrink-0 rounded p-1.5 text-amber-500 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      </div>
      {settingsOpen && (
        <ListSettings
          list={list}
          onRename={onRename}
          onColorChange={onColorChange}
          onDelete={onDelete}
          onAddMember={onAddMember}
          onRemoveMember={onRemoveMember}
        />
      )}
    </div>
  );
}
