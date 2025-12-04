import pkg from "pg";
import { env } from "./env.js";

const { Pool } = pkg;

console.log("DB CONFIG:", env.db); // 👈 TEMP debug log

export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password, // 👈 will be string
});

export async function query(text, params) {
  return pool.query(text, params);
}
