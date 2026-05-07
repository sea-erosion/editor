// 編集日時: 2026-05-07 (new: ログアウトAPI — セッションCookieを削除)
import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'admin_session';

// POST /api/admin/logout
export async function POST() {
  return new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Max-Age=0 で即時削除
      'Set-Cookie': `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`,
    },
  });
}
