// 編集日時: 2026-04-29
import Link from "next/link";

const LINKS = [
  { href: "/admin/editor",   icon: "✍", color: "amber",  title: "小説エディタ",        sub: "執筆・章管理・NMLプレビュー・版管理・メモ" },
  { href: "/admin/entities", icon: "⬡", color: "cyan",   title: "エンティティ管理",    sub: "アノマリー・施設・人員・インシデントのCRUD" },
  { href: "/admin/search",   icon: "🔍", color: "gray",   title: "全文検索",            sub: "章・エンティティをキーワードで横断検索" },
  { href: "/admin/stats",    icon: "📊", color: "gray",   title: "執筆統計",            sub: "文字数・章数・更新履歴のグラフ表示" },
  { href: "/admin/backup",   icon: "💾", color: "gray",   title: "バックアップ / インポート", sub: "全データのJSON書き出し・読み込み" },
  { href: "/",               icon: "◼", color: "none",   title: "公開サイトを表示",    sub: "読者向けページを確認" },
];

const COLOR_MAP: Record<string, string> = {
  amber: "border-amber-800/40 bg-amber-950/10 hover:bg-amber-950/20 hover:border-amber-700/60",
  cyan:  "border-cyan-800/40  bg-cyan-950/10  hover:bg-cyan-950/20  hover:border-cyan-700/60",
  gray:  "border-gray-700/40  bg-gray-900/20  hover:bg-gray-900/40",
  none:  "border-gray-700/30  bg-transparent  hover:bg-gray-900/20",
};
const TITLE_COLOR: Record<string, string> = {
  amber: "text-amber-300", cyan: "text-cyan-300", gray: "text-gray-300", none: "text-gray-400",
};

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#06090c] text-gray-300 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="w-14 h-14 border-2 border-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="font-mono text-xs text-gray-500">管理</span>
          </div>
          <h1 className="font-mono text-base text-gray-200 tracking-wider">財団アーカイブ 管理パネル</h1>
          <p className="text-gray-700 text-xs font-mono mt-1">FOUNDATION ARCHIVE ADMIN v2.0</p>
        </div>

        <div className="grid gap-3">
          {LINKS.map(({ href, icon, color, title, sub }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-4 border rounded-xl p-4 transition-all group ${COLOR_MAP[color]}`}>
              <div className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <div className={`font-mono text-sm font-medium ${TITLE_COLOR[color]}`}>{title}</div>
                <div className="text-xs text-gray-600 mt-0.5">{sub}</div>
              </div>
              <span className="text-gray-700 group-hover:text-gray-400 transition-colors">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
