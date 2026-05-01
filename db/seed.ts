// 編集日時: 2026-05-01
/**
 * seed.ts
 * - CLIで直接実行: npx tsx db/seed.ts
 * - Next.js instrumentation経由でデプロイ時に自動実行
 * - 既にデータが存在する場合はスキップ（冪等）
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// ── テーブル初期化（CREATE IF NOT EXISTS） ────────────────────────────
async function initializeDb(client: ReturnType<typeof createClient>) {
  await client.execute(`CREATE TABLE IF NOT EXISTS anomalies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    classification TEXT NOT NULL,
    containment_class TEXT,
    risk_class TEXT,
    disruption_class TEXT,
    description TEXT NOT NULL,
    containment_procedures TEXT,
    addendum TEXT,
    tags TEXT,
    image_url TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    description TEXT NOT NULL,
    specifications TEXT,
    related_anomalies TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL,
    date TEXT NOT NULL,
    location TEXT,
    description TEXT NOT NULL,
    casualties TEXT,
    related_anomalies TEXT,
    related_personnel TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS facilities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL,
    description TEXT NOT NULL,
    director TEXT,
    capacity INTEGER,
    contained_anomalies TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS personnel (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    codename TEXT,
    rank TEXT NOT NULL,
    clearance INTEGER NOT NULL,
    status TEXT NOT NULL,
    description TEXT NOT NULL,
    specialties TEXT,
    assigned_facility TEXT,
    related_anomalies TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS novels (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    author TEXT NOT NULL,
    summary TEXT,
    classification TEXT,
    clearance_required INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published',
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL,
    title TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published',
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
  )`);

  console.log("✅ Tables created.");
}

// ── シードデータ投入（冪等） ──────────────────────────────────────────
export async function runSeed(
  dbUrl?: string,
  authToken?: string
): Promise<void> {
  const client = createClient({
    url: dbUrl ?? process.env.TURSO_DATABASE_URL ?? "file:local.db",
    authToken: authToken ?? process.env.TURSO_AUTH_TOKEN,
  });

  drizzle(client, { schema });

  await initializeDb(client);

  // ── 既存データ確認 ────────────────────────────────────────────────
  const existing = await client.execute(
    `SELECT COUNT(*) as cnt FROM novels`
  );

  const row = existing.rows[0] as Record<string, unknown>;
  const cnt = Number(row.cnt ?? 0);

  if (cnt > 0) {
    console.log("⏭ Seed skipped: data already exists.");
    await client.close();
    return;
  }

  console.log("🌱 Seeding...");

  // ── 初期化 ──────────────────────────────────────────────────────
  await client.execute(`DELETE FROM chapters`);
  await client.execute(`DELETE FROM novels`);
  await client.execute(`DELETE FROM personnel`);
  await client.execute(`DELETE FROM incidents`);
  await client.execute(`DELETE FROM modules`);
  await client.execute(`DELETE FROM facilities`);
  await client.execute(`DELETE FROM anomalies`);

  // ── Anomalies ──────────────────────────────────────────────────
  await client.execute({
    sql: `
      INSERT INTO anomalies
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())
    `,
    args: [
      "SCP-1729",
      "永遠の子守唄",
      "Keter",
      "Keter",
      "Critical",
      "Vlam",
      "SCP-1729は音響的アノマリー...",
      "SCP-1729の収容には特殊な音響遮断設備を必要とする。",
      "付記1729-A",
      JSON.stringify(["音響", "精神影響"]),
      null,
    ],
  });

  // ── Novel ──────────────────────────────────────────────────────
  await client.execute({
    sql: `
      INSERT INTO novels
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())
    `,
    args: [
      "novel-001",
      "影の縁で",
      "kage-no-fuchi-de",
      "財団アーキビスト█████",
      "第19サイトの停電事案から始まる物語。",
      "Narrative",
      0,
      "published",
    ],
  });

  // ── Chapter ────────────────────────────────────────────────────
  const chapter1Content = `
[HEADER]財団機密文書[/HEADER]

午前3時47分。

第一の警報が鳴り響いた瞬間、
[PERSON|PRSN-0134|エージェント・カガミ]は夢の中にいた。

[GLITCH]░░░警告░░░[/GLITCH]

[TERMINAL]
> SYSTEM: CRITICAL POWER FAILURE
> SITE-19 GRID: OFFLINE
[/TERMINAL]
`;

  await client.execute({
    sql: `
      INSERT INTO chapters
      VALUES (?, ?, ?, ?, ?, ?, unixepoch())
    `,
    args: [
      "ch-001-01",
      "novel-001",
      "第一章：停電",
      1,
      chapter1Content,
      "published",
    ],
  });

  console.log("✅ Seed data inserted successfully.");

  await client.close();
}

// ── CLI実行 ────────────────────────────────────────────────────────
if (
  require.main === module ||
  process.argv[1]?.endsWith("seed.ts") ||
  process.argv[1]?.endsWith("seed.js")
) {
  runSeed().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
