import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local and parse DATABASE_URL
const envContent = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
const match = envContent.match(/^DATABASE_URL="(.+)"$/m);
if (!match) {
  console.error("❌ DATABASE_URL not found in .env.local");
  process.exit(1);
}

const databaseUrl = match[1];
const sql = neon(databaseUrl);

async function main() {
  console.log("🔍 Checking for workflows with NULL graph in Neon DB...");
  const nullGraphs = await sql`SELECT id, name FROM workflows WHERE graph IS NULL`;
  console.log(`📋 Found ${nullGraphs.length} workflow(s) with NULL graph in database.`);

  if (nullGraphs.length > 0) {
    console.log("🛠️ Updating NULL graph rows to default '{\"nodes\": [], \"edges\": []}'...");
    const updated = await sql`UPDATE workflows SET graph = '{"nodes": [], "edges": []}'::jsonb WHERE graph IS NULL RETURNING id, name`;
    console.log(`✅ Successfully updated ${updated.length} workflow rows!`);
  } else {
    console.log("✅ All workflow rows in the database already have valid graph data!");
  }
}

main().catch(err => {
  console.error("❌ Database fix script failed:", err);
});
