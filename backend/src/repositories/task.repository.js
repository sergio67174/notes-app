import { query } from "../config/db.js";
import { findBoardByOwnerId } from "./board.repository.js";

export async function findTodoColumnForUser(userId) {
  const board = await findBoardByOwnerId(userId);
  if (!board) return null;

  const res = await query(
    `
    SELECT id, board_id, name, slug, position
    FROM columns
    WHERE board_id = $1
      AND slug = 'TODO'
    LIMIT 1
    `,
    [board.id]
  );

  const column = res.rows[0] || null;
  return { board, column };
}

export async function getNextPositionForColumn(columnId) {
  const res = await query(
    `
    SELECT COALESCE(MAX(position), 0) + 1 AS next_position
    FROM tasks
    WHERE column_id = $1
      AND is_deleted = false
    `,
    [columnId]
  );
  return res.rows[0].next_position;
}

export async function createTask({ boardId, columnId, title, description, position, color }) {
  const res = await query(
    `
    INSERT INTO tasks (board_id, column_id, title, description, position, color)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, board_id, column_id, title, description,
              position, color, is_deleted, deleted_at,
              created_at, updated_at
    `,
    [boardId, columnId, title, description ?? null, position, color]
  );
  return res.rows[0];
}

export async function findTaskByIdForUser({ taskId, userId }) {
  const res = await query(
    `
    SELECT t.id, t.board_id, t.column_id, t.title, t.description,
           t.position, t.color, t.is_deleted, t.deleted_at,
           t.created_at, t.updated_at
    FROM tasks t
    JOIN boards b ON t.board_id = b.id
    WHERE t.id = $1
      AND b.owner_id = $2
      AND t.is_deleted = false
    `,
    [taskId, userId]
  );
  return res.rows[0] || null;
}

// 👉 NEW: Update column + position
export async function moveTaskToColumn({ taskId, targetColumnId, newPosition }) {
  const res = await query(
    `
    UPDATE tasks
    SET column_id = $1,
        position = $2
    WHERE id = $3
    RETURNING id, board_id, column_id, title, description,
              position, color, is_deleted, deleted_at,
              created_at, updated_at
    `,
    [targetColumnId, newPosition, taskId]
  );

  return res.rows[0] || null;
}

/**
 * Update task title and/or description
 * @param {Object} params
 * @param {number} params.taskId - Task ID
 * @param {string} [params.title] - New title
 * @param {string} [params.description] - New description
 * @returns {Promise<Object|null>} Updated task or null
 */
export async function updateTask({ taskId, title, description }) {
  const res = await query(
    `
    UPDATE tasks
    SET title = COALESCE($1, title),
        description = COALESCE($2, description),
        updated_at = NOW()
    WHERE id = $3
      AND is_deleted = false
    RETURNING id, board_id, column_id, title, description,
              position, color, is_deleted, deleted_at,
              created_at, updated_at
    `,
    [title, description, taskId]
  );

  return res.rows[0] || null;
}