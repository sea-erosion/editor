// 編集日時: 2026-05-07 (refactor: localStorage廃止・HttpOnly Cookie方式に完全移行)
/**
 * 管理API用 fetch ラッパー
 * すべての /api/admin/** リクエストにこの関数を使うこと。
 *
 * 認証は HttpOnly Cookie（admin_session）で行う。
 * Cookie はブラウザが自動送信するため、このラッパーで特別な処理は不要。
 * 401 受信時はログインページへ自動リダイレクトする。
 *
 * ⚠️ localStorage / NEXT_PUBLIC_ADMIN_TOKEN は廃止。使用しないこと。
 */

export async function adminFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    credentials: 'same-origin', // Cookie を自動送信
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  // 401 はセッション切れ → ログインページへリダイレクト
  if (res.status === 401 && typeof window !== 'undefined') {
    const from = encodeURIComponent(window.location.pathname);
    window.location.replace(`/admin/login?from=${from}`);
  }

  return res;
}
