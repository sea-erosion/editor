// 編集日時: 2026-04-29
"use client";

import { NmlEditor }      from "@/components/editor/NmlEditor";
import { NovelRenderer }  from "@/components/novel/NovelRenderer";
import Link               from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface Chapter { id: string; novelId: string; title: string; chapterNumber: number; content: string; status: string; }
interface Novel   { id: string; title: string; slug: string; author: string; status: string; chapterCount?: number; }
interface Snapshot { ts: number; title: string; preview: string; }

type PanelMode = "split" | "editor" | "preview";
type SaveState = "saved" | "unsaved" | "saving" | "error";
type RightTab  = "memo" | "snapshots";

const AUTOSAVE_DELAY = 2000;
const cls = { input: "w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 font-mono outline-none focus:border-amber-700 transition-colors", btn: "px-3 py-1.5 rounded border border-gray-700 text-xs font-mono text-gray-500 hover:text-gray-300 transition-all", primary: "px-4 py-1.5 rounded border border-amber-700/60 text-xs font-mono text-amber-400 hover:bg-amber-900/20 transition-all disabled:opacity-50" };

// ── モーダル ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0d1117] border border-gray-700 rounded-xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-sm text-gray-200">{title}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-sm">✕</button>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-[11px] font-mono text-gray-600 mb-1">{label}</label>{children}</div>;
}

function NewNovelModal({ onClose, onCreated }: { onClose: () => void; onCreated: (n: Novel) => void }) {
  const [form, setForm] = useState({ title: "", slug: "", author: "", summary: "", classification: "Narrative" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const autoSlug = (t: string) => t.toLowerCase().replace(/[\s　]+/g, "-").replace(/[^\w-]/g, "").slice(0, 60);
  const submit = async () => {
    if (!form.title || !form.slug || !form.author) { setError("タイトル・スラッグ・著者は必須です"); return; }
    setLoading(true);
    const res = await fetch("/api/admin/novels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "エラー"); setLoading(false); return; }
    onCreated(data);
  };
  return (
    <Modal title="新しい小説を作成" onClose={onClose}>
      <Field label="タイトル *"><input className={cls.input} value={form.title} onChange={(e) => { const t = e.target.value; setForm(f => ({ ...f, title: t, slug: f.slug || autoSlug(t) })); }} placeholder="影の縁で" /></Field>
      <Field label="スラッグ *"><input className={cls.input} value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} /></Field>
      <Field label="著者 *"><input className={cls.input} value={form.author} onChange={(e) => setForm(f => ({ ...f, author: e.target.value }))} /></Field>
      <Field label="あらすじ"><textarea className={cls.input + " h-20 resize-none"} value={form.summary} onChange={(e) => setForm(f => ({ ...f, summary: e.target.value }))} /></Field>
      <Field label="分類"><select className={cls.input} value={form.classification} onChange={(e) => setForm(f => ({ ...f, classification: e.target.value }))}>{["Narrative","Report","Interview","Log"].map(c => <option key={c}>{c}</option>)}</select></Field>
      {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className={cls.btn}>キャンセル</button>
        <button onClick={submit} disabled={loading} className={cls.primary}>{loading ? "作成中…" : "作成"}</button>
      </div>
    </Modal>
  );
}

function NewChapterModal({ novelId, nextNumber, onClose, onCreated }: { novelId: string; nextNumber: number; onClose: () => void; onCreated: (c: Chapter) => void }) {
  const [title, setTitle] = useState(`第${nextNumber}章：`); const [num, setNum] = useState(nextNumber);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!title) { setError("タイトルは必須です"); return; }
    setLoading(true);
    const res = await fetch("/api/admin/chapters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ novelId, title, chapterNumber: num, content: "" }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "エラー"); setLoading(false); return; }
    onCreated(data);
  };
  return (
    <Modal title="新しい章を作成" onClose={onClose}>
      <Field label="章タイトル *"><input className={cls.input} value={title} autoFocus onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="章番号"><input className={cls.input} type="number" value={num} min={1} onChange={(e) => setNum(Number(e.target.value))} /></Field>
      {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className={cls.btn}>キャンセル</button>
        <button onClick={submit} disabled={loading} className={cls.primary}>{loading ? "作成中…" : "作成"}</button>
      </div>
    </Modal>
  );
}

// ── 章並び替えリスト ─────────────────────────────────────────────────────
function ChapterList({ chapters, selectedId, onSelect, onReorder }: {
  chapters: Chapter[]; selectedId?: string;
  onSelect: (c: Chapter) => void;
  onReorder: (reordered: Chapter[]) => void;
}) {
  const dragIdx = useRef<number | null>(null);

  const onDragStart = (i: number) => { dragIdx.current = i; };
  const onDragOver  = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    const next = [...chapters];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(i, 0, moved);
    dragIdx.current = i;
    onReorder(next.map((c, idx) => ({ ...c, chapterNumber: idx + 1 })));
  };
  const onDrop = () => { dragIdx.current = null; };

  function calcBodyChars(content: string) { return content.replace(/\[[^\]]*\]/g, "").replace(/\s/g, "").length; }

  return (
    <div className="flex-1 overflow-y-auto py-1">
      {chapters.map((ch, i) => (
        <div
          key={ch.id}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragOver={(e) => onDragOver(e, i)}
          onDrop={onDrop}
          onClick={() => onSelect(ch)}
          className={`w-full text-left px-3 py-2.5 text-xs transition-colors cursor-grab active:cursor-grabbing
            ${selectedId === ch.id ? "bg-gray-800/60 text-gray-100" : "text-gray-500 hover:bg-gray-800/30 hover:text-gray-300"}`}
        >
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-gray-700 text-[10px]">{ch.chapterNumber}.</span>
            <span className="truncate font-medium">{ch.title}</span>
            <span className="ml-auto text-gray-800 text-[9px] font-mono select-none">⠿</span>
          </div>
          <div className="text-[10px] font-mono mt-0.5 ml-4 flex gap-2">
            {ch.status === "published" ? <span className="text-green-700">公開中</span> : <span className="text-gray-700">下書き</span>}
            <span className="text-gray-700">{calcBodyChars(ch.content)}文字</span>
          </div>
        </div>
      ))}
      {chapters.length === 0 && <p className="px-3 py-4 text-[11px] text-gray-700 font-mono text-center">章がありません</p>}
    </div>
  );
}

// ── 右パネル（メモ / スナップショット） ──────────────────────────────────
function RightPanel({ chapter, content, title }: { chapter: Chapter; content: string; title: string }) {
  const [tab, setTab]         = useState<RightTab>("memo");
  const [memo, setMemo]       = useState("");
  const [memoSaved, setMemoSaved] = useState(true);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapLoading, setSnapLoading] = useState(false);
  const memoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/admin/chapters/${chapter.id}/memo`).then(r => r.json()).then(d => setMemo(d.memo ?? "")).catch(() => {});
  }, [chapter.id]);

  useEffect(() => {
    if (tab === "snapshots") loadSnapshots();
  }, [tab, chapter.id]);

  const loadSnapshots = async () => {
    setSnapLoading(true);
    const res = await fetch(`/api/admin/chapters/${chapter.id}/snapshots`);
    const data = await res.json();
    setSnapshots(Array.isArray(data) ? data : []);
    setSnapLoading(false);
  };

  const saveMemo = (v: string) => {
    setMemo(v); setMemoSaved(false);
    if (memoTimer.current) clearTimeout(memoTimer.current);
    memoTimer.current = setTimeout(async () => {
      await fetch(`/api/admin/chapters/${chapter.id}/memo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memo: v }) });
      setMemoSaved(true);
    }, 1000);
  };

  const saveSnapshot = async () => {
    await fetch(`/api/admin/chapters/${chapter.id}/snapshots`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content }) });
    loadSnapshots();
  };

  const restoreSnapshot = async (ts: number) => {
    if (!confirm("このスナップショットを復元しますか？現在の内容は上書きされます。")) return;
    const res = await fetch(`/api/admin/chapters/${chapter.id}/snapshots?ts=${ts}`, { method: "DELETE" });
    const data = await res.json();
    if (data.content !== undefined) {
      window.dispatchEvent(new CustomEvent("nml-restore", { detail: { content: data.content, title: data.title } }));
    }
  };

  const fmtTs = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-800 bg-[#070a0e]">
      <div className="flex border-b border-gray-800 flex-shrink-0">
        {(["memo","snapshots"] as RightTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[10px] font-mono tracking-wider transition-colors
              ${tab === t ? "text-gray-200 border-b border-amber-600" : "text-gray-600 hover:text-gray-400"}`}>
            {t === "memo" ? "メモ" : "版管理"}
          </button>
        ))}
      </div>

      {tab === "memo" && (
        <div className="flex flex-col flex-1 min-h-0 p-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-mono text-gray-700">プロット・執筆メモ</span>
            <span className={`text-[9px] font-mono ${memoSaved ? "text-gray-800" : "text-amber-700"}`}>{memoSaved ? "保存済" : "保存中…"}</span>
          </div>
          <textarea value={memo} onChange={(e) => saveMemo(e.target.value)}
            placeholder={"この章のメモ・プロット・設定など…"}
            className="flex-1 resize-none bg-gray-900/60 border border-gray-800 rounded p-2 text-[11px] font-mono
              text-gray-400 outline-none focus:border-gray-700 placeholder:text-gray-800 leading-relaxed" />
        </div>
      )}

      {tab === "snapshots" && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-2 border-b border-gray-800 flex-shrink-0">
            <button onClick={saveSnapshot}
              className="w-full py-1.5 rounded border border-gray-700 text-[10px] font-mono text-gray-600
                hover:text-gray-400 hover:border-gray-600 transition-all">
              + 現在の状態を保存
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {snapLoading ? (
              <p className="text-[10px] font-mono text-gray-700 text-center py-4">読み込み中…</p>
            ) : snapshots.length === 0 ? (
              <p className="text-[10px] font-mono text-gray-800 text-center py-4">スナップショットなし</p>
            ) : snapshots.map((s) => (
              <div key={s.ts} className="px-3 py-2.5 border-b border-gray-800/50 hover:bg-gray-900/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-500">{fmtTs(s.ts)}</span>
                  <button onClick={() => restoreSnapshot(s.ts)}
                    className="text-[9px] font-mono text-gray-700 hover:text-amber-500 transition-colors">復元</button>
                </div>
                <p className="text-[10px] font-mono text-gray-700 mt-0.5 truncate">{s.title}</p>
                <p className="text-[9px] font-mono text-gray-800 leading-relaxed mt-0.5 line-clamp-2">{s.preview}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── カラー定数 ──────────────────────────────────────────────────────────
function calcBodyChars(content: string) { return content.replace(/\[[^\]]*\]/g, "").replace(/\s/g, "").length; }

const SAVE_LABELS: Record<SaveState, { text: string; color: string }> = {
  saved:   { text: "✓ 保存済み", color: "text-green-600" },
  unsaved: { text: "● 未保存",   color: "text-amber-500" },
  saving:  { text: "↑ 保存中…", color: "text-blue-400"  },
  error:   { text: "✕ 保存失敗", color: "text-red-400"   },
};

// ── メインコンポーネント ─────────────────────────────────────────────────
export default function EditorPage() {
  const [novels,             setNovels]             = useState<Novel[]>([]);
  const [selectedNovel,      setSelectedNovel]      = useState<Novel | null>(null);
  const [chapters,           setChapters]           = useState<Chapter[]>([]);
  const [selectedChapter,    setSelectedChapter]    = useState<Chapter | null>(null);
  const [content,            setContent]            = useState("");
  const [chapterTitle,       setChapterTitle]       = useState("");
  const [panelMode,          setPanelMode]          = useState<PanelMode>("split");
  const [saveState,          setSaveState]          = useState<SaveState>("saved");
  const [sidebarTab,         setSidebarTab]         = useState<"chapters" | "novels">("novels");
  const [showNewNovelModal,   setShowNewNovelModal]   = useState(false);
  const [showNewChapterModal, setShowNewChapterModal] = useState(false);
  const [showRightPanel,     setShowRightPanel]     = useState(false);

  const [splitPct, setSplitPct] = useState(50);
  const isDragging  = useRef(false);
  const splitPaneRef = useRef<HTMLDivElement>(null);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty     = useRef(false);

  useEffect(() => { fetch("/api/admin/novels").then(r => r.json()).then(setNovels).catch(console.error); }, []);
  useEffect(() => {
    if (!selectedNovel) return;
    fetch(`/api/admin/chapters?novelId=${selectedNovel.id}`).then(r => r.json()).then(setChapters).catch(console.error);
  }, [selectedNovel]);
  useEffect(() => {
    if (!selectedChapter) return;
    setContent(selectedChapter.content); setChapterTitle(selectedChapter.title);
    setSaveState("saved"); isDirty.current = false;
  }, [selectedChapter]);

  // スナップショット復元イベント受信
  useEffect(() => {
    const handler = (e: Event) => {
      const { content: c, title: t } = (e as CustomEvent).detail;
      setContent(c); setChapterTitle(t);
      // 復元後はオートセーブをスケジュールして未保存状態にする
      setSaveState("unsaved"); isDirty.current = true;
    };
    window.addEventListener("nml-restore", handler);
    return () => window.removeEventListener("nml-restore", handler);
  }, []);

  const save = useCallback(async (chapterId: string, titleToSave: string, contentToSave: string) => {
    setSaveState("saving");
    try {
      await fetch(`/api/admin/chapters/${chapterId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: titleToSave, content: contentToSave }) });
      setSaveState("saved"); isDirty.current = false;
      setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, title: titleToSave, content: contentToSave } : c));
    } catch { setSaveState("error"); }
  }, []);

  const scheduleAutosave = useCallback((newTitle: string, newContent: string) => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    setSaveState("unsaved"); isDirty.current = true;
    autosaveRef.current = setTimeout(() => {
      if (selectedChapter && isDirty.current) save(selectedChapter.id, newTitle, newContent);
    }, AUTOSAVE_DELAY);
  }, [selectedChapter, save]);

  const handleContentChange = useCallback((v: string) => { setContent(v); scheduleAutosave(chapterTitle, v); }, [chapterTitle, scheduleAutosave]);
  const handleTitleChange   = useCallback((v: string) => { setChapterTitle(v); scheduleAutosave(v, content); }, [content, scheduleAutosave]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (selectedChapter && isDirty.current) save(selectedChapter.id, chapterTitle, content);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedChapter, chapterTitle, content, save]);

  // ── リサイザー ──
  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); isDragging.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || !splitPaneRef.current) return;
      const rect = splitPaneRef.current.getBoundingClientRect();
      setSplitPct(Math.min(80, Math.max(20, ((ev.clientX - rect.left) / rect.width) * 100)));
    };
    const onUp = () => { isDragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  }, []);

  // ── 章並び替え ──
  const handleReorder = useCallback(async (reordered: Chapter[]) => {
    setChapters(reordered);
    await fetch("/api/admin/chapters/reorder", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: reordered.map(c => ({ id: c.id, chapterNumber: c.chapterNumber })) }),
    });
  }, []);

  const togglePublish = async () => {
    if (!selectedChapter) return;
    const newStatus = selectedChapter.status === "published" ? "draft" : "published";
    await fetch(`/api/admin/chapters/${selectedChapter.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    const updated = { ...selectedChapter, status: newStatus };
    setSelectedChapter(updated); setChapters(prev => prev.map(c => c.id === selectedChapter.id ? updated : c));
  };

  const deleteChapter = async () => {
    if (!selectedChapter || !confirm(`「${selectedChapter.title}」を削除しますか？`)) return;
    // 削除前にautosaveをキャンセルして、削除済みIDへの保存リクエストを防ぐ
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    isDirty.current = false;
    await fetch(`/api/admin/chapters/${selectedChapter.id}`, { method: "DELETE" });
    setChapters(prev => prev.filter(c => c.id !== selectedChapter.id));
    setSelectedChapter(null); setContent("");
  };

  return (
    <div className="flex h-screen bg-[#06090c] text-gray-300 overflow-hidden">

      {/* ── サイドバー ── */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-gray-800 bg-[#080c10]">
        <div className="flex border-b border-gray-800">
          {(["novels","chapters"] as const).map(tab => (
            <button key={tab} onClick={() => setSidebarTab(tab)}
              className={`flex-1 py-2.5 text-[11px] font-mono tracking-wider transition-colors
                ${sidebarTab === tab ? "text-gray-200 border-b border-amber-600 bg-gray-800/30" : "text-gray-600 hover:text-gray-400"}`}>
              {tab === "novels" ? "小説" : "章"}
            </button>
          ))}
        </div>

        {sidebarTab === "novels" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-2 border-b border-gray-800/50">
              <button onClick={() => setShowNewNovelModal(true)}
                className="w-full py-1.5 rounded border border-dashed border-gray-700 text-[11px] font-mono text-gray-600 hover:text-gray-400 hover:border-gray-600 transition-all">
                + 新しい小説
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {novels.map(novel => (
                <button key={novel.id}
                  onClick={() => { setSelectedNovel(novel); setSelectedChapter(null); setContent(""); setSidebarTab("chapters"); }}
                  className={`w-full text-left px-3 py-2.5 text-xs transition-colors
                    ${selectedNovel?.id === novel.id ? "bg-gray-800/60 text-gray-100" : "text-gray-500 hover:bg-gray-800/30 hover:text-gray-300"}`}>
                  <div className="font-medium truncate">{novel.title}</div>
                  <div className="text-[10px] font-mono text-gray-700 mt-0.5">
                    {novel.status === "published" ? <span className="text-green-700">公開中</span> : <span className="text-gray-600">下書き</span>}
                  </div>
                </button>
              ))}
            </div>
            {/* ナビリンク */}
            <div className="border-t border-gray-800 p-2 space-y-1">
              <Link href="/admin/search" className="flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-mono text-gray-600 hover:text-gray-400 hover:bg-gray-800/30 transition-all">🔍 全文検索</Link>
              <Link href="/admin/stats"  className="flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-mono text-gray-600 hover:text-gray-400 hover:bg-gray-800/30 transition-all">📊 執筆統計</Link>
            </div>
          </div>
        )}

        {sidebarTab === "chapters" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {selectedNovel ? (
              <>
                <div className="px-3 py-2 border-b border-gray-800/50">
                  <p className="text-[10px] font-mono text-gray-600 truncate">{selectedNovel.title}</p>
                  <button onClick={() => setShowNewChapterModal(true)}
                    className="mt-1.5 w-full py-1.5 rounded border border-dashed border-gray-700 text-[11px] font-mono text-gray-600 hover:text-gray-400 hover:border-gray-600 transition-all">
                    + 新しい章
                  </button>
                </div>
                <ChapterList
                  chapters={chapters}
                  selectedId={selectedChapter?.id}
                  onSelect={setSelectedChapter}
                  onReorder={handleReorder}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[11px] font-mono text-gray-700 text-center px-4">「小説」タブから<br />小説を選んでください</p>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ── メインエリア ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* トップバー */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 border-b border-gray-800 bg-[#080c10]">
          {selectedChapter
            ? <input value={chapterTitle} onChange={(e) => handleTitleChange(e.target.value)}
                className="flex-1 bg-transparent text-gray-200 text-sm font-serif placeholder:text-gray-700
                  border-b border-transparent hover:border-gray-700 focus:border-amber-700 outline-none py-0.5 transition-colors"
                placeholder="章タイトル…" />
            : <span className="flex-1 text-gray-700 text-sm font-mono">{selectedNovel ? "章を選択してください" : "小説を選択してください"}</span>
          }
          {selectedChapter && <span className={`text-[11px] font-mono flex-shrink-0 ${SAVE_LABELS[saveState].color}`}>{SAVE_LABELS[saveState].text}</span>}

          {/* パネルモード切替 */}
          <div className="flex border border-gray-700/60 rounded overflow-hidden flex-shrink-0">
            {(["editor","split","preview"] as PanelMode[]).map(mode => (
              <button key={mode} onClick={() => setPanelMode(mode)}
                title={{ editor: "エディタのみ", split: "分割表示", preview: "プレビューのみ" }[mode]}
                className={`px-2.5 py-1 text-[10px] font-mono transition-colors ${panelMode === mode ? "bg-gray-700 text-gray-200" : "text-gray-600 hover:text-gray-400"}`}>
                {{ editor: "ED", split: "SP", preview: "PV" }[mode]}
              </button>
            ))}
          </div>

          {selectedChapter && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* フルプレビュー */}
              <Link href={`/admin/preview?chapter=${selectedChapter.id}`} target="_blank"
                className="text-[11px] font-mono px-2 py-1 rounded border border-gray-700 text-gray-600 hover:text-gray-400 transition-all"
                title="フルページプレビュー">⬜</Link>
              {/* メモ/版管理パネル */}
              <button onClick={() => setShowRightPanel(v => !v)}
                className={`text-[11px] font-mono px-2 py-1 rounded border transition-all
                  ${showRightPanel ? "border-amber-700 text-amber-400" : "border-gray-700 text-gray-600 hover:text-gray-400"}`}
                title="メモ・版管理">📋</button>
              <button onClick={togglePublish}
                className={`text-[11px] font-mono px-3 py-1 rounded border transition-all
                  ${selectedChapter.status === "published" ? "border-green-800 text-green-500 hover:bg-green-900/20" : "border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600"}`}>
                {selectedChapter.status === "published" ? "公開中" : "下書き"}
              </button>
              <button onClick={() => { if (selectedChapter && isDirty.current) save(selectedChapter.id, chapterTitle, content); }}
                className="text-[11px] font-mono px-3 py-1 rounded border border-amber-800/60 text-amber-500 hover:bg-amber-900/20 transition-all">保存</button>
              <button onClick={deleteChapter}
                className="text-[11px] font-mono px-2 py-1 rounded border border-red-900/40 text-red-700 hover:text-red-500 hover:border-red-700 transition-all" title="章を削除">✕</button>
            </div>
          )}
        </div>

        {/* エディタ/プレビュー */}
        {selectedChapter ? (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* エディタ＋プレビュー分割 */}
            <div ref={splitPaneRef} className="flex flex-1 min-h-0 overflow-hidden">
              {(panelMode === "editor" || panelMode === "split") && (
                <div className="flex flex-col min-h-0 overflow-hidden border-r border-gray-800"
                  style={{ width: panelMode === "split" ? `${splitPct}%` : "100%" }}>
                  <div className="px-3 py-1.5 border-b border-gray-800/50 flex items-center">
                    <span className="text-[10px] font-mono text-gray-700 tracking-widest uppercase">NMLエディタ</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <NmlEditor value={content} onChange={handleContentChange} placeholder={"ここに本文を書いてください…"} />
                  </div>
                </div>
              )}
              {panelMode === "split" && (
                <div onMouseDown={onDividerMouseDown} className="w-1 flex-shrink-0 bg-gray-800 hover:bg-amber-700/50 cursor-col-resize transition-colors" />
              )}
              {(panelMode === "preview" || panelMode === "split") && (
                <div className="flex flex-col min-h-0 overflow-hidden flex-1">
                  <div className="px-3 py-1.5 border-b border-gray-800/50 flex items-center">
                    <span className="text-[10px] font-mono text-gray-700 tracking-widest uppercase">プレビュー</span>
                  </div>
                  <div className="flex-1 overflow-y-auto px-8 py-6">
                    {content.trim() ? <NovelRenderer content={content} /> : <p className="text-gray-700 text-sm font-mono text-center mt-20">本文を入力するとプレビューが表示されます</p>}
                  </div>
                </div>
              )}
            </div>

            {/* 右パネル（メモ / 版管理） */}
            {showRightPanel && selectedChapter && (
              <div className="w-56 flex-shrink-0">
                <RightPanel chapter={selectedChapter} content={content} title={chapterTitle} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4 opacity-10">⬡</div>
              <p className="font-mono text-gray-700 text-sm mb-1">章を選択してください</p>
              {selectedNovel && (
                <button onClick={() => setShowNewChapterModal(true)}
                  className="mt-5 px-4 py-2 rounded border border-dashed border-gray-700 text-sm font-mono text-gray-600 hover:text-gray-400 hover:border-gray-600 transition-all">
                  + 最初の章を作成
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showNewNovelModal && (
        <NewNovelModal onClose={() => setShowNewNovelModal(false)}
          onCreated={(novel) => { setNovels(prev => [...prev, novel]); setSelectedNovel(novel); setShowNewNovelModal(false); setSidebarTab("chapters"); }} />
      )}
      {showNewChapterModal && selectedNovel && (
        <NewChapterModal novelId={selectedNovel.id} nextNumber={chapters.length + 1}
          onClose={() => setShowNewChapterModal(false)}
          onCreated={(ch) => { setChapters(prev => [...prev, ch]); setSelectedChapter(ch); setShowNewChapterModal(false); }} />
      )}
    </div>
  );
}
