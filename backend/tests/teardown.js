/**
 * Jest Global Teardown
 * Runs once after all test suites
 * Closes database connections
 */

import { pool } from "../src/config/db.js";

export default async function globalTeardown() {
  console.log("🔧 Cleaning up test database connections...");

  try {
    // Close all database connections
    await pool.end();
    console.log("✅ Database connections closed successfully");
  } catch (error) {
    console.error("❌ Failed to close database connections:", error.message);
    throw error;
  }
}