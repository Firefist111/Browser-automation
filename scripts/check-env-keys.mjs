import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

if (!fs.existsSync(envPath)) {
  console.log(".env.local NOT FOUND");
  process.exit(0);
}

const content = fs.readFileSync(envPath, "utf8");
const keys = content
  .split(/\r?\n/)
  .filter((line) => line && !line.trim().startsWith("#"))
  .map((line) => line.split("=")[0].trim())
  .filter(Boolean);

console.log("Keys present:", keys.join(", "));

// Check for specific required keys
const required = ["BROWSERBASE_API_KEY", "BROWSERBASE_PROJECT_ID", "OPENAI_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY"];
for (const key of required) {
  const present = keys.includes(key);
  console.log(`${key}: ${present ? "PRESENT" : "MISSING"}`);
}