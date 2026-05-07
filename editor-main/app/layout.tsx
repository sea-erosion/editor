import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "財団アーカイブ — 機密小説データベース",
  description: "財団機密ナラティブデータベース",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-[#080c0f] text-gray-300 min-h-screen antialiased">
        <div className="fixed inset-0 pointer-events-none z-0" style={{backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)"}} />
        <header className="relative z-10 border-b border-gray-800/80 bg-[#050810]/90 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <p className="text-[10px] font-mono text-gray-600 tracking-widest">財団セキュアドキュメントシステム v4.2.1</p>
              <p className="text-[10px] font-mono text-gray-600"><span className="text-green-700 mr-1">●</span>接続中 — E2E暗号化</p>
            </div>
            <div className="py-4 flex items-center gap-6">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 border-2 border-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 font-mono text-xs font-bold">財団</span>
                </div>
                <div>
                  <h1 className="text-gray-200 font-mono text-sm font-semibold tracking-wide">財団アーカイブ</h1>
                  <p className="text-gray-600 text-[10px] font-mono">FOUNDATION SECURE NARRATIVE DATABASE</p>
                </div>
              </Link>
              <nav className="ml-auto flex items-center gap-4">
                <Link href="/" className="text-xs font-mono text-gray-500 hover:text-gray-300 transition-colors">ナラティブ</Link>
                <Link href="/entities/anomaly" className="text-xs font-mono text-gray-500 hover:text-amber-400 transition-colors">アノマリー</Link>
                <Link href="/entities/personnel" className="text-xs font-mono text-gray-500 hover:text-violet-400 transition-colors">人員</Link>
                <Link href="/entities/facility" className="text-xs font-mono text-gray-500 hover:text-green-400 transition-colors">施設</Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 pb-24 lg:pb-8">{children}</main>
        <footer className="relative z-10 border-t border-gray-800/50 mt-16 py-6">
          <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
            <p className="text-[10px] font-mono text-gray-700">© 財団 — 全権留保</p>
            <p className="text-[10px] font-mono text-gray-700">本文書に含まれる情報の漏洩は重大な安全保障上のリスクをもたらします</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
