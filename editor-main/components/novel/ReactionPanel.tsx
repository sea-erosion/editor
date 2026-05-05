// 編集日時: 2026-05-05
"use client";

import { useEffect, useRef, useState } from "react";

const EMOJIS = ["❤️", "👍", "😭", "🔥", "✨", "😮", "👏", "💀"];
const MAX_COMMENT = 200;

interface RecentComment {
  id: string;
  emoji: string;
  comment: string | null;
  createdAt: Date | null;
}

interface ReactionPanelProps {
  novelId: string;
  chapterId: string;
  chapterTitle: string;
}

export function ReactionPanel({ novelId, chapterId, chapterTitle }: ReactionPanelProps) {
  const [counts, setCounts]         = useState<Record<string, number>>({});
  const [recent, setRecent]         = useState<RecentComment[]>([]);
  const [selected, setSelected]     = useState<string | null>(null);
  const [comment, setComment]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [visible, setVisible]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggered = useRef(false);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);

  // スクロール連動フェードイン
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          observer.disconnect();
          setVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // リアクション数を取得
  const fetchCounts = async () => {
    try {
      const res = await fetch(`/api/reactions?novelId=${novelId}&chapterId=${chapterId}`);
      if (!res.ok) return;
      const data = await res.json();
      setCounts(data.counts ?? {});
      setRecent(data.recent ?? []);
    } catch {}
  };

  useEffect(() => { fetchCounts(); }, [novelId, chapterId]);

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  const handleEmojiClick = (emoji: string) => {
    if (submitted) return;
    setSelected((prev) => (prev === emoji ? null : emoji));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          novelId,
          chapterId,
          emoji: selected,
          comment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "送信に失敗しました");
      } else {
        setSubmitted(true);
        await fetchCounts();
      }
    } catch {
      setError("送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="mt-12 pt-8 border-t border-gray-800"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.45s ease-out, transform 0.45s ease-out",
      }}
    >
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[10px] font-mono text-gray-600 tracking-[0.2em] uppercase select-none">
          ◈ REACTION
        </span>
        <div className="flex-1 h-px bg-gray-800" />
        {totalCount > 0 && (
          <span className="text-[10px] font-mono text-gray-600">{totalCount} reactions</span>
        )}
      </div>

      {/* 送信済み表示 */}
      {submitted ? (
        <div
          className="text-center py-6"
          style={{ animation: "nml-report-reveal 0.4s ease-out" }}
        >
          <p className="text-2xl mb-2">{selected}</p>
          <p className="text-xs font-mono text-gray-500">記録された</p>
          {/* カウント表示 */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {EMOJIS.filter((e) => counts[e] > 0).map((e) => (
              <span
                key={e}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-800/60 border border-gray-700/50 text-xs font-mono text-gray-400"
              >
                {e} <span className="text-gray-500">{counts[e]}</span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* 絵文字ボタン列 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {EMOJIS.map((emoji) => {
              const isSelected = selected === emoji;
              const count = counts[emoji] ?? 0;
              return (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-all duration-150
                    ${isSelected
                      ? "border-amber-500/70 bg-amber-900/25 scale-110"
                      : "border-gray-700/60 bg-gray-900/40 hover:border-gray-600 hover:bg-gray-800/60 hover:scale-105"
                    }`}
                  style={{
                    transform: isSelected ? "scale(1.12)" : "scale(1)",
                    transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), border-color 0.15s, background-color 0.15s",
                  }}
                >
                  <span>{emoji}</span>
                  {count > 0 && (
                    <span className="text-[10px] font-mono text-gray-500">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* コメント欄（絵文字選択後に展開） */}
          <div
            style={{
              maxHeight: selected ? "160px" : "0px",
              opacity: selected ? 1 : 0,
              overflow: "hidden",
              transition: "max-height 0.3s ease-out, opacity 0.25s ease-out",
            }}
          >
            <textarea
              ref={textareaRef}
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
              placeholder="感想を添えることができます（任意・200字以内）"
              rows={3}
              className="w-full bg-gray-900/60 border border-gray-700/60 rounded-lg px-3 py-2.5 text-sm text-gray-300
                placeholder-gray-600 font-sans leading-relaxed resize-none
                focus:outline-none focus:border-amber-700/60 focus:bg-gray-900/80 transition-all"
            />
            <div className="flex items-center justify-between mt-1 mb-3">
              <span className="text-[10px] font-mono text-gray-700">
                {comment.length} / {MAX_COMMENT}
              </span>
              {error && (
                <span className="text-[10px] font-mono text-red-500">{error}</span>
              )}
            </div>
          </div>

          {/* 送信ボタン */}
          {selected && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full py-2.5 rounded-lg border text-sm font-mono transition-all
                ${submitting
                  ? "border-amber-700/40 text-amber-500/60 animate-pulse cursor-not-allowed"
                  : "border-amber-700/50 text-amber-400/80 hover:border-amber-600 hover:text-amber-300 hover:bg-amber-950/20"
                }`}
              style={{ animation: "nml-report-reveal 0.3s ease-out" }}
            >
              {submitting ? "送信中…" : `${selected} を送る`}
            </button>
          )}
        </div>
      )}

      {/* 感想コメント一覧（トグル） */}
      {recent.length > 0 && (
        <div className="mt-5">
          <button
            onClick={() => setShowComments((v) => !v)}
            className="text-[10px] font-mono text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1"
          >
            <span>{showComments ? "▾" : "▸"}</span>
            <span>みんなの感想 ({recent.length})</span>
          </button>

          <div
            style={{
              maxHeight: showComments ? `${recent.length * 80}px` : "0px",
              overflow: "hidden",
              transition: "max-height 0.35s ease-out",
            }}
          >
            <div className="mt-3 space-y-2">
              {recent.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-gray-900/40 border border-gray-800/60"
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{r.emoji}</span>
                  <p className="text-xs text-gray-400 leading-relaxed font-sans">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
