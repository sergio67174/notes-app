import React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";
import "./KanbanBoard.css";

/**
 * Kanban board with drag-and-drop functionality
 * - Displays 3 columns: TODO, IN_PROGRESS, DONE
 * - Drag and drop tasks between columns
 * - Shows drag overlay during drag operation
 *
 * @param {Object} props
 * @param {Array} props.columns - Array of column objects { id, slug, name }
 * @param {Array} props.tasks - Array of task objects
 * @param {Function} props.onMoveTask - Handler for moving tasks (taskId, targetColumnId, newPosition)
 * @param {Function} props.onUpdateTask - Handler for updating task content (taskId, updates)
 * @param {Function} props.onDeleteTask - Handler for deleting tasks (taskId)
 * @returns {JSX.Element} Kanban board component
 */
export default function KanbanBoard({
  columns,
  tasks,
  onMoveTask,
  onUpdateTask,
  onDeleteTask,
}) {
  const [activeTask, setActiveTask] = React.useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    })
  );

  /**
   * Handles drag start event
   * @param {Object} event - Drag event
   */
  function handleDragStart(event) {
    const taskId = event.active.id;
    const task = tasks.find((t) => t.id === taskId);
    setActiveTask(task);
  }

  /**
   * Handles drag end event and moves task if dropped on valid column
   * @param {Object} event - Drag event
   */
  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const targetColumnId = over.id;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.column_id === targetColumnId) return;

    // Calculate new position (append to end of target column)
    const targetColumnTasks = tasks.filter(
      (t) => t.column_id === targetColumnId
    );
    const newPosition = targetColumnTasks.length + 1;

    onMoveTask(taskId, targetColumnId, newPosition);
  }

  /**
   * Handles drag cancel event
   */
  function handleDragCancel() {
    setActiveTask(null);
  }

  // Group tasks by column
  const tasksByColumn = columns.reduce((acc, col) => {
    acc[col.id] = tasks
      .filter((t) => t.column_id === col.id)
      .sort((a, b) => a.position - b.position);
    return acc;
  }, {});

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="kanban-board" data-testid="kanban-board">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByColumn[column.id] || []}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} onDeleteTask={() => {}} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
