// 編集日時: 2026-04-29
// EPUB生成（JSZipを使った簡易EPUBv2）
import { db } from "@/db/client";
import { chapters, novels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function stripNml(content: string): string {
  return content
    .replace(/\[(?:ANOMALY|MODULE|INCIDENT|FACILITY|PERSON)\|[^|]+\|([^\]]+)\]/g, "$1")
    .replace(/\[RUBY\|([^|]+)\|[^\]]+\]/g, "$1")
    .replace(/\[DOT\|([^\]]+)\]/g, "$1")
    .replace(/\[EM\|([^\]]+)\]/g, "$1")
    .replace(/\[STRONG\|([^\]]+)\]/g, "<strong>$1</strong>")
    .replace(/\[CORRUPT\|([^|\]]+)[^\]]*\]/g, "████")
    .replace(/\[SYS\|([^|\]]+)(?:\|[^\]]*)?\]/g, "<code>$1</code>")
    .replace(/\[HEADER\]([\s\S]*?)\[\/HEADER\]/g, "<h2>$1</h2>")
    .replace(/\[GLITCH\]([\s\S]*?)\[\/GLITCH\]/g, "<span class=\"glitch\">$1</span>")
    .replace(/\[TERMINAL(?:[^\]]*)\]([\s\S]*?)\[\/TERMINAL\]/g, "<pre>$1</pre>")
    .replace(/\[REDACTED_BLOCK[^\]]*\]([\s\S]*?)\[\/REDACTED_BLOCK\]/g, "<span class=\"redacted\">██████</span>")
    .replace(/\[CLEARANCE\|\d+\]([\s\S]*?)\[\/CLEARANCE\]/g, "$1")
    .replace(/\[WARN\|[^\]]+\]([\s\S]*?)\[\/WARN\]/g, "<blockquote>$1</blockquote>")
    .replace(/\[LOG\|([^|]+)(?:\|[^\]]*)?\]([\s\S]*?)\[\/LOG\]/g, "<section><h3>$1</h3>$2</section>")
    .replace(/\[INTERVIEW\|([^\]]+)\]([\s\S]*?)\[\/INTERVIEW\]/g, "<section><h3>$1</h3>$2</section>")
    .replace(/\[Q\|([^\]]+)\]/g, "<p><strong>Q: $1</strong></p>")
    .replace(/\[A\|(?:[^\]|]+\|)?([^\]]+)\]/g, "<p>A: $1</p>")
    .replace(/\[GLOSSARY\]([\s\S]*?)\[\/GLOSSARY\]/g, "<dl>$1</dl>")
    .replace(/\[TERM\|([^|]+)\|([^\]]+)\]/g, "<dt>$1</dt><dd>$2</dd>")
    .replace(/\[DIALOG\]([\s\S]*?)\[\/DIALOG\]/g, "<div class=\"dialog\">$1</div>")
    .replace(/\[LINE\|[^|]+\|([^|]+)\|([^\]]+)\]/g, "<p>$1 $2</p>")
    .replace(/\[CHAT\]([\s\S]*?)\[\/CHAT\]/g, "<div class=\"chat\">$1</div>")
    .replace(/\[MSG\|[^|]+\|([^|]+)\|([^\]]+)\]/g, "<p>$1: $2</p>")
    .replace(/\[CALL\|([^\]]+)\]([\s\S]*?)\[\/CALL\]/g, "<section>$2</section>")
    .replace(/\[VOICE\|[^|]+\|([^|]+)\|([^\]]+)\]/g, "<p>$1: $2</p>")
    .replace(/\[FOOTNOTE\]([\s\S]*?)\[\/FOOTNOTE\]/g, "<footer>$1</footer>")
    .replace(/\[N\|(\d+)\|([^\]]+)\]/g, "<p>※$1 $2</p>")
    .replace(/\[HR[^\]]*\]/g, "<hr/>")
    .replace(/\[IMAGE\|[^|]+\|([^\]]+)\]/g, "<figure><figcaption>$1</figcaption></figure>")
    .replace(/\[COUNTER\|([^|]+)\|([^\]]+)\]/g, "<span>$1: $2</span>")
    .replace(/\[POV\|([^\]]+)\]/g, "<p class=\"pov\">— $1 —</p>")
    .replace(/\[NOTE\|(\d+)\]/g, "<sup>※$1</sup>")
    .replace(/\[TIME\|([^\]]+)\]/g, "<span class=\"time\">[$1]</span>")
    .replace(/\[CHOICE\]([\s\S]*?)\[\/CHOICE\]/g, "")
    .replace(/\[CHOICE3\]([\s\S]*?)\[\/CHOICE3\]/g, "")
    .replace(/\[[^\]]*\]/g, "");
}

function toXhtml(title: string, body: string, chNum: number): string {
  const paragraphs = body.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    .map(p => p.startsWith("<") ? p : `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja">
<head><meta charset="UTF-8"/><title>${title}</title><link rel="stylesheet" href="../Styles/style.css"/></head>
<body><h1>${title}</h1>${paragraphs}</body>
</html>`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const novelRows = await db.select().from(novels).where(eq(novels.slug, slug));
  if (!novelRows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const novel = novelRows[0];
  const chapterList = await db.select().from(chapters).where(eq(chapters.novelId, novel.id)).orderBy(chapters.chapterNumber);

  // JSZipがない環境向け: Zip構造をシンプルに生成せず、プレーンHTML単ファイルで代替
  // 本番では "jszip" を npm install して使用
  const bodyChapters = chapterList.map((ch) => `
<div class="chapter" id="ch${ch.chapterNumber}">
  <h2>${ch.chapterNumber}章 ${ch.title}</h2>
  ${stripNml(ch.content).split(/\n\n+/).map(p => p.trim() ? (p.startsWith("<") ? p : `<p>${p.replace(/\n/g, "<br/>")}</p>`) : "").join("\n")}
</div>`).join("\n<hr/>\n");

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"/>
<title>${novel.title}</title>
<style>
  body { font-family: "Noto Serif JP", Georgia, serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.9; color: #1a1a1a; }
  h1 { font-size: 1.8rem; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; }
  h2 { font-size: 1.2rem; margin-top: 3rem; color: #333; }
  h3 { font-size: 1rem; color: #555; }
  p  { margin: 0.8em 0; }
  pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; font-size: 0.85em; }
  blockquote { border-left: 3px solid #ccc; padding-left: 1rem; color: #555; }
  .redacted { background: #1a1a1a; color: #1a1a1a; }
  .pov { text-align: center; color: #888; font-size: 0.9em; }
  dt { font-weight: bold; margin-top: 0.5em; }
  dd { margin-left: 1em; color: #555; }
  sup { font-size: 0.7em; color: #888; }
  .time { color: #888; font-size: 0.85em; font-family: monospace; }
</style>
</head>
<body>
<h1>${novel.title}</h1>
<p style="color:#888">著者: ${novel.author}</p>
<nav><h2>目次</h2><ol>
${chapterList.map(ch => `<li><a href="#ch${ch.chapterNumber}">${ch.chapterNumber}章 ${ch.title}</a></li>`).join("\n")}
</ol></nav>
${bodyChapters}
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(novel.title)}.html"`,
    },
  });
}
