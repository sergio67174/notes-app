import { query } from "../config/db.js";

export async function findUserByEmail(email) {
  const res = await query("SELECT * FROM users WHERE email = $1", [email]);
  return res.rows[0] || null;
}

export async function createUser({ email, passwordHash, name }) {
  const res = await query(
    `
    INSERT INTO users (email, password_hash, name)
    VALUES ($1, $2, $3)
    RETURNING id, email, name, created_at, updated_at
    `,
    [email, passwordHash, name]
  );
  return res.rows[0];
}
