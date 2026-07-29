"use client";

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import type { Task } from "@/lib/types";
import TaskRow from "./TaskRow";

export default function TaskList({
  tasks,
  onToggle,
  onDelete,
  onReorder,
}: {
  tasks: Task[];
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  onReorder?: (items: { id: string; position: number }[]) => void;
}) {
  const [items, setItems] = useState(tasks);
  useEffect(() => setItems(tasks), [tasks]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (!onReorder) {
    return (
      <ul className="flex flex-col gap-1">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </ul>
    );
  }

  const reorder = onReorder;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((t) => t.id === active.id);
    const newIndex = items.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    reorder(reordered.map((t, i) => ({ id: t.id, position: i })));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-1">
          {items.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} sortable />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
