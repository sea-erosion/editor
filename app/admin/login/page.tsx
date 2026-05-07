// 編集日時: 2026-05-07 (refactor: トークン入力 → パスワード認証方式に変更)
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const inputRef     = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [blink,    setBlink]    = useState(true);

  // サーバー設定エラーを URL パラメータから表示
  useEffect(() => {
    if (searchParams.get('error') === 'server_config') {
      setError('ERR: サーバー設定エラー — ADMIN_PASSWORD / ADMIN_TOKEN が未設定です');
    }
  }, [searchParams]);

  // カーソル点滅
  useEffect(() => {
    const id = setInterval(() => setBlink(v => !v), 530);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async () => {
    if (!password.trim()) { setError('ERR: パスワードを入力してください'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password: password.trim() }),
      });

      if (res.ok) {
        // P-8: オープンリダイレクト防止 — '/' 始まりの相対パスのみ許可
        const from = searchParams.get('from') ?? '';
        const redirect = from.startsWith('/') && !from.startsWith('//') ? from : '/admin';
        router.replace(redirect);
      } else if (res.status === 401) {
        setError('ERR: 認証に失敗しました — パスワードが正しくありません');
        setPassword('');
        inputRef.current?.focus();
      } else if (res.status === 503) {
        setError('ERR: サーバー設定エラー — ADMIN_PASSWORD / ADMIN_TOKEN が未設定です');
      } else {
        const body = await res.json().catch(() => ({}));
        setError(`ERR: ${body?.error ?? `予期しないエラー (${res.status})`}`);
      }
    } catch {
      setError('ERR: ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="min-h-screen bg-[#06090c] flex items-center justify-center px-4 font-mono">
      {/* 背景グリッド */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(#4ade8040 1px, transparent 1px), linear-gradient(90deg, #4ade8040 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* ヘッダーブロック */}
        <div className="border border-gray-700/60 rounded-none mb-0 px-5 py-3 bg-gray-900/40 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-700/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-700/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-700/80" />
          </div>
          <span className="text-[11px] text-gray-600 tracking-widest flex-1 text-center">
            FOUNDATION ARCHIVE — SECURE TERMINAL
          </span>
        </div>

        {/* ターミナル本体 */}
        <div className="border border-t-0 border-gray-700/60 bg-[#070a0d] px-6 pt-6 pb-7">
          {/* ロゴ */}
          <div className="mb-6 select-none">
            <pre className="text-[10px] leading-tight text-gray-700 overflow-hidden">{`
 ██████╗ ███╗   ███╗ █████╗ ██████╗
██╔════╝████╗ ████║██╔══██╗██╔══██╗
██║  ███╗██╔████╔██║███████║██║  ██║
██║   ██║██║╚██╔╝██║██╔══██║██║  ██║
╚██████╔╝██║ ╚═╝ ██║██║  ██║██████╔╝
 ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝
`.trim()}</pre>
            <p className="text-[10px] text-gray-600 mt-2 tracking-[0.3em] uppercase">
              管理者認証 / Admin Authentication
            </p>
          </div>

          {/* ターミナルログ */}
          <div className="text-[11px] text-gray-600 space-y-0.5 mb-5">
            <p><span className="text-green-700">✓</span> セキュアチャネル確立</p>
            <p><span className="text-green-700">✓</span> 端末 ID 確認済み</p>
            <p><span className="text-yellow-700">→</span> 管理者パスワードが必要です</p>
          </div>

          {/* 入力エリア */}
          <div className="mb-4">
            <label className="block text-[10px] text-gray-600 tracking-widest mb-1.5 uppercase">
              Password
            </label>
            <div className="relative flex items-center border border-gray-700 bg-black/60 focus-within:border-amber-700/70 transition-colors">
              <span className="pl-3 text-amber-600/80 text-xs select-none">$&nbsp;</span>
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                placeholder="••••••••••••••••"
                autoComplete="current-password"
                className="flex-1 bg-transparent px-2 py-3 text-[13px] text-amber-200/90 placeholder:text-gray-800 outline-none tracking-widest disabled:opacity-50"
              />
              <span
                className="pr-3 text-amber-500 text-sm select-none transition-opacity"
                style={{ opacity: blink ? 1 : 0 }}
              >▌</span>
            </div>
          </div>

          {/* エラー */}
          {error && (
            <div className="mb-4 px-3 py-2 border border-red-900/60 bg-red-950/20">
              <p className="text-[11px] text-red-400">{error}</p>
            </div>
          )}

          {/* ボタン */}
          <button
            onClick={handleSubmit}
            disabled={loading || !password.trim()}
            className="w-full py-2.5 border border-amber-800/60 bg-amber-950/20 hover:bg-amber-900/30
              text-amber-400 text-[12px] tracking-[0.2em] uppercase transition-all
              disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? '認証中...' : '認証する  →'}
          </button>

          {/* フッター */}
          <p className="mt-4 text-[10px] text-gray-800 text-center tracking-wider">
            CLEARANCE LEVEL: ADMINISTRATOR / O5-COUNCIL
          </p>
        </div>

        {/* 下部ライン */}
        <div className="border border-t-0 border-gray-800/40 px-5 py-2 flex justify-between text-[10px] text-gray-800">
          <span>SCP-ARCHIVE-MGMT v2.0</span>
          <span>ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
