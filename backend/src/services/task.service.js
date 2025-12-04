import {
  findTodoColumnForUser,
  getNextPositionForColumn,
  createTask,
  findTaskByIdForUser,
  moveTaskToColumn,
} from "../repositories/task.repository.js";
import { findColumnById } from "../repositories/column.repository.js";

export async function createTaskForUser({ userId, title, description }) {
  const result = await findTodoColumnForUser(userId);

  if (!result || !result.board || !result.column) {
    const err = new Error("Board or TODO column not found for user");
    err.status = 404;
    throw err;
  }

  const { board, column } = result;
  const position = await getNextPositionForColumn(column.id);

  const task = await createTask({
    boardId: board.id,
    columnId: column.id,
    title,
    description,
    position,
  });

  return task;
}

// 👉 NEW: move task between columns
export async function moveTaskForUser({ userId, taskId, targetColumnId, newPosition }) {
  const task = await findTaskByIdForUser({ taskId, userId });
  if (!task) {
    const err = new Error("Task not found");
    err.status = 404;
    throw err;
  }

  const column = await findColumnById(targetColumnId);
  if (!column) {
    const err = new Error("Target column not found");
    err.status = 404;
    throw err;
  }

  // Ensure column belongs to same board as the task
  if (column.board_id !== task.board_id) {
    const err = new Error("Cannot move task to a column of another board");
    err.status = 403;
    throw err;
  }

  // If no position provided, place at end of that column
  let positionToUse = newPosition;
  if (!positionToUse || Number.isNaN(Number(positionToUse))) {
    positionToUse = await getNextPositionForColumn(column.id);
  }

  const updated = await moveTaskToColumn({
    taskId,
    targetColumnId: column.id,
    newPosition: positionToUse,
  });

  return updated;
}
