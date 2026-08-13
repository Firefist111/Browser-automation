import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { Stagehand } from "@browserbasehq/stagehand";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function checkDatabase(url: string) {
  console.log("\n🗄️ Checking Neon Database connection...");
  try {
    const sql = neon(url);
    const result = await sql`SELECT 1 AS connected`;
    console.log("✅ Neon Database connection verified successfully!");
    console.log("   Result:", JSON.stringify(result));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Neon Database connection failed: ${msg}`);
  }
}

async function checkBrowserbase(apiKey: string) {
  console.log("\n☁️ Checking Browserbase API authentication...");
  try {
    const res = await fetch("https://api.browserbase.com/v1/sessions", {
      headers: { "x-bb-api-key": apiKey }
    });
    if (res.ok) {
      console.log("✅ Browserbase API Key is working!");
    } else {
      console.error(`❌ Browserbase API Key failed: ${res.status} ${res.statusText}`);
      try {
        const text = await res.text();
        console.error(`   Details: ${text}`);
      } catch {}
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Browserbase connection failed: ${msg}`);
  }
}

async function checkOpenAI(apiKey: string) {
  console.log("\n🤖 Checking OpenAI API generation (gpt-4o-mini)...");
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Say 'OpenAI is working!' in one short sentence." }],
        max_tokens: 50,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const output = data.choices?.[0]?.message?.content?.trim();
      console.log("✅ OpenAI API generated output successfully!");
      console.log(`   Output: "${output}"`);
    } else {
      console.error(`❌ OpenAI API Key failed: ${res.status} ${res.statusText}`);
      try {
        const text = await res.text();
        console.error(`   Details: ${text}`);
      } catch {}
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ OpenAI connection failed: ${msg}`);
  }
}

async function checkGemini(apiKey: string) {
  console.log("\n♊ Checking Gemini API generation (gemini-2.0-flash)...");
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say 'Gemini is working!' in one short sentence." }] }],
        }),
      }
    );
    if (res.ok) {
      const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log("✅ Gemini API generated output successfully!");
      console.log(`   Output: "${output}"`);
    } else {
      console.error(`❌ Gemini API Key failed: ${res.status} ${res.statusText}`);
      try {
        const text = await res.text();
        console.error(`   Details: ${text}`);
      } catch {}
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Gemini connection failed: ${msg}`);
  }
}

async function checkLiveblocks(apiKey: string) {
  console.log("\n💬 Checking Liveblocks API authentication...");
  try {
    const res = await fetch("https://api.liveblocks.io/v2/rooms", {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    if (res.ok) {
      console.log("✅ Liveblocks Secret Key is working!");
    } else {
      console.error(`❌ Liveblocks Secret Key failed: ${res.status} ${res.statusText}`);
      try {
        const text = await res.text();
        console.error(`   Details: ${text}`);
      } catch {}
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Liveblocks connection failed: ${msg}`);
  }
}

async function checkStagehandSession() {
  console.log("\n🚀 Testing Stagehand V3 Navigation on Browserbase Cloud...");
  let stagehand;
  try {
    stagehand = new Stagehand({
      env: process.env.BROWSERBASE_API_KEY ? "BROWSERBASE" : "LOCAL",
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID || undefined,
      model:
        process.env.STAGEHAND_MODEL ||
        process.env.LLM_MODEL ||
        "google/gemini-2.0-flash",
    });
    await stagehand.init();
    console.log("   ✅ Stagehand initialized successfully!");
    
    console.log("   🌐 Navigating to https://example.com...");
    const pages = stagehand.context.pages();
    const page = pages.length > 0 ? pages[0] : await stagehand.context.newPage();
    
    await page.goto("https://example.com", { waitUntil: "load", timeoutMs: 30000 });
    console.log("   ✅ Navigation successful!");

    const title = await page.title();
    console.log(`   ✅ Extracted Page Title: "${title}"`);
    
    if (title === "Example Domain") {
      console.log("   🎉 Stagehand integration is fully functional!");
    } else {
      console.warn("   ⚠️ Stagehand integration test title mismatch.");
    }
  } catch (err) {
    console.error("   ❌ Stagehand execution test failed!");
    console.error(err);
  } finally {
    if (stagehand) {
      console.log("   🔌 Closing Stagehand...");
      await stagehand.close();
      console.log("   ✅ Stagehand closed.");
    }
  }
}

async function main() {
  console.log("=========================================");
  console.log("🔍 RUNNING ALL SYSTEM INTEGRATION CHECKS");
  console.log("=========================================");

  const dbUrl = process.env.DATABASE_URL;
  const browserbaseKey = process.env.BROWSERBASE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const liveblocksKey = process.env.LIVEBLOCKS_SECRET_KEY;

  if (dbUrl) await checkDatabase(dbUrl);
  if (browserbaseKey) await checkBrowserbase(browserbaseKey);
  if (openaiKey) await checkOpenAI(openaiKey);
  if (geminiKey) await checkGemini(geminiKey);
  if (liveblocksKey) await checkLiveblocks(liveblocksKey);
  
  if (browserbaseKey && (openaiKey || geminiKey)) {
    await checkStagehandSession();
  }

  console.log("\n=========================================");
  console.log("🏁 INTEGRATION CHECKS COMPLETE");
  console.log("=========================================");
}

main().catch(err => {
  console.error("Unexpected verification error:", err);
});
