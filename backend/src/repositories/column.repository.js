import { query } from "../config/db.js";

export async function createDefaultColumnsForBoard(boardId) {
  const rows = [
    { name: "To do", slug: "TODO", position: 1 },
    { name: "In progress", slug: "IN_PROGRESS", position: 2 },
    { name: "Done", slug: "DONE", position: 3 },
  ];

  for (const col of rows) {
    await query(
      `
      INSERT INTO columns (board_id, name, slug, position)
      VALUES ($1, $2, $3, $4)
      `,
      [boardId, col.name, col.slug, col.position]
    );
  }
}

export async function findColumnById(columnId) {
  const res = await query(
    `
    SELECT id, board_id, name, slug, position, created_at, updated_at
    FROM columns
    WHERE id = $1
    `,
    [columnId]
  );
  return res.rows[0] || null;
}
