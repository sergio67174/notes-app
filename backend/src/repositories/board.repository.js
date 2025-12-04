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
