// 編集日時: 2026-05-03
/**
 * 管理API用 fetch ラッパー
 * すべての /api/admin/** リクエストにこの関数を使うこと。
 * Authorization ヘッダーを自動付与する。
 */
export async function adminFetch(input: string, init?: RequestInit): Promise<Response> {
  const token = process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? '';

  return fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
}
