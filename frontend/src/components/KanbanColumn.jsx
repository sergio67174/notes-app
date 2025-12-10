import React from "react";
import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";
import "./KanbanColumn.css";

/**
 * Droppable column for tasks
 * - Acts as a drop zone for dragged tasks
 * - Displays column title and tasks
 * - Highlights when a task is dragged over it
 *
 * @param {Object} props
 * @param {Object} props.column - Column data { id, slug, name }
 * @param {Array} props.tasks - Tasks in this column
 * @param {Function} props.onUpdateTask - Handler for updating tasks
 * @param {Function} props.onDeleteTask - Handler for deleting tasks
 * @returns {JSX.Element} Kanban column component
 */
export default function KanbanColumn({ column, tasks, onUpdateTask, onDeleteTask }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? "kanban-column-over" : ""}`}
      data-testid={`kanban-column-${column.slug}`}
    >
      <h2 className="column-title" data-testid={`column-title-${column.slug}`}>
        {column.name}
      </h2>

      <div className="column-tasks" data-testid={`column-tasks-${column.slug}`}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            isDone={column.slug === "DONE"}
          />
        ))}
      </div>
    </div>
  );
}
