import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { pool } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run database migrations
 * This runs automatically on production deployment (Render free tier)
 * since we don't have shell access to run migrations manually
 */
async function runMigrations() {
  console.log("🔧 Running database migrations...");

  try {
    const migrationPath = join(__dirname, "../migrations/001_create_tables.sql");
    const migrationSQL = readFileSync(migrationPath, "utf8");

    await pool.query(migrationSQL);

    console.log("✅ Database migrations completed successfully");
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to run database migrations:", error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();