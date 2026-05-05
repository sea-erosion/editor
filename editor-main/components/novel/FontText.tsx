// 編集日時: 2026-05-03
"use client";

import { useEffect, useRef, useState } from "react";

interface FontDef {
  file: string;
  label: string;
}

type FontMap = Record<string, FontDef>;

// ── フォント定義キャッシュ ──────────────────────────────────────────────
// fonts.json の fetch 結果をモジュールスコープでキャッシュし、
// 複数の FontText インスタンスが同時にリクエストを飛ばさないようにする。
let fontMapCache: FontMap | null = null;
let fontMapPromise: Promise<FontMap> | null = null;

async function loadFontMap(): Promise<FontMap> {
  if (fontMapCache) return fontMapCache;
  if (!fontMapPromise) {
    fontMapPromise = fetch("/fonts/fonts.json")
      .then((r) => {
        if (!r.ok) throw new Error(`fonts.json fetch failed: ${r.status}`);
        return r.json() as Promise<FontMap>;
      })
      .then((data) => {
        // _comment キーは除外
        const clean: FontMap = {};
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith("_")) continue;
          if (v && typeof v === "object" && "file" in v && "label" in v) {
            clean[k] = v as FontDef;
          }
        }
        fontMapCache = clean;
        return clean;
      });
  }
  return fontMapPromise;
}

// ── 挿入済み @font-face を追跡 ─────────────────────────────────────────
const injectedFonts = new Set<string>();

function injectFontFace(key: string, def: FontDef) {
  if (injectedFonts.has(key)) return;
  injectedFonts.add(key);

  const familyName = `nml-font-${key}`;
  const style = document.createElement("style");
  style.setAttribute("data-nml-font", key);
  style.textContent = `
@font-face {
  font-family: "${familyName}";
  src: url("/fonts/${def.file}") format("woff2");
  font-display: swap;
}`;
  document.head.appendChild(style);
}

// ── コンポーネント ─────────────────────────────────────────────────────

interface FontTextProps {
  fontKey: string;
  content: string;
}

type LoadState = "loading" | "ready" | "error";

export function FontText({ fontKey, content }: FontTextProps) {
  const [state, setState] = useState<LoadState>("loading");
  const [label, setLabel] = useState<string>("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadFontMap()
      .then((map) => {
        if (!mountedRef.current) return;
        const def = map[fontKey];
        if (!def) {
          setState("error");
          return;
        }
        injectFontFace(fontKey, def);
        setLabel(def.label);
        setState("ready");
      })
      .catch(() => {
        if (mountedRef.current) setState("error");
      });
    return () => { mountedRef.current = false; };
  }, [fontKey]);

  if (state === "loading") {
    return <span>{content}</span>;
  }

  if (state === "error") {
    // フォントが見つからない場合はフォールバック表示（エディタでは視認しやすいよう注記）
    return (
      <span
        title={`NML: フォントキー "${fontKey}" が fonts.json に見つかりません`}
        className="underline decoration-dotted decoration-red-600/60"
      >
        {content}
      </span>
    );
  }

  return (
    <span
      style={{ fontFamily: `"nml-font-${fontKey}", serif` }}
      title={label}
    >
      {content}
    </span>
  );
}
