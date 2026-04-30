// 編集日時: 2026-04-29
import { Token } from "@/types";

/**
 * Novel Markup Language (NML) Parser
 *
 * ── エンティティタグ ──
 * [ANOMALY|ID|Label]  [MODULE|ID|Label]  [INCIDENT|ID|Label]
 * [FACILITY|ID|Label] [PERSON|ID|Label]
 *
 * ── ブロックタグ ──
 * [HEADER]...[/HEADER]
 * [REDACTED_BLOCK|level=N]...[/REDACTED_BLOCK]
 * [GLITCH]...[/GLITCH]
 * [TERMINAL|prompt=#]...[/TERMINAL]
 * [CHOICE]\n- opt\n[/CHOICE]
 * [CHOICE3]A|B|C[/CHOICE3]
 * [CHAT]\n[MSG|left/right|Name|Text]\n[/CHAT]
 * [DIALOG]\n[LINE|役割|記号|テキスト]\n[/DIALOG]
 * [GLOSSARY]\n[TERM|用語|説明]\n[/GLOSSARY]
 * [LOG|タイトル|日付?]...[/LOG]
 * [CALL|ヘッダー]\n[VOICE|left/right|名前|テキスト]\n[/CALL]
 * [FOOTNOTE]\n[N|番号|テキスト]\n[/FOOTNOTE]
 * [INTERVIEW|ヘッダー]\n[Q|テキスト]\n[A|話者|テキスト]\n[/INTERVIEW]
 * [CLEARANCE|N]...[/CLEARANCE]
 * [WARN|level|タイトル?]...[/WARN]
 * [SYS|英語|日本語訳]
 * [HR] [HR|dots] [HR|stars]
 * [IMAGE|type|キャプション]
 * [COUNTER|ラベル|値]
 * [POV|人物名]
 *
 * ── インラインタグ ──
 * [RUBY|base|reading]  [DOT|テキスト]  [EM|テキスト]  [STRONG|テキスト]
 * [CORRUPT|テキスト|level=N]  [NOTE|番号]  [TIME|時刻]
 */

export function parseNovelMarkup(source: string): Token[] {
  const tokens: Token[] = [];

  const blockPatterns: Array<{ pattern: RegExp; handler: (m: RegExpExecArray) => Token | null }> = [
    { pattern: /\[HEADER\]([\s\S]*?)\[\/HEADER\]/g,
      handler: (m) => ({ type: "header", content: m[1].trim() }) },
    { pattern: /\[REDACTED_BLOCK(?:\|([^\]]*))?\]([\s\S]*?)\[\/REDACTED_BLOCK\]/g,
      handler: (m) => ({ type: "redacted", content: m[2].trim(),
        meta: m[1] ? Object.fromEntries(m[1].split(",").map((p) => p.split("=") as [string,string])) : {} }) },
    { pattern: /\[GLITCH\]([\s\S]*?)\[\/GLITCH\]/g,
      handler: (m) => ({ type: "glitch", content: m[1] }) },
    { pattern: /\[TERMINAL(?:\|([^\]]*))?\]([\s\S]*?)\[\/TERMINAL\]/g,
      handler: (m) => ({ type: "terminal", content: m[2].trim(),
        meta: m[1] ? Object.fromEntries(m[1].split(",").map((p) => p.split("=") as [string,string])) : {} }) },
    { pattern: /\[CHOICE\]([\s\S]*?)\[\/CHOICE\]/g,
      handler: (m) => ({ type: "choice", content: m[1].trim() }) },
    { pattern: /\[CHOICE3\]([\s\S]*?)\[\/CHOICE3\]/g,
      handler: (m) => ({ type: "choice3", content: m[1].trim() }) },
    { pattern: /\[CHAT\]([\s\S]*?)\[\/CHAT\]/g,
      handler: (m) => ({ type: "chat", content: m[1].trim() }) },
    { pattern: /\[DIALOG\]([\s\S]*?)\[\/DIALOG\]/g,
      handler: (m) => ({ type: "dialog", content: m[1].trim() }) },
    { pattern: /\[GLOSSARY\]([\s\S]*?)\[\/GLOSSARY\]/g,
      handler: (m) => ({ type: "glossary", content: m[1].trim() }) },
    // LOG
    { pattern: /\[LOG\|([^\]|]+)(?:\|([^\]]*))?\]([\s\S]*?)\[\/LOG\]/g,
      handler: (m) => ({ type: "log", content: m[3].trim(), label: m[1].trim(), meta: { date: m[2]?.trim() ?? "" } }) },
    // CALL
    { pattern: /\[CALL\|([^\]]+)\]([\s\S]*?)\[\/CALL\]/g,
      handler: (m) => ({ type: "call", content: m[2].trim(), label: m[1].trim() }) },
    // FOOTNOTE
    { pattern: /\[FOOTNOTE\]([\s\S]*?)\[\/FOOTNOTE\]/g,
      handler: (m) => ({ type: "footnote", content: m[1].trim() }) },
    // INTERVIEW
    { pattern: /\[INTERVIEW\|([^\]]+)\]([\s\S]*?)\[\/INTERVIEW\]/g,
      handler: (m) => ({ type: "interview", content: m[2].trim(), label: m[1].trim() }) },
    // CLEARANCE
    { pattern: /\[CLEARANCE\|(\d+)\]([\s\S]*?)\[\/CLEARANCE\]/g,
      handler: (m) => ({ type: "clearance", content: m[2].trim(), meta: { level: m[1] } }) },
    // WARN
    { pattern: /\[WARN\|(danger|info|caution)(?:\|([^\]]*))?\]([\s\S]*?)\[\/WARN\]/g,
      handler: (m) => ({ type: "warn", content: m[3].trim(), meta: { level: m[1], title: m[2]?.trim() ?? "" } }) },
    // SYS
    { pattern: /\[SYS\|([^\]|]+)(?:\|([^\]]*))?\]/g,
      handler: (m) => ({ type: "sys", content: m[1].trim(), label: m[2]?.trim() ?? "" }) },
    // HR
    { pattern: /\[HR(?:\|([^\]]*))?\]/g,
      handler: (m) => ({ type: "hr", content: m[1]?.trim() ?? "" }) },
    // IMAGE
    { pattern: /\[IMAGE\|([^\]|]+)\|([^\]]+)\]/g,
      handler: (m) => ({ type: "image_placeholder", content: m[2].trim(), meta: { imgType: m[1].trim() } }) },
    // COUNTER
    { pattern: /\[COUNTER\|([^\]|]+)\|([^\]]+)\]/g,
      handler: (m) => ({ type: "counter", content: m[2].trim(), label: m[1].trim() }) },
    // POV
    { pattern: /\[POV\|([^\]]+)\]/g,
      handler: (m) => ({ type: "pov", content: m[1].trim() }) },
  ];

  const inlinePatterns: Array<{ pattern: RegExp; handler: (m: RegExpExecArray) => Token }> = [
    { pattern: /\[ANOMALY\|([^\]|]+)\|([^\]]+)\]/g,  handler: (m) => ({ type: "anomaly_tag",   content: m[2], entityId: m[1], label: m[2] }) },
    { pattern: /\[MODULE\|([^\]|]+)\|([^\]]+)\]/g,   handler: (m) => ({ type: "module_tag",    content: m[2], entityId: m[1], label: m[2] }) },
    { pattern: /\[INCIDENT\|([^\]|]+)\|([^\]]+)\]/g, handler: (m) => ({ type: "incident_tag",  content: m[2], entityId: m[1], label: m[2] }) },
    { pattern: /\[FACILITY\|([^\]|]+)\|([^\]]+)\]/g, handler: (m) => ({ type: "facility_tag",  content: m[2], entityId: m[1], label: m[2] }) },
    { pattern: /\[PERSON\|([^\]|]+)\|([^\]]+)\]/g,   handler: (m) => ({ type: "personnel_tag", content: m[2], entityId: m[1], label: m[2] }) },
    { pattern: /\[RUBY\|([^\]|]+)\|([^\]]+)\]/g,     handler: (m) => ({ type: "ruby",    content: m[1], label: m[2] }) },
    { pattern: /\[DOT\|([^\]]+)\]/g,                 handler: (m) => ({ type: "dot",     content: m[1] }) },
    { pattern: /\[EM\|([^\]]+)\]/g,                   handler: (m) => ({ type: "em",      content: m[1] }) },
    { pattern: /\[STRONG\|([^\]]+)\]/g,               handler: (m) => ({ type: "strong",  content: m[1] }) },
    { pattern: /\[CORRUPT\|([^\]|]+)(?:\|([^\]]*))?\]/g, handler: (m) => ({ type: "corrupt", content: m[1],
        meta: m[2] ? Object.fromEntries(m[2].split(",").map((p) => p.split("=") as [string,string])) : {} }) },
    { pattern: /\[NOTE\|(\d+)\]/g,                   handler: (m) => ({ type: "note_ref", content: m[1] }) },
    { pattern: /\[TIME\|([^\]]+)\]/g,                 handler: (m) => ({ type: "timestamp", content: m[1] }) },
  ];

  type Seg = { kind: "text"; value: string } | { kind: "token"; token: Token };
  const segs: Seg[] = [{ kind: "text", value: source }];

  for (const { pattern, handler } of blockPatterns) {
    const next: Seg[] = [];
    for (const seg of segs) {
      if (seg.kind === "token") { next.push(seg); continue; }
      const text = seg.value;
      let last = 0; pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null) {
        if (m.index > last) next.push({ kind: "text", value: text.slice(last, m.index) });
        const r = handler(m);
        if (r) next.push({ kind: "token", token: r });
        last = m.index + m[0].length;
      }
      if (last < text.length) next.push({ kind: "text", value: text.slice(last) });
    }
    segs.splice(0, segs.length, ...next);
  }

  for (const seg of segs) {
    if (seg.kind === "token") { tokens.push(seg.token); continue; }
    const text = seg.value;
    type IM = { index: number; end: number; token: Token };
    const matches: IM[] = [];
    for (const { pattern, handler } of inlinePatterns) {
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null)
        matches.push({ index: m.index, end: m.index + m[0].length, token: handler(m) });
    }
    matches.sort((a, b) => a.index - b.index);
    const filtered: IM[] = []; let cur = 0;
    for (const x of matches) { if (x.index >= cur) { filtered.push(x); cur = x.end; } }
    let pos = 0;
    for (const x of filtered) {
      if (x.index > pos) { const t = text.slice(pos, x.index); if (t) tokens.push({ type: "text", content: t }); }
      tokens.push(x.token); pos = x.end;
    }
    if (pos < text.length) { const t = text.slice(pos); if (t) tokens.push({ type: "text", content: t }); }
  }
  return tokens;
}

export function parseChatMessages(s: string) {
  const r: Array<{ side: "left"|"right"; name: string; text: string }> = [];
  let m: RegExpExecArray | null;
  const p = /\[MSG\|(left|right)\|([^\]|]+)\|([^\]]+)\]/g;
  while ((m = p.exec(s)) !== null) r.push({ side: m[1] as "left"|"right", name: m[2], text: m[3] });
  return r;
}
export function parseChoiceOptions(s: string): string[] {
  return s.split("\n").map(l=>l.trim()).filter(l=>l.startsWith("- ")).map(l=>l.slice(2).trim());
}
export function parseChoice3Options(s: string): string[] {
  return s.split("|").map(s=>s.trim()).filter(Boolean);
}
export function parseDialogLines(s: string) {
  const r: Array<{ role: string; symbol: string; text: string }> = [];
  let m: RegExpExecArray | null;
  const p = /\[LINE\|([^\]|]+)\|([^\]|]+)\|([^\]]+)\]/g;
  while ((m = p.exec(s)) !== null) r.push({ role: m[1].trim(), symbol: m[2].trim(), text: m[3].trim() });
  return r;
}
export function parseGlossaryTerms(s: string) {
  const r: Array<{ term: string; desc: string }> = [];
  let m: RegExpExecArray | null;
  const p = /\[TERM\|([^\]|]+)\|([^\]]+)\]/g;
  while ((m = p.exec(s)) !== null) r.push({ term: m[1].trim(), desc: m[2].trim() });
  return r;
}
export function parseVoiceLines(s: string) {
  const r: Array<{ side: "left"|"right"; name: string; text: string }> = [];
  let m: RegExpExecArray | null;
  const p = /\[VOICE\|(left|right)\|([^\]|]+)\|([^\]]+)\]/g;
  while ((m = p.exec(s)) !== null) r.push({ side: m[1] as "left"|"right", name: m[2].trim(), text: m[3].trim() });
  return r;
}
export function parseFootnoteItems(s: string) {
  const r: Array<{ num: number; text: string }> = [];
  let m: RegExpExecArray | null;
  const p = /\[N\|(\d+)\|([^\]]+)\]/g;
  while ((m = p.exec(s)) !== null) r.push({ num: parseInt(m[1], 10), text: m[2].trim() });
  return r;
}
export function parseInterviewLines(s: string) {
  const r: Array<{ type: "Q"|"A"; speaker?: string; text: string }> = [];
  let m: RegExpExecArray | null;
  const qp = /\[Q\|([^\]]+)\]/g;
  const ap = /\[A\|([^\]|]+)\|([^\]]+)\]/g;
  // 両方を位置順にマージ
  type RL = { index: number; line: { type: "Q"|"A"; speaker?: string; text: string } };
  const all: RL[] = [];
  while ((m = qp.exec(s)) !== null) all.push({ index: m.index, line: { type: "Q", text: m[1].trim() } });
  while ((m = ap.exec(s)) !== null) all.push({ index: m.index, line: { type: "A", speaker: m[1].trim(), text: m[2].trim() } });
  all.sort((a, b) => a.index - b.index);
  return all.map(x => x.line);
}
