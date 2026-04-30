import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#06090c] text-gray-300 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="w-14 h-14 border-2 border-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="font-mono text-xs text-gray-500">管理</span>
          </div>
          <h1 className="font-mono text-base text-gray-200 tracking-wider">財団アーカイブ 管理パネル</h1>
          <p className="text-gray-700 text-xs font-mono mt-1">FOUNDATION ARCHIVE ADMIN v1.0</p>
        </div>

        <div className="grid gap-3">
          <Link href="/admin/editor"
            className="flex items-center gap-4 border border-amber-800/40 rounded-xl p-5
              bg-amber-950/10 hover:bg-amber-950/20 hover:border-amber-700/60 transition-all group">
            <div className="text-3xl opacity-60 group-hover:opacity-100 transition-opacity">✍</div>
            <div>
              <div className="font-mono text-sm text-amber-300 font-medium">小説エディタ</div>
              <div className="text-xs text-gray-600 mt-0.5">小説・章の作成・編集・NMLプレビュー</div>
            </div>
            <span className="ml-auto text-gray-700 group-hover:text-amber-600 transition-colors">→</span>
          </Link>

          <Link href="/admin/entities"
            className="flex items-center gap-4 border border-cyan-800/40 rounded-xl p-5
              bg-cyan-950/10 hover:bg-cyan-950/20 hover:border-cyan-700/60 transition-all group">
            <div className="text-3xl opacity-60 group-hover:opacity-100 transition-opacity">⬡</div>
            <div>
              <div className="font-mono text-sm text-cyan-300 font-medium">エンティティ管理</div>
              <div className="text-xs text-gray-600 mt-0.5">アノマリー・施設・人員・インシデントのCRUD</div>
            </div>
            <span className="ml-auto text-gray-700 group-hover:text-cyan-600 transition-colors">→</span>
          </Link>

          <Link href="/"
            className="flex items-center gap-4 border border-gray-700/40 rounded-xl p-4
              bg-gray-900/20 hover:bg-gray-900/40 transition-all group">
            <div className="text-2xl opacity-40 group-hover:opacity-70 transition-opacity">◼</div>
            <div>
              <div className="font-mono text-sm text-gray-400">公開サイトを表示</div>
              <div className="text-xs text-gray-600 mt-0.5">読者向けページを確認</div>
            </div>
            <span className="ml-auto text-gray-700 transition-colors">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
