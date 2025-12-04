import pkg from "pg";
import { env } from "./env.js";

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: env.dbUrl,
});

export async function query(text, params) {
  return pool.query(text, params);
}
