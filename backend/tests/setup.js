/**
 * Jest Global Setup
 * Runs once before all test suites
 * Sets up database schema for testing
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { pool } from "../src/config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function globalSetup() {
  console.log("🔧 Setting up test database schema...");

  try {
    // Read migration file
    const migrationPath = join(__dirname, "../migrations/001_create_tables.sql");
    const migrationSQL = readFileSync(migrationPath, "utf8");

    // Execute migration
    await pool.query(migrationSQL);

    console.log("✅ Database schema created successfully");
  } catch (error) {
    console.error("❌ Failed to create database schema:", error.message);
    throw error;
  }
}