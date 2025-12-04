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
