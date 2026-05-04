// 編集日時: 2026-04-29
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
  // Create tables
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

  console.log("Tables created.");
}

// ── シードデータ投入（冪等：novelが既に存在すればスキップ） ───────────
export async function runSeed(dbUrl?: string, authToken?: string): Promise<void> {
  const client = createClient({
    url: dbUrl ?? process.env.TURSO_DATABASE_URL ?? "file:local.db",
    authToken: authToken ?? process.env.TURSO_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });

  await initializeDb(client);

  // 既にnovelsが存在する場合はスキップ
  const existing = await client.execute(`SELECT COUNT(*) as cnt FROM novels`);
  const cnt = (existing.rows[0] as { cnt: number }).cnt;
  if (Number(cnt) > 0) {
    console.log("⏭ Seed skipped: data already exists.");
    await client.close();
    return;
  }

  console.log("🌱 Seeding...");

  // Anomalies
  await client.execute({
    sql: `INSERT INTO anomalies VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    args: [
      "SCP-1729",
      "永遠の子守唄",
      "Keter",
      "Keter",
      "Critical",
      "Vlam",
      "SCP-1729は音響的アノマリーの一形態であり、特定の周波数で再生された場合、聴取者の神経系に直接干渉する子守唄のパターンを持つ。影響を受けた個体（以下SCP-1729-1と呼称）は深い催眠状態に陥り、外部からの刺激に反応しなくなる。最長記録された催眠持続時間は██年██ヶ月である。",
      "SCP-1729の収容には特殊な音響遮断設備を必要とする。██サイト内の収容室は四重の防音パネルで囲まれ、内部の音響レベルは常時監視される。収容室への入室は書面による許可と耳栓の着用を必須とする。",
      "付記1729-A: ████博士による分析によれば、SCP-1729のパターンは既知のいかなる音楽理論にも合致しない。",
      JSON.stringify(["音響", "精神影響", "Keter", "収容困難"]),
      null,
    ],
  });

  await client.execute({
    sql: `INSERT INTO anomalies VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    args: [
      "SCP-0048",
      "記憶を食べる影",
      "Euclid",
      "Euclid",
      "Warning",
      "Dark",
      "SCP-0048は視覚的アノマリーであり、光源のない空間において人間の影に擬態する。SCP-0048に接触した個体は特定の記憶が選択的に消去されることが観察されている。消去される記憶はランダムではなく、対象にとって最も重要な記憶が優先的に標的とされる。",
      "SCP-0048は十分に照明された収容室に保管する。室内の照度は常時1000ルクス以上を維持すること。停電プロトコルの整備を最優先事項とする。",
      null,
      JSON.stringify(["視覚", "記憶", "Euclid", "影"]),
      null,
    ],
  });

  await client.execute({
    sql: `INSERT INTO anomalies VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    args: [
      "SCP-3301",
      "最後の電話",
      "Safe",
      "Safe",
      "Notice",
      "Negligible",
      "SCP-3301は1970年代製の黒色固定電話機である。本オブジェクトに特定の番号（現在も[編集済み]）をダイヤルすると、死亡した人物と通話が可能になる。通話可能な期間は死後72時間以内に限られる。",
      "SCP-3301は標準的なオブジェクト収容ロッカーに保管する。使用には研究主任の許可が必要。",
      null,
      JSON.stringify(["通信", "死後", "Safe", "電話"]),
      null,
    ],
  });

  // Modules
  await client.execute({
    sql: `INSERT INTO modules VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())`,
    args: [
      "MOD-004",
      "MNEMON記憶抽出システム",
      "System",
      "Active",
      "MNEMON（Memory Neural Extraction and Monitoring Operations Node）は財団が開発した神経インターフェースシステムである。対象の脳神経から直接記憶データを抽出・デジタル化し、財団のデータベースに保存することを可能にする。",
      JSON.stringify({
        resolution: "97.3%",
        maxDuration: "80年分の記憶",
        sideEffects: "軽度の短期記憶障害",
        clearanceRequired: 3,
      }),
      JSON.stringify(["SCP-0048"]),
    ],
  });

  await client.execute({
    sql: `INSERT INTO modules VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())`,
    args: [
      "MOD-017",
      "AEGIS音響遮断プロトコル",
      "Protocol",
      "Active",
      "AEGIS（Acoustic Environment Generic Isolation System）は財団が開発した標準化された音響収容プロトコルである。音響系アノマリーの収容に広く使用される。",
      JSON.stringify({
        attenuationLevel: "-140dB",
        frequencyRange: "0.1Hz-200kHz",
        powerConsumption: "要バックアップ電源",
        clearanceRequired: 2,
      }),
      JSON.stringify(["SCP-1729"]),
    ],
  });

  // Incidents
  await client.execute({
    sql: `INSERT INTO incidents VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
    args: [
      "INC-2024-0311",
      "第19サイト停電事案",
      "Major",
      "Resolved",
      "2024-03-11",
      "第19サイト, ██県",
      "2024年3月11日03:47、第19サイトにて予期せぬ全停電が発生。SCP-0048の収容室の照明が一時的に消失し、収容違反が発生した。現場にいた研究員██名が記憶消去の被害を受けた。緊急照明の起動により30分後に収容を回復。",
      "研究員3名が重篤な記憶障害、D-クラス職員2名が軽度の記憶障害",
      JSON.stringify(["SCP-0048"]),
      JSON.stringify(["PRSN-0077", "PRSN-0134"]),
    ],
  });

  // Facilities
  await client.execute({
    sql: `INSERT INTO facilities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
    args: [
      "SITE-19",
      "第19収容サイト",
      "Containment",
      "██県██市（座標非公開）",
      "Active",
      "第19収容サイトは財団のアジア太平洋地域における主要収容施設である。地下5層、地上3層の構造を持ち、現在██体のアノマリーを収容している。生命維持、研究、収容の三部門が独立して運営される。",
      "████博士（クリアランスレベル5）",
      847,
      JSON.stringify(["SCP-0048", "SCP-3301"]),
    ],
  });

  await client.execute({
    sql: `INSERT INTO facilities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
    args: [
      "SITE-77",
      "第77研究サイト",
      "Research",
      "██県（詳細非公開）",
      "Active",
      "第77研究サイトは音響アノマリーの専門研究施設。防音設備に特化した構造を持ち、SCP-1729を含む音響系アノマリーの研究を担当する。",
      "████研究主任",
      312,
      JSON.stringify(["SCP-1729"]),
    ],
  });

  // Personnel
  await client.execute({
    sql: `INSERT INTO personnel VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
    args: [
      "PRSN-0077",
      "████ ████",
      "Dr.ミズキ",
      "Researcher",
      3,
      "Active",
      "音響アノマリー専門の上級研究員。SCP-1729の主任研究員を務める。████大学音響工学科卒業後、財団に入職。INC-2024-0311では収容回復の指揮を執った。",
      JSON.stringify(["音響工学", "神経科学", "アノマリー収容"]),
      "SITE-77",
      JSON.stringify(["SCP-1729"]),
    ],
  });

  await client.execute({
    sql: `INSERT INTO personnel VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
    args: [
      "PRSN-0134",
      "████ ████",
      "エージェント・カガミ",
      "Agent",
      2,
      "Active",
      "第19サイト所属の現場エージェント。INC-2024-0311での迅速な対応により表彰を受けた。収容違反対応の専門家として複数のサイトで研修を担当。",
      JSON.stringify(["戦術", "収容違反対応", "近接戦闘"]),
      "SITE-19",
      JSON.stringify(["SCP-0048"]),
    ],
  });

  // Novel
  await client.execute({
    sql: `INSERT INTO novels VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
    args: [
      "novel-001",
      "影の縁で",
      "kage-no-fuchi-de",
      "財団アーキビスト█████",
      "第19サイトの停電事案から始まる、記憶と影をめぐる物語。エージェント・カガミは収容違反を処理する中で、SCP-0048の本質に近づいていく。",
      "Narrative",
      0,
      "published",
    ],
  });

  // Chapters with special markup
  const chapter1Content = `[HEADER]財団機密文書 - クリアランスレベル2以上[/HEADER]

[REDACTED_BLOCK]本文書は財団内部記録に基づく再構成ナラティブである。事実との相違が生じた場合、財団公式記録を優先する。[/REDACTED_BLOCK]

午前3時47分。

第一の警報が鳴り響いた瞬間、[PERSON|PRSN-0134|エージェント・カガミ]は夢の中にいた。

夢の中で彼女は子供の頃の家にいた——廊下の突き当たり、いつも少し傾いていた扉の前に。その扉の向こうから、[ANOMALY|SCP-1729|誰かが歌っている]音が聞こえていた。懐かしい、でも知らない旋律。

[GLITCH]░░░░░░警告░░░░░░[/GLITCH]

彼女が目を開けると、天井の蛍光灯が消えていた。

[TERMINAL]
> SYSTEM: CRITICAL POWER FAILURE
> SITE-19 GRID: OFFLINE
> EMERGENCY LIGHTING: ACTIVATING...
> CONTAINMENT UNITS AFFECTED: 7, 12, 19
> UNIT 19: SCP-0048 CONTAINMENT BREACH
> ALL PERSONNEL: EVACUATE SECTOR C
[/TERMINAL]

非常用照明が赤く点滅する中、カガミは反射的にベッドから飛び起きた。訓練が体に染みついている。

[RUBY|拳銃|ハンドガン]を掴む。懐中電灯を掴む。ドアを蹴り開ける。

廊下は暗かった。

本当の意味で、暗かった。

第19収容サイトには三百八十七の照明装置がある。カガミはそれを知っていた——入職初日に覚えさせられた数字だ。そのすべてが消え、緊急照明だけが三秒おきに赤く明滅している。

[CHOICE]
- 第12収容室へ向かう（SCP-1729の収容確認）
- 第19収容室へ走る（SCP-0048の状況確認）
- 指揮センターへ報告する
[/CHOICE]

彼女は第19収容室へ走った。

訓練通りの判断だ、と後で報告書に書いた。でも本当のことを言えば、ただ怖かったのだ。[ANOMALY|SCP-0048|影が動く]のを廊下の端で見た気がして、その場所から離れたくなかった。

[CHAT]
[MSG|right|カガミ|本部、こちらカガミ。第19収容室に向かっている。SCP-0048の状況は？]
[MSG|left|本部|カガミ、センサーオフライン。目視確認を頼む]
[MSG|left|本部|照明の復旧まで推定28分]
[MSG|right|カガミ|了解。単独で確認する]
[MSG|left|本部|待て——カガミ、単独は——]
[/CHAT]

通信が途絶えた。

[INCIDENT|INC-2024-0311|停電事案]の記録では、この時点から約四分間、カガミの通信ログは空白になっている。彼女自身も、その四分間の記憶がない。

あるのはただ、気づいたら第19収容室のドアの前に立っていたこと。

そして、ドアの前の壁に、自分の影とは別の、もう一つの影があったこと。

[GLITCH]記憶データ欠損 — [ANOMALY|SCP-0048|オブジェクト]との接触による可能性[/GLITCH]

影はカガミの輪郭を持っていた。

でも、カガミとは違う方向を向いていた。`;

  await client.execute({
    sql: `INSERT INTO chapters VALUES (?, ?, ?, ?, ?, ?, unixepoch())`,
    args: [
      "ch-001-01",
      "novel-001",
      "第一章：停電",
      1,
      chapter1Content,
      "published",
    ],
  });

  const chapter2Content = `[HEADER]財団機密文書 — 続き[/HEADER]

後でわかったことだが、[PERSON|PRSN-0077|博士（Dr.ミズキ）]はカガミより五分早く覚醒していた。

音響研究者としての職業的反射——[FACILITY|SITE-77|第77サイト]から[FACILITY|SITE-19|第19サイト]に一時出向していた彼女は、異常な静寂に気づいたのだ。[MODULE|MOD-017|AEGIS遮断プロトコル]の低周波ハム音が消えていた。

[TERMINAL]
> MNEMON SYSTEM STATUS
> NODE: SITE-19-AUXILIARY
> STATUS: OFFLINE (POWER FAILURE)
> LAST BACKUP: 03:44:12
> ESTIMATED RECOVERY: 04:18:00
> WARNING: MEMORY EXTRACTION LOGS MAY BE INCOMPLETE
[/TERMINAL]

彼女は[MODULE|MOD-004|MNEMONシステム]の端末に走り寄ったが、画面はすでに落ちていた。

「最悪のタイミングだ」

呟きながら、彼女は手書きのメモを取り出した。停電時のバックアップ手順——デジタルに頼り切らないための、アナログの知恵。財団に入って最初に教わったことの一つだ。

[CHOICE]
- バックアップ電源を起動しようとする
- カガミを探しに行く
- 第19収容室の状況を確認しに行く
[/CHOICE]

[GLITCH]███████████████████████[/GLITCH]

後の調査で、Dr.ミズキはこの後の十一分間の記憶を持っていないことが判明した。

[CHAT]
[MSG|left|調査官A|先生、十一分間、何をしていたか、本当に覚えていませんか？]
[MSG|right|Dr.ミズキ|本当に。気づいたら廊下に立っていた。手にメモを持って。]
[MSG|left|調査官A|そのメモには何が書いてありましたか？]
[MSG|right|Dr.ミズキ|……数字だった。私の、電話番号だった。でも私が書いたものじゃない。]
[MSG|left|調査官A|筆跡は？]
[MSG|right|Dr.ミズキ|私のものだった。]
[/CHAT]

[REDACTED_BLOCK]以降の██分間の記録は、財団倫理委員会の決定により閲覧制限が設けられている。クリアランスレベル4以上のアクセスについては████-████まで問い合わせること。[/REDACTED_BLOCK]

二人が出会ったのは第19収容室の前だった。

カガミの手には[ANOMALY|SCP-3301|黒い電話機]があった。

「なぜそれを持っている？」とDr.ミズキは聞いた。

「わからない」とカガミは答えた。「気づいたらここにいた。でも……」

彼女はためらった。

「電話が、鳴っていたんです。」

[GLITCH]░░░記録終了░░░[/GLITCH]`;

  await client.execute({
    sql: `INSERT INTO chapters VALUES (?, ?, ?, ?, ?, ?, unixepoch())`,
    args: [
      "ch-001-02",
      "novel-001",
      "第二章：欠落",
      2,
      chapter2Content,
      "published",
    ],
  });

  console.log("✅ Seed data inserted successfully.");

  console.log("✅ Seed complete.");
  await client.close();
}

// ── CLIから直接実行 ─────────────────────────────────────────────────
if (require.main === module || process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  runSeed().catch((e) => { console.error(e); process.exit(1); });
}
