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

export async function createTask({ boardId, columnId, title, description, position }) {
  const res = await query(
    `
    INSERT INTO tasks (board_id, column_id, title, description, position)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, board_id, column_id, title, description,
              position, is_deleted, deleted_at,
              created_at, updated_at
    `,
    [boardId, columnId, title, description ?? null, position]
  );
  return res.rows[0];
}

export async function findTaskByIdForUser({ taskId, userId }) {
  const res = await query(
    `
    SELECT t.*
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
              position, is_deleted, deleted_at,
              created_at, updated_at
    `,
    [targetColumnId, newPosition, taskId]
  );

  return res.rows[0] || null;
}