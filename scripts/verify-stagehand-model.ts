import dotenv from "dotenv";
import { Stagehand } from "@browserbasehq/stagehand";

dotenv.config({ path: ".env.local" });

async function main() {
  const model =
    process.env.STAGEHAND_MODEL ||
    process.env.LLM_MODEL ||
    "google/gemini-2.0-flash";
  console.log("=========================================");
  console.log(`🚀 Stagehand end-to-end check  (model = "${model}")`);
  console.log("=========================================");

  const stagehand = new Stagehand({
    env: process.env.BROWSERBASE_API_KEY ? "BROWSERBASE" : "LOCAL",
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID || undefined,
    model,
    verbose: 1,
  });

  try {
    await stagehand.init();
    console.log("✅ Stagehand initialized");
    if (stagehand.browserbaseSessionURL) {
      console.log(`   Session: ${stagehand.browserbaseSessionURL}`);
    }

    const pages = stagehand.context.pages();
    const page = pages.length > 0 ? pages[0] : await stagehand.context.newPage();

    console.log("🌐 Opening https://example.com ...");
    await page.goto("https://example.com", { waitUntil: "load" });
    console.log("   Title:", await page.title());

    // Test 1: act()
    console.log("\n🧭 Testing act()...");
    const actRes = await stagehand.act(
      'Click the link with text "More information..."'
    );
    console.log("   act worked:", actRes.success, "| url:", page.url());

    // Return to a known page
    await page.goto("https://example.com", { waitUntil: "load" });

    // Test 2: extract()
    console.log("\n📋 Testing extract()...");
    const extractRes = await stagehand.extract({
      instruction: "Extract the main heading text of this page",
      schema: { heading: "string" },
    });
    console.log("   extract result:", JSON.stringify(extractRes));

    // Test 3: observe()
    console.log("\n👀 Testing observe()...");
    const observeRes = await stagehand.observe({
      instruction: "List clickable links on this page",
    });
    console.log("   observe observations:", observeRes.length);

    console.log("\n=========================================");
    console.log("🎉 ALL AI STEPS PASSED");
    console.log("=========================================");
  } catch (err) {
    console.error("\n❌ FAILED:");
    console.error(err);
    process.exitCode = 1;
  } finally {
    await stagehand.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});