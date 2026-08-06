import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");

const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!rawConnectionString) {
  console.error("POSTGRES_URL_NON_POOLING (or POSTGRES_URL) is not set.");
  process.exit(1);
}

// Strip sslmode from the URL so our explicit `ssl` option below is
// authoritative instead of being overridden by the querystring.
const connectionString = rawConnectionString.replace(/[?&]sslmode=[^&]*/, "");

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  console.log(`Applying ${file}...`);
  const sql = readFileSync(path.join(migrationsDir, file), "utf8");
  await client.query(sql);
}

console.log("Done.");
await client.end();
