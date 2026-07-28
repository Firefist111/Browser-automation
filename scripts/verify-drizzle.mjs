import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
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
const db = drizzle(sql);

async function main() {
  try {
    const result = await db.execute("SELECT 1 AS connected");
    console.log("✅ Drizzle ORM connected to Neon successfully!");
    console.log("Result:", JSON.stringify(result));

    // Verify workflows table exists
    const tables = await db.execute(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log("📋 Tables in database:", JSON.stringify(tables));
  } catch (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }
}

main();