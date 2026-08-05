"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTaskDetail } from "@/lib/hooks/useTaskDetail";
import { useTags } from "@/lib/hooks/useTags";
import { useLists } from "@/lib/hooks/useLists";
import SubtaskList from "./SubtaskList";
import AttachmentList from "./AttachmentList";
import { formatUserLabel } from "@/lib/format";
import { chipStyle } from "@/lib/colorStyle";
import { resizeImageForAttachment } from "@/lib/attachmentImage";
import type { Priority } from "@/lib/types";

export default function TaskDetailAccordion({ taskId }: { taskId: string }) {
  const t = useTranslations("TaskDetailAccordion");
  const {
    task,
    update,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addTag,
    removeTag,
    addAttachment,
    removeAttachment,
  } = useTaskDetail(taskId);
  const { tags, createTag } = useTags();
  const { lists } = useLists();
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  if (!task) {
    return (
      <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-4 dark:border-zinc-800 dark:bg-zinc-950/40">
        <p className="text-sm text-zinc-400">{t("loading")}</p>
      </div>
    );
  }

  const availableTags = tags.filter((tg) => !task.tags.some((tt) => tt.id === tg.id));
  const list = lists.find((l) => l.id === task.listId);
  const assignableMembers = list?.members ?? [];

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    const name = newTagName.trim();
    if (!name) return;
    setNewTagName("");
    const tag = await createTag(name);
    await addTag(tag.id);
  }

  function handleListChange(newListId: string, currentAssigneeId: string | null) {
    const newList = lists.find((l) => l.id === newListId);
    const assigneeStillValid = !currentAssigneeId || newList?.members.some((m) => m.id === currentAssigneeId);
    update({ listId: newListId, ...(currentAssigneeId && !assigneeStillValid ? { assigneeId: null } : {}) });
  }

  async function handleAddImage(file: File) {
    if (!file.type.startsWith("image/")) {
      setAttachmentError(t("notAnImage"));
      return;
    }
    setAttachmentError(null);
    try {
      const { dataUrl } = await resizeImageForAttachment(file);
      await addAttachment({ dataUrl, filename: file.name || null });
    } catch {
      setAttachmentError(t("attachmentFailed"));
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    const file = item?.getAsFile();
    if (!file) return;
    e.preventDefault();
    void handleAddImage(file);
  }

  return (
    <div
      className="flex flex-col gap-4 border-t border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40"
      onClick={(e) => e.stopPropagation()}
      onPaste={handlePaste}
    >
      <input
        value={task.title}
        onChange={(e) => update({ title: e.target.value })}
        className="bg-transparent text-base font-semibold outline-none"
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-1.5">
          <span className="text-zinc-400">{t("list")}</span>
          <select
            value={task.listId}
            onChange={(e) => handleListChange(e.target.value, task.assigneeId)}
            className="rounded-md border border-zinc-200 bg-transparent px-2 py-1 dark:border-zinc-700"
          >
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5">
          <span className="text-zinc-400">{t("priority")}</span>
          <select
            value={task.priority}
            onChange={(e) => update({ priority: e.target.value as Priority })}
            className="rounded-md border border-zinc-200 bg-transparent px-2 py-1 dark:border-zinc-700"
          >
            <option value="none">{t("priorityNone")}</option>
            <option value="low">{t("priorityLow")}</option>
            <option value="medium">{t("priorityMedium")}</option>
            <option value="high">{t("priorityHigh")}</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5">
          <span className="text-zinc-400">{t("due")}</span>
          <input
            type="date"
            value={task.dueDate ? task.dueDate.slice(0, 10) : ""}
            onChange={(e) => update({ dueDate: e.target.value || null })}
            className="rounded-md border border-zinc-200 bg-transparent px-2 py-1 dark:border-zinc-700"
          />
        </label>

        <label className="flex items-center gap-1.5">
          <span className="text-zinc-400">{t("assignee")}</span>
          <select
            value={task.assigneeId ?? ""}
            onChange={(e) => update({ assigneeId: e.target.value || null })}
            className="rounded-md border border-zinc-200 bg-transparent px-2 py-1 dark:border-zinc-700"
          >
            <option value="">{t("unassigned")}</option>
            {assignableMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {formatUserLabel(m)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase text-zinc-400">{t("notes")}</div>
        <textarea
          value={notesDraft ?? task.notes ?? ""}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={() => {
            if (notesDraft !== null) update({ notes: notesDraft || null });
            setNotesDraft(null);
          }}
          rows={4}
          placeholder={t("notesPlaceholder")}
          className="w-full rounded-md border border-zinc-200 bg-transparent p-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
        />
      </div>

      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase text-zinc-400">{t("tags")}</div>
        <div className="flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => removeTag(tag.id)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                !tag.color ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : ""
              }`}
              style={chipStyle(tag.color)}
            >
              {tag.name} ✕
            </button>
          ))}
          {availableTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => addTag(tag.id)}
              className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {tag.color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />}
              {`+ ${tag.name}`}
            </button>
          ))}
        </div>
        <form onSubmit={handleCreateTag} className="mt-2 flex gap-1.5">
          <input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder={t("newTagPlaceholder")}
            className="flex-1 rounded-md border border-zinc-200 bg-transparent px-2 py-1 text-xs outline-none dark:border-zinc-700"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {t("add")}
          </button>
        </form>
      </div>

      <AttachmentList
        attachments={task.attachments}
        onAddFile={handleAddImage}
        onRemove={removeAttachment}
        error={attachmentError}
      />

      <SubtaskList
        subtasks={task.subtasks}
        onAdd={addSubtask}
        onToggle={toggleSubtask}
        onDelete={deleteSubtask}
      />
    </div>
  );
}
