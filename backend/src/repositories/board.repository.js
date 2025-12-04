import { query } from "../config/db.js";

export async function createBoardForUser({ ownerId, name = "Personal board" }) {
  const res = await query(
    `
    INSERT INTO boards (owner_id, name)
    VALUES ($1, $2)
    RETURNING id, owner_id, name, created_at, updated_at
    `,
    [ownerId, name]
  );
  return res.rows[0];
}

export async function findBoardByOwnerId(ownerId) {
  const res = await query(
    `
    SELECT *
    FROM boards
    WHERE owner_id = $1
    `,
    [ownerId]
  );
  return res.rows[0] || null;
}

export async function getColumnsByBoardId(boardId) {
  const res = await query(
    `
    SELECT id, board_id, name, slug, position, created_at, updated_at
    FROM columns
    WHERE board_id = $1
    ORDER BY position ASC
    `,
    [boardId]
  );
  return res.rows;
}

export async function getActiveTasksByBoardId(boardId) {
  const res = await query(
    `
    SELECT id, board_id, column_id, title, description, position,
           is_deleted, deleted_at, created_at, updated_at
    FROM tasks
    WHERE board_id = $1
      AND is_deleted = false
    ORDER BY column_id, position ASC
    `,
    [boardId]
  );
  return res.rows;
}

export async function findDoneColumnForBoard(boardId) {
  const res = await query(
    `
    SELECT id, board_id, name, slug, position
    FROM columns
    WHERE board_id = $1
      AND slug = 'DONE'
    LIMIT 1
    `,
    [boardId]
  );
  return res.rows[0] || null;
}

// 👉 NEW: soft-delete tasks in DONE column
export async function softDeleteDoneTasksForBoard(boardId, doneColumnId) {
  const res = await query(
    `
    UPDATE tasks
    SET is_deleted = true,
        deleted_at = NOW()
    WHERE board_id = $1
      AND column_id = $2
      AND is_deleted = false
    RETURNING id
    `,
    [boardId, doneColumnId]
  );

  return res.rowCount; // number of tasks soft-deleted
}