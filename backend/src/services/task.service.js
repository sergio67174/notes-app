import {
  findTodoColumnForUser,
  getNextPositionForColumn,
  createTask,
  findTaskByIdForUser,
  moveTaskToColumn,
  updateTask,
} from "../repositories/task.repository.js";
import { findColumnById } from "../repositories/column.repository.js";

const PASTEL_COLORS = ["pastel-yellow", "pastel-pink", "pastel-green", "pastel-blue"];

/**
 * Get a random pastel color for a new task
 * @returns {string} Random pastel color name
 */
function getRandomPastelColor() {
  return PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
}

/**
 * Create a new task for a user in their TODO column
 * @param {Object} params
 * @param {number} params.userId - User ID
 * @param {string} params.title - Task title
 * @param {string} [params.description] - Task description
 * @returns {Promise<Object>} Created task
 */
export async function createTaskForUser({ userId, title, description }) {
  const result = await findTodoColumnForUser(userId);

  if (!result || !result.board || !result.column) {
    const err = new Error("Board or TODO column not found for user");
    err.status = 404;
    throw err;
  }

  const { board, column } = result;
  const position = await getNextPositionForColumn(column.id);
  const color = getRandomPastelColor();

  const task = await createTask({
    boardId: board.id,
    columnId: column.id,
    title,
    description,
    position,
    color,
  });

  return task;
}

/**
 * Move a task to a different column
 * @param {Object} params
 * @param {number} params.userId - User ID
 * @param {number} params.taskId - Task ID
 * @param {number} params.targetColumnId - Target column ID
 * @param {number} [params.newPosition] - New position in column
 * @returns {Promise<Object>} Updated task
 */
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

/**
 * Update task title and/or description
 * @param {Object} params
 * @param {number} params.userId - User ID
 * @param {number} params.taskId - Task ID
 * @param {string} [params.title] - New title
 * @param {string} [params.description] - New description
 * @returns {Promise<Object>} Updated task
 */
export async function updateTaskForUser({ userId, taskId, title, description }) {
  const task = await findTaskByIdForUser({ taskId, userId });
  if (!task) {
    const err = new Error("Task not found");
    err.status = 404;
    throw err;
  }

  const updated = await updateTask({
    taskId,
    title,
    description,
  });

  return updated;
}
