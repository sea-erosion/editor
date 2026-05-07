// 編集日時: 2026-04-28 / 2026-05-07 (fix: エンティティ検索をadminFetchに変更)
"use client";

import { adminFetch } from "@/lib/admin-fetch";
import { buildHighlightedHTML } from "@/lib/nml-highlight";
import { useCallback, useEffect, useRef, useState } from "react";

interface NmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SNIPPET_GROUPS: Array<{
  group: string;
  items: Array<{
    label: string;
    title: string;
    color: string;
    insert: (sel: string) => { text: string; cursorOffset: number };
  }>;
}> = [
  {
    group: "エンティティ",
    items: [
      { label: "ANO", title: "アノマリータグ [ANOMALY|ID|ラベル]", color: "text-amber-400 hover:bg-amber-900/30 border-amber-800/50",
        insert: (sel) => ({ text: `[ANOMALY|SCP-XXXX|${sel || "ラベル"}]`, cursorOffset: sel ? 0 : -1 }) },
      { label: "MOD", title: "モジュールタグ [MODULE|ID|ラベル]", color: "text-cyan-400 hover:bg-cyan-900/30 border-cyan-800/50",
        insert: (sel) => ({ text: `[MODULE|MOD-XXX|${sel || "ラベル"}]`, cursorOffset: sel ? 0 : -1 }) },
      { label: "INC", title: "インシデントタグ [INCIDENT|ID|ラベル]", color: "text-red-400 hover:bg-red-900/30 border-red-800/50",
        insert: (sel) => ({ text: `[INCIDENT|INC-XXXX-XXXX|${sel || "ラベル"}]`, cursorOffset: sel ? 0 : -1 }) },
      { label: "FAC", title: "施設タグ [FACILITY|ID|ラベル]", color: "text-green-400 hover:bg-green-900/30 border-green-800/50",
        insert: (sel) => ({ text: `[FACILITY|SITE-XX|${sel || "ラベル"}]`, cursorOffset: sel ? 0 : -1 }) },
      { label: "PER", title: "人員タグ [PERSON|ID|ラベル]", color: "text-violet-400 hover:bg-violet-900/30 border-violet-800/50",
        insert: (sel) => ({ text: `[PERSON|PRSN-XXXX|${sel || "ラベル"}]`, cursorOffset: sel ? 0 : -1 }) },
    ],
  },
  {
    group: "ブロック",
    items: [
      { label: "HDR", title: "ヘッダーブロック", color: "text-gray-400 hover:bg-gray-700/30 border-gray-700/50",
        insert: (sel) => ({ text: `[HEADER]${sel || "財団機密文書"}[/HEADER]`, cursorOffset: sel ? 0 : -9 }) },
      { label: "RED", title: "黒塗りブロック", color: "text-gray-500 hover:bg-gray-700/30 border-gray-700/50",
        insert: (sel) => ({ text: `[REDACTED_BLOCK]${sel || "機密情報"}[/REDACTED_BLOCK]`, cursorOffset: sel ? 0 : -17 }) },
      { label: "GLT", title: "グリッチテキスト", color: "text-red-500 hover:bg-red-900/20 border-red-900/50",
        insert: (sel) => ({ text: `[GLITCH]${sel || "░░░データ破損░░░"}[/GLITCH]`, cursorOffset: sel ? 0 : -8 }) },
      { label: "TRM", title: "ターミナルブロック [TERMINAL|prompt=#]", color: "text-green-500 hover:bg-green-900/20 border-green-900/50",
        insert: () => ({ text: `[TERMINAL]\n> SYSTEM: \n> STATUS: \n[/TERMINAL]`, cursorOffset: -12 }) },
      { label: "SYS", title: "システムログ行 [SYS|英語|日本語訳]", color: "text-gray-400 hover:bg-gray-700/20 border-gray-700/50",
        insert: () => ({ text: `[SYS|Boot complete.|起動完了]`, cursorOffset: 0 }) },
      { label: "CHO", title: "縦選択肢ブロック", color: "text-yellow-500 hover:bg-yellow-900/20 border-yellow-900/50",
        insert: () => ({ text: `[CHOICE]\n- 選択肢1\n- 選択肢2\n- 選択肢3\n[/CHOICE]`, cursorOffset: 0 }) },
      { label: "C3",  title: "横並び3択 [CHOICE3]A|B|C[/CHOICE3]", color: "text-yellow-400 hover:bg-yellow-900/20 border-yellow-800/50",
        insert: () => ({ text: `[CHOICE3]Yes|はい|読みたい[/CHOICE3]`, cursorOffset: 0 }) },
      { label: "CHT", title: "チャットブロック", color: "text-teal-400 hover:bg-teal-900/20 border-teal-900/50",
        insert: () => ({ text: `[CHAT]\n[MSG|right|名前|メッセージ]\n[MSG|left|相手|返信]\n[/CHAT]`, cursorOffset: 0 }) },
      { label: "DLG", title: "ノベル形式会話 [DIALOG]...[LINE|役割|記号|テキスト]...[/DIALOG]", color: "text-cyan-500 hover:bg-cyan-900/20 border-cyan-900/50",
        insert: () => ({ text: `[DIALOG]\n[LINE|AI|＄|やあ、この日記を読んでいるんだね]\n[LINE|USER|>>|おーい！]\n[/DIALOG]`, cursorOffset: 0 }) },
      { label: "GLS", title: "用語定義リスト [GLOSSARY]...[TERM|用語|説明]...[/GLOSSARY]", color: "text-indigo-400 hover:bg-indigo-900/20 border-indigo-900/50",
        insert: () => ({ text: `[GLOSSARY]\n[TERM|海蝕現象|海と呼ばれる異次元の存在が地球に現れること]\n[TERM|収束員|海蝕実体に実際に対処する班]\n[/GLOSSARY]`, cursorOffset: 0 }) },
      { label: "LOG", title: "記録ブロック [LOG|タイトル|日付]...[/LOG]", color: "text-gray-400 hover:bg-gray-700/20 border-gray-700/50",
        insert: () => ({ text: `[LOG|収束活動報告|${new Date().toISOString().slice(0,10)}]\n記録内容\n[/LOG]`, cursorOffset: 0 }) },
      { label: "CALL", title: "無線通話 [CALL|ヘッダー]...[VOICE|left/right|名前|テキスト]...[/CALL]", color: "text-emerald-500 hover:bg-emerald-900/20 border-emerald-900/50",
        insert: () => ({ text: `[CALL|オペレーター → 収束員]\n[VOICE|left|オペレーター|応答してください]\n[VOICE|right|収束員|了解、現場到着]\n[/CALL]`, cursorOffset: 0 }) },
      { label: "FN",  title: "脚注 [FOOTNOTE]...[N|番号|内容]...[/FOOTNOTE]　※本文中は[NOTE|番号]", color: "text-gray-500 hover:bg-gray-700/20 border-gray-700/50",
        insert: () => ({ text: `[FOOTNOTE]\n[N|1|編集者注：この記述は…]\n[/FOOTNOTE]`, cursorOffset: 0 }) },
      { label: "INT", title: "インタビュー [INTERVIEW|ヘッダー]...[Q|質問][A|話者|回答]...[/INTERVIEW]", color: "text-amber-500/80 hover:bg-amber-900/20 border-amber-900/50",
        insert: () => ({ text: `[INTERVIEW|聞き手：██研究員]\n[Q|対象はどのように見えましたか？]\n[A|対象|まるで、海みたいで…]\n[/INTERVIEW]`, cursorOffset: 0 }) },
      { label: "CLR", title: "クリアランスゲート [CLEARANCE|N]...[/CLEARANCE]", color: "text-red-600 hover:bg-red-900/20 border-red-900/50",
        insert: () => ({ text: `[CLEARANCE|3]\nクリアランスLv.3以上の機密内容\n[/CLEARANCE]`, cursorOffset: 0 }) },
      { label: "WRN", title: "警告バナー [WARN|danger/info/caution|タイトル]...[/WARN]", color: "text-yellow-600 hover:bg-yellow-900/20 border-yellow-900/50",
        insert: () => ({ text: `[WARN|danger|緊急警告]\n警告内容\n[/WARN]`, cursorOffset: 0 }) },
      { label: "IMG", title: "画像プレースホルダー [IMAGE|type|キャプション]", color: "text-gray-600 hover:bg-gray-700/20 border-gray-800/50",
        insert: () => ({ text: `[IMAGE|photo|現場スケッチ #1]`, cursorOffset: 0 }) },
      { label: "CNT", title: "カウンター [COUNTER|ラベル|値]", color: "text-gray-600 hover:bg-gray-700/20 border-gray-800/50",
        insert: () => ({ text: `[COUNTER|収容状況|3/7]`, cursorOffset: 0 }) },
      { label: "POV", title: "視点マーカー [POV|人物名]", color: "text-gray-500 hover:bg-gray-700/20 border-gray-700/50",
        insert: () => ({ text: `[POV|九重 蓮]`, cursorOffset: 0 }) },
      { label: "HR",  title: "区切り線 [HR] [HR|dots] [HR|stars]", color: "text-gray-600 hover:bg-gray-700/20 border-gray-800/50",
        insert: () => ({ text: `[HR]`, cursorOffset: 0 }) },
    ],
  },
  {
    group: "インライン",
    items: [
      { label: "RB",  title: "ルビ [RUBY|漢字|よみ]", color: "text-gray-400 hover:bg-gray-700/30 border-gray-700/50",
        insert: (sel) => ({ text: `[RUBY|${sel || "漢字"}|よみ]`, cursorOffset: sel ? -3 : -5 }) },
      { label: "DOT", title: "傍点 [DOT|テキスト]", color: "text-gray-400 hover:bg-gray-700/30 border-gray-700/50",
        insert: (sel) => ({ text: `[DOT|${sel || "テキスト"}]`, cursorOffset: sel ? 0 : -1 }) },
      { label: "EM",  title: "傍線強調 [EM|テキスト]", color: "text-gray-300 hover:bg-gray-700/30 border-gray-600/50",
        insert: (sel) => ({ text: `[EM|${sel || "強調テキスト"}]`, cursorOffset: sel ? 0 : -1 }) },
      { label: "STR", title: "太字 [STRONG|テキスト]", color: "text-gray-200 hover:bg-gray-700/30 border-gray-600/50",
        insert: (sel) => ({ text: `[STRONG|${sel || "強調テキスト"}]`, cursorOffset: sel ? 0 : -1 }) },
      { label: "CRP", title: "文字化けプロテクト [CORRUPT|テキスト|level=N]", color: "text-gray-700 hover:bg-gray-800/30 border-gray-800/50",
        insert: (sel) => ({ text: `[CORRUPT|${sel || "田中太郎"}]`, cursorOffset: sel ? 0 : -1 }) },
    ],
  },
];

type EntityType = "anomaly" | "module" | "incident" | "facility" | "personnel";

const ENTITY_CONFIG: Record<EntityType, { label: string; color: string; tagFn: (id: string, name: string) => string }> = {
  anomaly:   { label: "アノマリー",   color: "text-amber-400",  tagFn: (id, n) => `[ANOMALY|${id}|${n}]` },
  module:    { label: "モジュール",   color: "text-cyan-400",   tagFn: (id, n) => `[MODULE|${id}|${n}]` },
  incident:  { label: "インシデント", color: "text-red-400",    tagFn: (id, n) => `[INCIDENT|${id}|${n}]` },
  facility:  { label: "施設",         color: "text-green-400",  tagFn: (id, n) => `[FACILITY|${id}|${n}]` },
  personnel: { label: "人員",         color: "text-violet-400", tagFn: (id, n) => `[PERSON|${id}|${n}]` },
};

const NML_REFERENCE = [
  {
    category: "エンティティタグ",
    items: [
      { syntax: "[ANOMALY|SCP-XXXX|ラベル]",  desc: "アノマリーへのリンク（琥珀色）" },
      { syntax: "[MODULE|MOD-XXX|ラベル]",    desc: "モジュールへのリンク（シアン）" },
      { syntax: "[INCIDENT|INC-XXXX|ラベル]", desc: "インシデントへのリンク（赤）" },
      { syntax: "[FACILITY|SITE-XX|ラベル]",  desc: "施設へのリンク（緑）" },
      { syntax: "[PERSON|PRSN-XXXX|ラベル]",  desc: "人員へのリンク（紫）" },
    ],
  },
  {
    category: "ブロックタグ",
    items: [
      { syntax: "[HEADER]文字列[/HEADER]",                       desc: "文書ヘッダー" },
      { syntax: "[REDACTED_BLOCK|level=N]...[/REDACTED_BLOCK]",  desc: "黒塗り。level=3で解除不可" },
      { syntax: "[GLITCH]文字列[/GLITCH]",                       desc: "グリッチアニメーション" },
      { syntax: "[TERMINAL|prompt=#]\\n行\\n[/TERMINAL]",        desc: "ターミナル。prompt=で記号変更" },
      { syntax: "[SYS|英語ログ|日本語訳]",                       desc: "システムログ行（訳なしも可）" },
      { syntax: "[CHOICE]\\n- 選択肢\\n[/CHOICE]",               desc: "縦並び選択肢" },
      { syntax: "[CHOICE3]A|B|C[/CHOICE3]",                      desc: "横並び3択ボタン" },
      { syntax: "[CHAT]\\n[MSG|left/right|名前|テキスト]\\n[/CHAT]", desc: "チャットバブル形式" },
      { syntax: "[DIALOG]\\n[LINE|役割|記号|テキスト]\\n[/DIALOG]",  desc: "ノベル形式の会話ブロック" },
      { syntax: "[GLOSSARY]\\n[TERM|用語|説明]\\n[/GLOSSARY]",   desc: "折りたたみ用語集" },
      { syntax: "[LOG|タイトル|日付]...[/LOG]",                  desc: "日付付き記録・日誌ブロック" },
      { syntax: "[CALL|ヘッダー]\\n[VOICE|left/right|名前|テキスト]\\n[/CALL]", desc: "無線通話ブロック" },
      { syntax: "[FOOTNOTE]\\n[N|番号|内容]\\n[/FOOTNOTE]",      desc: "脚注リスト（本文中は[NOTE|番号]）" },
      { syntax: "[INTERVIEW|ヘッダー]\\n[Q|質問]\\n[A|話者|回答]\\n[/INTERVIEW]", desc: "インタビュー記録" },
      { syntax: "[CLEARANCE|N]...[/CLEARANCE]",                  desc: "クリアランスゲート（N=1〜5）" },
      { syntax: "[WARN|danger/info/caution|タイトル]...[/WARN]", desc: "警告・注意バナー（3種）" },
      { syntax: "[IMAGE|photo/document|キャプション]",           desc: "画像プレースホルダー" },
      { syntax: "[COUNTER|ラベル|値]",                           desc: "ステータスバッジ" },
      { syntax: "[POV|人物名]",                                  desc: "視点マーカー（区切り線付き）" },
      { syntax: "[HR] / [HR|dots] / [HR|stars]",                 desc: "区切り線（3スタイル）" },
    ],
  },
  {
    category: "インライン",
    items: [
      { syntax: "[RUBY|漢字|よみ]",          desc: "ルビ（ふりがな）" },
      { syntax: "[DOT|テキスト]",             desc: "傍点（強調点）" },
      { syntax: "[EM|テキスト]",              desc: "傍線強調（アンダーライン）" },
      { syntax: "[STRONG|テキスト]",          desc: "太字強調" },
      { syntax: "[CORRUPT|名前|level=2]",     desc: "文字化けプロテクト（level 1-3）" },
      { syntax: "[NOTE|番号]",                desc: "脚注参照番号（本文中に挿入）" },
      { syntax: "[TIME|14:32:07]",            desc: "時刻スタンプ（ログ形式）" },
    ],
  },
];

export function NmlEditor({ value, onChange, placeholder }: NmlEditorProps) {
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const highlightRef  = useRef<HTMLDivElement>(null);
  const lineNumberRef = useRef<HTMLDivElement>(null);

  const [highlightedHtml, setHighlightedHtml] = useState("");
  const [charCount,       setCharCount]       = useState(0);
  const [bodyCharCount,   setBodyCharCount]   = useState(0);
  const [lineCount,       setLineCount]       = useState(1);
  const [cursorLine,      setCursorLine]      = useState(1);
  const [cursorCol,       setCursorCol]       = useState(1);

  const [showEntityPalette, setShowEntityPalette] = useState(false);
  const [entityType,        setEntityType]        = useState<EntityType>("anomaly");
  const [entitySearch,      setEntitySearch]      = useState("");
  const [entities,          setEntities]          = useState<Array<{ id: string; name: string }>>([]);
  const [entityLoading,     setEntityLoading]     = useState(false);
  const [showReference,     setShowReference]     = useState(false);

  useEffect(() => {
    setHighlightedHtml(buildHighlightedHTML(value));
    setCharCount(value.length);
    setBodyCharCount(value.replace(/\[[^\]]*\]/g, "").replace(/\s/g, "").length);
    setLineCount(value.split("\n").length);
  }, [value]);

  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    const hl = highlightRef.current;
    const ln = lineNumberRef.current;
    if (ta && hl) { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; }
    if (ta && ln) { ln.scrollTop = ta.scrollTop; }
  }, []);

  const updateCursor = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos    = ta.selectionStart;
    const before = value.slice(0, pos);
    const line   = before.split("\n").length;
    const col    = pos - before.lastIndexOf("\n");
    setCursorLine(line);
    setCursorCol(col);
  }, [value]);

  // エンティティ検索
  useEffect(() => {
    if (!showEntityPalette) return;
    setEntityLoading(true);
    const params = new URLSearchParams({ type: entityType });
    if (entitySearch) params.set("q", entitySearch);
    adminFetch(`/api/admin/entities?${params}`)
      .then((r) => r.json())
      .then((data) => setEntities(Array.isArray(data) ? data : []))
      .catch(() => setEntities([]))
      .finally(() => setEntityLoading(false));
  }, [showEntityPalette, entityType, entitySearch]);

  const insertSnippet = useCallback(
    (insert: (sel: string) => { text: string; cursorOffset: number }) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start    = ta.selectionStart;
      const end      = ta.selectionEnd;
      const selected = value.slice(start, end);
      const { text, cursorOffset } = insert(selected);
      const newValue = value.slice(0, start) + text + value.slice(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        const newPos = start + text.length + cursorOffset;
        ta.focus();
        ta.setSelectionRange(newPos, newPos);
      });
    },
    [value, onChange]
  );

  const insertEntityTag = useCallback(
    (id: string, name: string) => {
      const tag = ENTITY_CONFIG[entityType].tagFn(id, name);
      const ta  = textareaRef.current;
      if (!ta) return;
      const pos      = ta.selectionStart;
      const newValue = value.slice(0, pos) + tag + value.slice(pos);
      onChange(newValue);
      setShowEntityPalette(false);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(pos + tag.length, pos + tag.length);
      });
    },
    [value, onChange, entityType]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        // Shift+Tab はフォーカス移動を許可（アクセシビリティ）
        if (e.shiftKey) return;
        e.preventDefault();
        insertSnippet(() => ({ text: "  ", cursorOffset: 0 }));
        return;
      }
      if (e.key === "Escape") {
        setShowEntityPalette(false);
        setShowReference(false);
        // Escape でテキストエリアのフォーカスを解除できるようにする
        (e.target as HTMLTextAreaElement).blur();
      }
    },
    [insertSnippet]
  );

  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full relative">

      {/* ── ツールバー ── */}
      <div className="flex-shrink-0 border-b border-gray-700/60 bg-gray-900/50">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
          {SNIPPET_GROUPS.map((group) => (
            <div key={group.group} className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-gray-700 mr-0.5 tracking-wider">{group.group}</span>
              {group.items.map((s) => (
                <button key={s.label} title={s.title} onClick={() => insertSnippet(s.insert)}
                  className={`text-[10px] font-mono px-2 py-1 rounded border transition-all ${s.color}`}>
                  {s.label}
                </button>
              ))}
            </div>
          ))}

          <div className="flex-1" />

          <button
            title="エンティティを検索して挿入"
            onClick={() => { setShowEntityPalette((v) => !v); setShowReference(false); }}
            className={`text-[10px] font-mono px-2.5 py-1 rounded border transition-all
              ${showEntityPalette
                ? "bg-amber-900/40 border-amber-600 text-amber-300"
                : "border-gray-600 text-gray-500 hover:text-gray-300 hover:border-gray-500"}`}>
            🔍 エンティティ
          </button>

          <button
            title="NML構文リファレンス"
            onClick={() => { setShowReference((v) => !v); setShowEntityPalette(false); }}
            className={`text-[10px] font-mono px-2.5 py-1 rounded border transition-all
              ${showReference
                ? "bg-gray-700/60 border-gray-500 text-gray-200"
                : "border-gray-600 text-gray-500 hover:text-gray-300 hover:border-gray-500"}`}>
            ? 構文
          </button>

          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600 ml-1 pl-2 border-l border-gray-800">
            <span title="本文字数（タグ・空白除く）">{bodyCharCount}文字</span>
            <span title="全文字数" className="text-gray-700">{charCount}総</span>
          </div>
        </div>
      </div>

      {/* ── エンティティパレット ── */}
      {showEntityPalette && (
        <div className="flex-shrink-0 border-b border-gray-700 bg-[#0a0f14] px-3 py-2.5 space-y-2">
          <div className="flex gap-1 flex-wrap items-center">
            {(Object.keys(ENTITY_CONFIG) as EntityType[]).map((type) => (
              <button key={type}
                onClick={() => { setEntityType(type); setEntitySearch(""); }}
                className={`text-[10px] font-mono px-2.5 py-1 rounded border transition-all
                  ${entityType === type
                    ? `${ENTITY_CONFIG[type].color} bg-gray-800/60 border-gray-600`
                    : "text-gray-600 border-gray-800 hover:text-gray-400"}`}>
                {ENTITY_CONFIG[type].label}
              </button>
            ))}
            <input
              type="text" value={entitySearch}
              onChange={(e) => setEntitySearch(e.target.value)}
              placeholder="IDや名前で検索…"
              autoFocus
              className="ml-auto text-[10px] font-mono bg-gray-900 border border-gray-700 rounded px-2 py-1
                text-gray-300 outline-none focus:border-amber-700 w-36 placeholder:text-gray-700"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap max-h-24 overflow-y-auto">
            {entityLoading ? (
              <span className="text-[10px] font-mono text-gray-700">読み込み中…</span>
            ) : entities.length === 0 ? (
              <span className="text-[10px] font-mono text-gray-700">エンティティが見つかりません</span>
            ) : (
              entities.map((e) => (
                <button key={e.id} onClick={() => insertEntityTag(e.id, e.name)}
                  title={`${e.id} — クリックで挿入`}
                  className={`text-[10px] font-mono px-2 py-1 rounded border border-gray-700
                    bg-gray-900/60 hover:bg-gray-800 transition-all ${ENTITY_CONFIG[entityType].color}`}>
                  <span className="text-gray-600 mr-1">{e.id}</span>{e.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── リファレンスパネル ── */}
      {showReference && (
        <div className="flex-shrink-0 border-b border-gray-700 bg-[#080c10] px-4 py-3 max-h-52 overflow-y-auto">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {NML_REFERENCE.map((cat) => (
              <div key={cat.category}>
                <p className="text-[9px] font-mono text-gray-600 tracking-widest mb-1.5 uppercase">{cat.category}</p>
                <div className="space-y-1.5">
                  {cat.items.map((item) => (
                    <div key={item.syntax}>
                      <code className="text-[9px] font-mono text-amber-600/80 bg-gray-900/60 px-1.5 py-0.5 rounded break-all leading-snug block">
                        {item.syntax}
                      </code>
                      <span className="text-[9px] font-mono text-gray-600 pl-1">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── エディタ本体 ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* 行番号 */}
        <div ref={lineNumberRef} aria-hidden
          className="flex-shrink-0 w-10 overflow-hidden bg-[#07090c] border-r border-gray-800/60 select-none pointer-events-none"
          style={{ paddingTop: "1rem" }}>
          {lineNumbers.map((n) => (
            <div key={n}
              className={`text-right pr-2 font-mono text-[11px] leading-7
                ${n === cursorLine ? "text-amber-600/70" : "text-gray-700"}`}>
              {n}
            </div>
          ))}
        </div>

        {/* ハイライト + テキストエリア */}
        <div className="relative flex-1 overflow-hidden">
          <div ref={highlightRef} aria-hidden
            className="absolute inset-0 p-4 font-mono text-sm leading-7 whitespace-pre-wrap break-words
              overflow-auto pointer-events-none select-none text-transparent"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}
            dangerouslySetInnerHTML={{ __html: highlightedHtml + "\n" }}
          />
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={syncScroll}
            onKeyDown={handleKeyDown}
            onKeyUp={updateCursor}
            onClick={updateCursor}
            onSelect={updateCursor}
            placeholder={placeholder}
            spellCheck={false}
            className="absolute inset-0 w-full h-full p-4 font-mono text-sm leading-7
              bg-transparent text-gray-300 caret-amber-400 resize-none outline-none
              placeholder:text-gray-700 selection:bg-amber-900/40"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}
          />
        </div>
      </div>

      {/* ── ステータスバー ── */}
      <div className="flex-shrink-0 flex items-center gap-4 px-3 py-1 border-t border-gray-800/60 bg-[#07090c]">
        <span className="text-[10px] font-mono text-gray-700">{cursorLine}行 {cursorCol}列</span>
        <span className="text-[10px] font-mono text-gray-700">全{lineCount}行</span>
        <span className="ml-auto text-[10px] font-mono text-gray-700">
          Ctrl+S 保存　Tab インデント　Esc 閉じる
        </span>
      </div>

      <style>{`
        mark.hl-anomaly   { background: rgba(217,119,6,0.18); color: #fbbf24; border-radius: 2px; }
        mark.hl-module    { background: rgba(6,182,212,0.15); color: #67e8f9; border-radius: 2px; }
        mark.hl-incident  { background: rgba(239,68,68,0.15); color: #fca5a5; border-radius: 2px; }
        mark.hl-facility  { background: rgba(34,197,94,0.15); color: #86efac; border-radius: 2px; }
        mark.hl-person    { background: rgba(139,92,246,0.18); color: #c4b5fd; border-radius: 2px; }
        mark.hl-ruby      { background: rgba(156,163,175,0.12); color: #d1d5db; border-radius: 2px; }
        mark.hl-header    { background: rgba(75,85,99,0.25); color: #9ca3af; border-radius: 2px; }
        mark.hl-redacted  { background: rgba(31,41,55,0.6); color: #6b7280; border-radius: 2px; }
        mark.hl-glitch    { background: rgba(239,68,68,0.12); color: #f87171; border-radius: 2px; }
        mark.hl-terminal  { background: rgba(16,185,129,0.12); color: #6ee7b7; border-radius: 2px; }
        mark.hl-choice    { background: rgba(234,179,8,0.12); color: #fde047; border-radius: 2px; }
        mark.hl-choice3   { background: rgba(234,179,8,0.10); color: #fcd34d; border-radius: 2px; }
        mark.hl-chat      { background: rgba(20,184,166,0.12); color: #5eead4; border-radius: 2px; }
        mark.hl-msg       { background: rgba(20,184,166,0.08); color: #99f6e4; border-radius: 2px; }
        mark.hl-dialog    { background: rgba(6,182,212,0.10); color: #67e8f9; border-radius: 2px; }
        mark.hl-line      { background: rgba(6,182,212,0.08); color: #a5f3fc; border-radius: 2px; }
        mark.hl-glossary  { background: rgba(99,102,241,0.12); color: #a5b4fc; border-radius: 2px; }
        mark.hl-term      { background: rgba(99,102,241,0.08); color: #c7d2fe; border-radius: 2px; }
        mark.hl-sys       { background: rgba(156,163,175,0.15); color: #e5e7eb; border-radius: 2px; }
        mark.hl-hr        { background: rgba(75,85,99,0.20); color: #6b7280; border-radius: 2px; }
        mark.hl-dot       { background: rgba(156,163,175,0.12); color: #d1d5db; border-radius: 2px; }
        mark.hl-em        { background: rgba(209,213,219,0.10); color: #e5e7eb; border-radius: 2px; }
        mark.hl-strong    { background: rgba(255,255,255,0.08); color: #f9fafb; border-radius: 2px; }
        mark.hl-corrupt   { background: rgba(55,65,81,0.40); color: #4b5563; border-radius: 2px; }
        mark.hl-log       { background: rgba(75,85,99,0.20); color: #9ca3af; border-radius: 2px; }
        mark.hl-call      { background: rgba(16,185,129,0.10); color: #6ee7b7; border-radius: 2px; }
        mark.hl-voice     { background: rgba(16,185,129,0.07); color: #a7f3d0; border-radius: 2px; }
        mark.hl-footnote  { background: rgba(75,85,99,0.15); color: #9ca3af; border-radius: 2px; }
        mark.hl-interview { background: rgba(217,119,6,0.12); color: #fcd34d; border-radius: 2px; }
        mark.hl-clearance { background: rgba(239,68,68,0.15); color: #fca5a5; border-radius: 2px; }
        mark.hl-warn      { background: rgba(234,179,8,0.12); color: #fde047; border-radius: 2px; }
        mark.hl-image     { background: rgba(75,85,99,0.20); color: #9ca3af; border-radius: 2px; }
        mark.hl-counter   { background: rgba(75,85,99,0.15); color: #9ca3af; border-radius: 2px; }
        mark.hl-pov       { background: rgba(75,85,99,0.15); color: #9ca3af; border-radius: 2px; }
        mark.hl-note-ref  { background: rgba(75,85,99,0.15); color: #9ca3af; border-radius: 2px; }
        mark.hl-timestamp { background: rgba(75,85,99,0.15); color: #6b7280; border-radius: 2px; }
      `}</style>
    </div>
  );
}
