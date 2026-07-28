import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local and parse DATABASE_URL
const envContent = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
const match = envContent.match(/^DATABASE_URL="(.+)"$/m);
if (!match) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const databaseUrl = match[1];
const sql = neon(databaseUrl);

async function main() {
  try {
    const result = await sql`SELECT 1 AS connected`;
    console.log('✅ Database connection verified successfully!');
    console.log('Result:', JSON.stringify(result));
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
}

main();