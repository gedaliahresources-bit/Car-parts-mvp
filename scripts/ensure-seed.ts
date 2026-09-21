/**
 * Production startup helper: seed demo data only when the DB is missing
 * or the users table is empty. No-op if data already exists.
 */
import fs from "fs";
import { getDb, getDbPath, initSchema, resetDbClient } from "../lib/db";
import { seedDemoData } from "./seed";

async function usersExist(): Promise<boolean> {
  const dbPath = getDbPath();
  if (!fs.existsSync(dbPath)) {
    return false;
  }

  try {
    const db = getDb();
    await initSchema(db);
    const result = await db.execute("SELECT COUNT(*) AS c FROM users");
    const count = Number(result.rows[0]?.c ?? 0);
    return count > 0;
  } catch (err) {
    console.warn(
      "[ensure-seed] Could not read users table; will attempt seed.",
      err
    );
    resetDbClient();
    return false;
  }
}

async function main() {
  const dbPath = getDbPath();
  console.log(`[ensure-seed] Checking DB at ${dbPath}`);

  if (await usersExist()) {
    console.log("[ensure-seed] Data already present — skipping seed.");
    return;
  }

  console.log(
    "[ensure-seed] DB missing or users table empty — running demo seed..."
  );
  resetDbClient();
  await seedDemoData();
  console.log("[ensure-seed] Seed complete.");
}

main().catch((err) => {
  console.error("[ensure-seed] Failed:", err);
  process.exit(1);
});
