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
