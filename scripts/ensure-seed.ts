/**
 * Production startup helper: seed demo data only when the DB is missing
 * or the users table is empty. No-op if data already exists.
 *
 * Local file SQLite: missing file or empty users → seed.
 * Remote Turso: never delete the DB; if users count 0 → seedDemoData; else no-op.
 */
import fs from "fs";
import {
  getDb,
  getDbPath,
  initSchema,
  isRemoteDb,
  resetDbClient,
  setAutoSeedDisabled,
} from "../lib/db";
import { seedDemoData } from "./seed";

async function usersExist(): Promise<boolean> {
  if (!isRemoteDb()) {
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath)) {
      return false;
    }
  }

  try {
    const db = getDb();
    // Schema only — we decide seed ourselves (avoid double soft-seed race)
    setAutoSeedDisabled(true);
    try {
      await initSchema(db);
    } finally {
      setAutoSeedDisabled(false);
    }
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
  const mode = isRemoteDb() ? "remote Turso" : "local file";
  console.log(`[ensure-seed] Checking DB (${mode}) at ${dbPath}`);

  if (await usersExist()) {
    console.log("[ensure-seed] Data already present — skipping seed.");
    return;
  }

  if (isRemoteDb()) {
    console.log(
      "[ensure-seed] Remote users empty — soft-seeding (will not wipe)..."
    );
  } else {
    console.log(
      "[ensure-seed] DB missing or users table empty — running demo seed..."
    );
  }
  resetDbClient();
  await seedDemoData();
  console.log("[ensure-seed] Seed complete.");
}

main().catch((err) => {
  console.error("[ensure-seed] Failed:", err);
  process.exit(1);
});
