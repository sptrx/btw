/**
 * BTW connection tests - run sequentially
 * Usage: node scripts/test-connections.mjs
 * Requires: .env.local with Supabase and OpenRouter vars
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const results = { passed: 0, failed: 0, tests: [] };

function log(msg, type = "info") {
  const prefix = type === "pass" ? "✓" : type === "fail" ? "✗" : " ";
  console.log(`${prefix} ${msg}`);
}

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) {
    console.error("Error: .env.local not found");
    process.exit(1);
  }
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const sharp = line.indexOf("#");
    const lineClean = sharp >= 0 ? line.slice(0, sharp).trim() : line;
    const eq = lineClean.indexOf("=");
    if (eq > 0) {
      const key = lineClean.slice(0, eq).trim();
      let val = lineClean.slice(eq + 1).trim().replace(/^["']|["']$/g, "").replace(/\r$/, "");
      process.env[key] = val;
    }
  }
}

async function run(name, fn) {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, ok: true });
    log(name, "pass");
    return true;
  } catch (e) {
    results.failed++;
    results.tests.push({ name, ok: false, error: e.message });
    log(`${name}: ${e.message}`, "fail");
    return false;
  }
}

// Test 1: Env vars
async function testEnvVars() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  const hasAi = process.env.OPENROUTER_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.OPENAI_API_KEY;
  for (const k of required) {
    if (!process.env[k]) throw new Error(`Missing ${k}`);
  }
  if (!hasAi) throw new Error("Missing AI key (OPENROUTER_API_KEY, GOOGLE_AI_API_KEY, or OPENAI_API_KEY)");
}

// Test 2: Supabase connection
async function testSupabaseConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from("profiles").select("id").limit(1);
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
}

// Test 3: Supabase tables (profiles, posts, topics)
async function testSupabaseTables() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);

  const tables = ["profiles", "posts", "topics"];
  for (const table of tables) {
    const { error } = await supabase.from(table).select("id").limit(0);
    if (error) throw new Error(`Table '${table}' missing or inaccessible: ${error.message}`);
  }
}

// Test 4: OpenRouter moderation
async function testOpenRouterModeration() {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const keyPreview = key.length >= 16 ? `${key.slice(0, 12)}...${key.slice(-4)}` : "(too short)";
  log(`  Using key: ${keyPreview}`, "info");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Reply with only OK or FLAGGED." },
        { role: "user", content: "Hello, this is a test of kind content." },
      ],
      max_tokens: 10,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    let msg;
    try {
      const err = JSON.parse(text);
      msg = err?.error?.message || text;
    } catch {
      msg = text;
    }
    if (res.status === 401) {
      msg = `401: ${msg}. Create a new key at openrouter.ai/keys (old keys may be revoked).`;
    }
    throw new Error(msg);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response content from OpenRouter");
}

// Test 5: OpenRouter model availability
async function testOpenRouterModel() {
  if (!process.env.OPENROUTER_API_KEY) return;

  const models = ["google/gemini-2.5-flash", "google/gemini-2.5-pro", "google/gemini-flash-1.5"];
  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Say OK" }],
          max_tokens: 5,
        }),
      });
      if (res.ok) {
        log(`  Model ${model} works`, "pass");
        return;
      }
    } catch (_) {}
  }
  throw new Error("OpenRouter: No model responded. Check model names at openrouter.ai/docs");
}

// Test 6: Topic content table
async function testTopicContentTable() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);
  const { error } = await supabase.from("topic_content").select("id").limit(0);
  if (error) throw new Error(`topic_content: ${error.message}`);
}

// Test 7: Topic members table
async function testTopicMembersTable() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);
  const { error } = await supabase.from("topic_members").select("id").limit(0);
  if (error) throw new Error(`topic_members: ${error.message}`);
}

async function main() {
  console.log("\n--- BTW Connection Tests ---\n");

  loadEnv();

  await run("1. Env vars (Supabase + AI key)", testEnvVars);
  await run("2. Supabase connection (profiles)", testSupabaseConnection);
  await run("3. Supabase tables (profiles, posts, topics)", testSupabaseTables);
  await run("4. OpenRouter moderation API", testOpenRouterModeration);
  await run("5. OpenRouter model availability", testOpenRouterModel);
  await run("6. Supabase topic_content table", testTopicContentTable);
  await run("7. Supabase topic_members table", testTopicMembersTable);

  console.log("\n--- Results ---");
  console.log(`Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log("");

  process.exit(results.failed > 0 ? 1 : 0);
}

main();
