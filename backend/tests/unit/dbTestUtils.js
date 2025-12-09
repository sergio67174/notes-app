import { query } from "../../src/config/db.js";

export async function clearDatabase() {
  // Order matters because of FK constraints
  await query("DELETE FROM tasks", []);
  await query("DELETE FROM columns", []);
  await query("DELETE FROM boards", []);
  await query("DELETE FROM users", []);
}