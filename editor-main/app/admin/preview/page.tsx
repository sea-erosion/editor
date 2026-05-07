// 編集日時: 2026-05-03
"use client";
import { adminFetch } from "@/lib/admin-fetch";
import { NovelRenderer } from "@/components/novel/NovelRenderer";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function PreviewContent() {
  const params = useSearchParams();
  const chapterId = params.get("chapter");
  const [content, setContent] = useState("");
  const [title, setTitle]   = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chapterId) return;
    queueMicrotask(() => setLoading(true));
    adminFetch(`/api/admin/chapters/${chapterId}`)
      .then(r => r.json())
      .then(d => { setContent(d.content ?? ""); setTitle(d.title ?? ""); })
      .finally(() => setLoading(false));
  }, [chapterId]);

  if (!chapterId) return (
    <div className="text-center mt-32">
      <p className="font-mono text-gray-700 text-sm">chapter=ID をURLに指定してください</p>
      <p className="font-mono text-gray-800 text-xs mt-1">例: /admin/preview?chapter=ch-XXXXX</p>
    </div>
  );

  if (loading) return <div className="text-center mt-32"><p className="font-mono text-gray-700 text-sm">読み込み中…</p></div>;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-serif text-2xl text-gray-100 mb-8 pb-6 border-b border-gray-800">{title}</h1>
      <NovelRenderer content={content} />
    </div>
  );
}

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-[#06090c] text-gray-300">
      <div className="sticky top-0 z-10 bg-[#06090c]/90 backdrop-blur-sm border-b border-gray-800 flex items-center gap-3 px-6 py-2">
        <Link href="/admin/editor" className="text-gray-600 hover:text-gray-400 font-mono text-xs">← エディタ</Link>
        <span className="text-[10px] font-mono text-gray-700 tracking-widest">NML フルプレビュー</span>
      </div>
      <Suspense fallback={<div className="text-center mt-32"><p className="font-mono text-gray-700">読み込み中…</p></div>}>
        <PreviewContent />
      </Suspense>
    </div>
  );
}
