// 編集日時: 2026-05-03
"use client";
import { adminFetch } from "@/lib/admin-fetch";
import Link from "next/link";
import { useRef, useState } from "react";

type ImportMode = "merge" | "replace";
type Phase = "idle" | "loading" | "done" | "error";

interface ImportResult {
  ok: boolean;
  mode: ImportMode;
  results: Record<string, { inserted: number; skipped: number }>;
}

const TABLE_LABELS: Record<string, string> = {
  anomalies: "アノマリー", modules: "モジュール", incidents: "インシデント",
  facilities: "施設", personnel: "人員", novels: "小説", chapters: "章",
};

export default function BackupPage() {
  // ── エクスポート ──
  const [exportPhase, setExportPhase] = useState<Phase>("idle");

  const handleExport = async () => {
    setExportPhase("loading");
    try {
      const res  = await adminFetch("/api/admin/backup");
      const blob = await res.blob();
      const cd   = res.headers.get("Content-Disposition") ?? "";
      const name = cd.match(/filename="([^"]+)"/)?.[1] ?? "backup.json";
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
      setExportPhase("done");
    } catch {
      setExportPhase("error");
    }
  };

  // ── インポート ──
  const fileRef   = useRef<HTMLInputElement>(null);
  const [mode,    setMode]    = useState<ImportMode>("merge");
  const [file,    setFile]    = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, number> | null>(null);
  const [importPhase, setImportPhase] = useState<Phase>("idle");
  const [result,  setResult]  = useState<ImportResult | null>(null);
  const [errMsg,  setErrMsg]  = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setPreview(null); setResult(null); setImportPhase("idle"); setErrMsg("");
    try {
      const text = await f.text();
      const json = JSON.parse(text);
      if (json?.data) {
        const counts: Record<string, number> = {};
        for (const [k, v] of Object.entries(json.data as Record<string, unknown[]>)) {
          counts[k] = Array.isArray(v) ? v.length : 0;
        }
        setPreview(counts);
      }
    } catch { setErrMsg("JSONの解析に失敗しました"); }
  };

  const handleImport = async () => {
    if (!file) return;
    if (mode === "replace" && !confirm("⚠️ 全データが削除されてファイルの内容で上書きされます。続けますか？")) return;
    setImportPhase("loading"); setErrMsg(""); setResult(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res  = await adminFetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, data: json.data }),
      });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error ?? "エラー"); setImportPhase("error"); return; }
      setResult(data); setImportPhase("done");
    } catch (e) {
      setErrMsg(String(e)); setImportPhase("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#06090c] text-gray-300 p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-gray-600 hover:text-gray-400 font-mono text-xs">← 管理</Link>
        <h1 className="font-mono text-sm text-gray-200 tracking-wider">データ バックアップ / インポート</h1>
      </div>

      {/* ── エクスポート ── */}
      <section className="mb-8 border border-gray-800 rounded-xl p-5 bg-gray-900/20">
        <h2 className="font-mono text-xs text-gray-400 tracking-widest uppercase mb-3">↓ 書き出し（エクスポート）</h2>
        <p className="text-xs text-gray-600 font-sans mb-4 leading-relaxed">
          全テーブル（小説・章・エンティティ）のデータをJSONファイルとしてダウンロードします。
          バックアップや環境移行に使用してください。
        </p>
        <button
          onClick={handleExport}
          disabled={exportPhase === "loading"}
          className="px-5 py-2 rounded border border-amber-800/60 text-xs font-mono text-amber-400
            hover:bg-amber-900/20 transition-all disabled:opacity-50"
        >
          {exportPhase === "loading" ? "書き出し中…"
            : exportPhase === "done"  ? "✓ ダウンロード完了"
            : exportPhase === "error" ? "✕ エラー"
            : "全データをJSONで書き出す"}
        </button>
      </section>

      {/* ── インポート ── */}
      <section className="border border-gray-800 rounded-xl p-5 bg-gray-900/20">
        <h2 className="font-mono text-xs text-gray-400 tracking-widest uppercase mb-3">↑ 読み込み（インポート）</h2>
        <p className="text-xs text-gray-600 font-sans mb-4 leading-relaxed">
          書き出したJSONファイルを読み込んでデータを復元します。
        </p>

        {/* モード選択 */}
        <div className="flex gap-3 mb-4">
          {(["merge", "replace"] as ImportMode[]).map((m) => (
            <label key={m}
              className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-all text-xs font-mono
                ${mode === m ? "border-amber-700/60 bg-amber-900/20 text-amber-300" : "border-gray-700 text-gray-600 hover:border-gray-600"}`}>
              <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="hidden" />
              {m === "merge" ? "統合（IDが重複しない場合のみ追加）" : "上書き（全データ削除して置き換え）"}
            </label>
          ))}
        </div>

        {mode === "replace" && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded border border-red-900/50 bg-red-950/20 text-xs font-mono text-red-400">
            ⚠ 上書きモード — 実行すると現在の全データが削除されます
          </div>
        )}

        {/* ファイル選択 */}
        <div
          onClick={() => fileRef.current?.click()}
          className="mb-4 border border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer
            hover:border-gray-600 hover:bg-gray-900/30 transition-all"
        >
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
          {file
            ? <p className="text-sm font-mono text-gray-300">{file.name}</p>
            : <p className="text-xs font-mono text-gray-700">クリックしてJSONファイルを選択</p>}
        </div>

        {/* プレビュー */}
        {preview && (
          <div className="mb-4 border border-gray-800 rounded-lg p-3 bg-gray-900/40">
            <p className="text-[10px] font-mono text-gray-600 tracking-widest mb-2">ファイル内容プレビュー</p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(preview).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-500">{TABLE_LABELS[k] ?? k}</span>
                  <span className="text-gray-300">{v}件</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {errMsg && <p className="mb-3 text-xs font-mono text-red-400">{errMsg}</p>}

        <button
          onClick={handleImport}
          disabled={!file || importPhase === "loading"}
          className="px-5 py-2 rounded border border-gray-700 text-xs font-mono text-gray-400
            hover:text-gray-200 hover:border-gray-500 transition-all disabled:opacity-40"
        >
          {importPhase === "loading" ? "インポート中…"
            : importPhase === "done"  ? "✓ 完了"
            : importPhase === "error" ? "✕ エラー"
            : "インポートを実行"}
        </button>

        {/* 結果 */}
        {result && (
          <div className="mt-4 border border-gray-800 rounded-lg p-3 bg-gray-900/40">
            <p className="text-[10px] font-mono text-green-600 tracking-widest mb-2">
              ✓ インポート完了（モード: {result.mode}）
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(result.results).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-500">{TABLE_LABELS[k] ?? k}</span>
                  <span>
                    <span className="text-green-600 mr-2">+{v.inserted}</span>
                    {v.skipped > 0 && <span className="text-gray-700">skip {v.skipped}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
