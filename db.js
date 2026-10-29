// Connection to the Neon Postgres database (DATABASE_URL in .env).
// On start, runs any SQL file in migrations/ that hasn't run yet, in name order.
// Every change to the database goes in a new numbered file there, never by hand.

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

function poolConfig(url) {
  // Keep full certificate checks, and set them here instead of through sslmode
  // in the URL, which pg is about to change the meaning of
  const u = new URL(url);
  u.searchParams.delete("sslmode");
  u.searchParams.delete("channel_binding");
  return { connectionString: u.toString(), ssl: { rejectUnauthorized: true }, max: 5 };
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing. Add your Neon link to the .env file.");
export const pool = new pg.Pool(poolConfig(process.env.DATABASE_URL));

export async function migrate() {
  const dir = join(import.meta.dirname, "migrations");
  const files = (await readdir(dir)).filter(f => f.endsWith(".sql")).sort();
  const client = await pool.connect();
  try {
    // Only one server at a time runs migrations
    await client.query("SELECT pg_advisory_lock(727274)");
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
    const done = new Set((await client.query("SELECT name FROM schema_migrations")).rows.map(r => r.name));
    for (const file of files.filter(f => !done.has(f))) {
      await client.query("BEGIN");
      try {
        await client.query(await readFile(join(dir, file), "utf8"));
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`Migration applied: ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(727274)").catch(() => {});
    client.release();
  }
}
