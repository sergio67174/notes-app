import { query } from "../config/db.js";

async function main() {
  try {
    const res = await query("SELECT NOW()");
    console.log("DB connection OK:", res.rows[0]);
  } catch (err) {
    console.error("DB error:", err);
  }
}

main();
